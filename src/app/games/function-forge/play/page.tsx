"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Firefly, { type FireflyMood } from "@/components/Firefly";
import CodeEditor from "@/components/CodeEditor";
import MuteButton from "@/components/MuteButton";
import ForgeNameEntryModal from "@/components/ForgeNameEntryModal";
import { FORGE_META } from "@/lib/levels/function-forge-meta";
import {
  getForgeLevelsByDifficulty,
  prepareForgeLevel,
  type FunctionForgeLevel,
  type PreparedForgeLevel,
} from "@/lib/levels/function-forge-levels";
import { runFunctionTests, type ForgeRunResult } from "@/lib/pyodide";
import { calculateForgeScore } from "@/lib/score";
import { playRun, playSuccess, playWrong, setMuted } from "@/lib/sounds";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

export default function PlayPageWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">กำลังโหลด...</div>}>
      <PlayPage />
    </Suspense>
  );
}

type ResultState =
  | { type: "idle" }
  | { type: "running" }
  | { type: "done"; run: ForgeRunResult };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PlayPage() {
  const params = useSearchParams();
  const levelParam = params.get("level") ?? "";
  const isValidLevel = (DIFFICULTIES as string[]).includes(levelParam);
  const level = levelParam as Difficulty;

  // pool ของด่านในระดับนี้ (สุ่มลำดับครั้งเดียว) + เซ็ตของ id ที่เล่นไปแล้ว
  const pool = useMemo<FunctionForgeLevel[]>(
    () => (isValidLevel ? shuffle(getForgeLevelsByDifficulty(level)) : []),
    [level, isValidLevel],
  );
  const playedRef = useRef<Set<string>>(new Set());

  const [current, setCurrent] = useState<PreparedForgeLevel | null>(null);
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [result, setResult] = useState<ResultState>({ type: "idle" });
  const [solved, setSolved] = useState(false);
  const [mood, setMood] = useState<FireflyMood>("thinking");
  const [muted, setMutedState] = useState(false);
  const [pyLoading, setPyLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submittedName, setSubmittedName] = useState(false);

  const sadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // เลือกด่านถัดไป: สุ่มจาก pool ที่ยังไม่ได้เล่น ถ้าครบหมดแล้วรีเซ็ตแล้วสุ่มใหม่
  const pickNext = useCallback(() => {
    if (pool.length === 0) return;
    let candidates = pool.filter((l) => !playedRef.current.has(l.id));
    if (candidates.length === 0) {
      // เล่นครบทุกด่านใน pool แล้ว → เริ่มรอบใหม่
      playedRef.current = new Set();
      candidates = pool;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    playedRef.current.add(chosen.id);
    const prepared = prepareForgeLevel(chosen);

    setCurrent(prepared);
    setCode(prepared.starterCode);
    setSeconds(0);
    setRunCount(0);
    setResult({ type: "idle" });
    setSolved(false);
    setMood("thinking");
    setShowModal(false);
    setSubmittedName(false);
  }, [pool]);

  // โหลดด่านแรกเมื่อเข้าหน้า
  useEffect(() => {
    if (isValidLevel) pickNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidLevel, pickNext]);

  // จับเวลา: นับขึ้นทุกวินาทีจนกว่าจะแก้ถูก
  useEffect(() => {
    if (!current || solved) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [current, solved]);

  // sync สถานะ mute ไปยังโมดูลเสียง
  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  // เปลี่ยนมาสคอตเป็น thinking เมื่อผู้เล่นเริ่มพิมพ์แก้โค้ด (หลังเคยตอบผิด)
  const handleCodeChange = (v: string) => {
    setCode(v);
    if (!solved && mood !== "thinking") setMood("thinking");
  };

  // หลังตอบถูก: เช็คกับ server ว่าคะแนนติด top 10 ไหม ถ้าติดให้เปิด modal กรอกชื่อ
  const checkLeaderboard = async (finalScore: number) => {
    try {
      const res = await fetch("/api/function-forge/leaderboard/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, score: finalScore }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.qualifies) setShowModal(true);
    } catch {
      // ไม่มี DB / ออฟไลน์ → ข้ามการบันทึกคะแนนไปเงียบ ๆ
    }
  };

  const handleRun = async () => {
    if (!current || solved) return;
    playRun();
    // นับครั้งที่กด Run (รอบนี้รวมด้วย) ใช้คำนวณคะแนนทันที
    const newRun = runCount + 1;
    setRunCount(newRun);
    setResult({ type: "running" });
    setMood("thinking");

    // ครั้งแรกอาจต้องโหลด Pyodide สักครู่
    setPyLoading(true);
    const allTests = [...current.visibleTests, ...current.hiddenTests];
    const run = await runFunctionTests(code, current.functionName, allTests);
    setPyLoading(false);

    setResult({ type: "done", run });

    const total = allTests.length;
    const passed = run.results.filter((r) => r.pass).length;
    const allPass = !run.defineError && total > 0 && passed === total;

    if (allPass) {
      // ผ่านครบทุก test → เคลียร์ด่าน
      setSolved(true);
      setMood("happy");
      playSuccess();
      void checkLeaderboard(calculateForgeScore(seconds, newRun));
    } else {
      // ยังไม่ครบ: มาสคอตเศร้าชั่วครู่แล้วกลับมา thinking
      setMood("sad");
      playWrong();
      if (sadTimer.current) clearTimeout(sadTimer.current);
      sadTimer.current = setTimeout(() => setMood("thinking"), 1500);
    }
  };

  if (!isValidLevel) {
    return (
      <main className="mx-auto max-w-2xl p-10 text-center">
        <p className="mb-4 text-danger">ไม่พบระดับความยากนี้</p>
        <Link href="/games/function-forge" className="text-accent underline">
          กลับไปเลือกระดับ
        </Link>
      </main>
    );
  }

  const meta = FORGE_META[level];
  const score = calculateForgeScore(seconds, runCount);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* แถบบน: ชื่อเกม, badge ระดับ, เวลา, ปุ่มกลับ + mute */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/games/function-forge"
            className="text-sm text-muted transition hover:text-accent"
          >
            ← เลือกระดับ
          </Link>
          <span className="text-lg font-bold">🔨 Function Forge</span>
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${meta.color}`}
          >
            {level}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-sm tabular-nums">
            ⏱ {formatTime(seconds)}
          </span>
          <MuteButton muted={muted} onToggle={() => setMutedState((m) => !m)} />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* คอลัมน์ซ้าย: โจทย์ + editor + ผลการทดสอบ */}
        <section>
          {current && (
            <>
              <div className="mb-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-accent">{current.title}</h2>
                  <code className="rounded bg-bg px-1.5 py-0.5 text-xs text-warn">
                    {current.functionName}()
                  </code>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {current.description}
                </p>
              </div>

              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                bugLineNumber={-1}
                assist={false}
                readOnly={solved}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRun}
                  disabled={result.type === "running" || solved}
                  className="rounded-md bg-success px-5 py-2 font-bold text-bg transition hover:bg-success/90 disabled:opacity-50"
                >
                  {result.type === "running"
                    ? pyLoading
                      ? "กำลังเตรียม Python..."
                      : "กำลังรัน..."
                    : "▶ Run Tests"}
                </button>
                <button
                  onClick={pickNext}
                  className={`rounded-md border px-4 py-2 text-sm transition ${
                    solved
                      ? "border-accent bg-accent text-bg hover:bg-accent/90"
                      : "border-border bg-surface text-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {solved ? "ด่านถัดไป →" : "ข้าม / สุ่มด่านใหม่"}
                </button>
              </div>

              <ResultPanel
                result={result}
                visibleCount={current.visibleTests.length}
                visibleTests={current.visibleTests}
              />
            </>
          )}
        </section>

        {/* คอลัมน์ขวา: มาสคอต + สถานะ */}
        <aside className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-5">
          <Firefly mood={mood} />
          <MascotMessage mood={mood} solved={solved} />
          <div className="w-full space-y-2 text-sm">
            <StatRow label="เวลา" value={formatTime(seconds)} />
            <StatRow label="กด Run" value={`${runCount} ครั้ง`} />
            <StatRow label="คะแนนปัจจุบัน" value={String(score)} highlight />
          </div>
          <Link
            href="/games/function-forge/leaderboard"
            className="mt-1 text-xs text-muted underline transition hover:text-accent"
          >
            ดู Leaderboard
          </Link>
        </aside>
      </div>

      {/* modal กรอกชื่อเมื่อติด top 10 */}
      {showModal && current && !submittedName && (
        <ForgeNameEntryModal
          level={level}
          score={score}
          timeSeconds={seconds}
          runCount={runCount}
          levelId={current.id}
          onClose={() => setShowModal(false)}
          onSubmitted={() => {
            setSubmittedName(true);
            setShowModal(false);
          }}
        />
      )}
    </main>
  );
}

function ResultPanel({
  result,
  visibleCount,
  visibleTests,
}: {
  result: ResultState;
  visibleCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visibleTests: { input: any[]; expectedOutput: any }[];
}) {
  if (result.type === "idle" || result.type === "running") return null;

  const { run } = result;

  // syntax error / หาฟังก์ชันไม่เจอ → แสดง error อย่างเดียว
  if (run.defineError) {
    return (
      <div className="mt-4 rounded-lg border border-danger bg-danger/10 p-4">
        <div className="mb-2 font-bold text-danger">✗ โค้ดมีปัญหา</div>
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-danger">
          {run.defineError}
        </pre>
      </div>
    );
  }

  const total = run.results.length;
  const passed = run.results.filter((r) => r.pass).length;
  const allPass = total > 0 && passed === total;

  const visibleResults = run.results.slice(0, visibleCount);
  const hiddenResults = run.results.slice(visibleCount);
  const hiddenFailed = hiddenResults.some((r) => !r.pass);
  const visibleAllPass = visibleResults.every((r) => r.pass);

  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${
        allPass ? "border-success bg-success/10" : "border-danger bg-danger/10"
      }`}
    >
      <div
        className={`mb-3 font-bold ${allPass ? "text-success" : "text-danger"}`}
      >
        {allPass ? "✓ ผ่านครบทุก test! เคลียร์ด่าน" : "✗ ยังไม่ผ่าน"} · ผ่าน{" "}
        {passed}/{total} test
      </div>

      {/* รายละเอียดเฉพาะ visible test */}
      <div className="space-y-2">
        {visibleResults.map((r, i) => {
          const t = visibleTests[i];
          return (
            <div
              key={i}
              className="rounded-md border border-border bg-bg p-3 text-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={r.pass ? "text-success" : "text-danger"}>
                  {r.pass ? "✓" : "✗"}
                </span>
                <span className="text-xs text-muted">Test {i + 1}</span>
              </div>
              <div className="grid gap-1 font-mono text-xs sm:grid-cols-3">
                <div>
                  <span className="text-muted">input: </span>
                  <span className="text-[#e6edf3]">{formatArgs(t.input)}</span>
                </div>
                <div>
                  <span className="text-muted">expected: </span>
                  <span className="text-success">{r.expected}</span>
                </div>
                <div>
                  <span className="text-muted">got: </span>
                  <span className={r.pass ? "text-[#e6edf3]" : "text-danger"}>
                    {r.error ? r.error : r.actual}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* hidden test: ไม่เปิดรายละเอียด บอกแค่ผ่าน/ไม่ผ่านแบบรวม ๆ */}
      {hiddenResults.length > 0 && (
        <div className="mt-3 rounded-md border border-border bg-bg p-3 text-sm">
          <div className="text-xs text-muted">
            🔒 Hidden test ({hiddenResults.length} ข้อ):{" "}
            <span
              className={hiddenFailed ? "text-danger" : "text-success"}
            >
              ผ่าน {hiddenResults.filter((r) => r.pass).length}/
              {hiddenResults.length}
            </span>
          </div>
          {hiddenFailed && visibleAllPass && (
            <p className="mt-1 text-xs text-muted">
              ยังไม่ผ่าน hidden test บางข้อ ลองตรวจสอบกรณีพิเศษ (edge case) เช่น
              ลิสต์ว่าง ค่าซ้ำ ค่าติดลบ หรือค่าน้อย/มากสุด ดูอีกที
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MascotMessage({
  mood,
  solved,
}: {
  mood: FireflyMood;
  solved: boolean;
}) {
  let text = "ค่อย ๆ คิดนะ เขียนให้ผ่านทุก test!";
  if (solved) text = "เก่งมาก! ไปด่านต่อไปกันเลย 🎉";
  else if (mood === "sad") text = "ยังไม่ครบนะ ลองดูใหม่อีกที";
  return (
    <p className="min-h-[2.5rem] text-center text-sm text-muted">{text}</p>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-bg px-3 py-2">
      <span className="text-muted">{label}</span>
      <span
        className={`font-mono font-bold tabular-nums ${
          highlight ? "text-success" : "text-[#e6edf3]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// แปลง argument list เป็นข้อความ เช่น [[1,2,3], 2] → "[1, 2, 3], 2"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatArgs(args: any[]): string {
  return args.map((a) => JSON.stringify(a)).join(", ");
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
