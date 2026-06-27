"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Firefly, { type FireflyMood } from "@/components/Firefly";
import CodeEditor from "@/components/CodeEditor";
import HintButton from "@/components/HintButton";
import MuteButton from "@/components/MuteButton";
import NameEntryModal from "@/components/NameEntryModal";
import { DIFFICULTY_META } from "@/lib/levels/difficulty-meta";
import {
  getLevelsByDifficulty,
  prepareLevel,
  type BugHuntLevel,
  type PreparedLevel,
} from "@/lib/levels/bug-hunt-levels";
import { outputMatches, runPython } from "@/lib/pyodide";
import { calculateScore } from "@/lib/score";
import { playRun, playSuccess, playWrong, setMuted } from "@/lib/sounds";
import { DIFFICULTIES, hasAssist, type Difficulty } from "@/lib/types";

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
  | { type: "pass"; stdout: string }
  | { type: "fail"; stdout: string; error: string; expected: string };

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
  const pool = useMemo<BugHuntLevel[]>(
    () => (isValidLevel ? shuffle(getLevelsByDifficulty(level)) : []),
    [level, isValidLevel],
  );
  const playedRef = useRef<Set<string>>(new Set());

  const [current, setCurrent] = useState<PreparedLevel | null>(null);
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
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
    const prepared = prepareLevel(chosen);

    setCurrent(prepared);
    setCode(prepared.code);
    setSeconds(0);
    setWrongAttempts(0);
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

  const handleRun = async () => {
    if (!current || solved) return;
    playRun();
    setResult({ type: "running" });
    setMood("thinking");

    // ครั้งแรกอาจต้องโหลด Pyodide สักครู่
    setPyLoading(true);
    const res = await runPython(code);
    setPyLoading(false);

    if (res.ok && outputMatches(res.stdout, current.expectedOutput)) {
      // ตอบถูก
      setResult({ type: "pass", stdout: res.stdout });
      setSolved(true);
      setMood("happy");
      playSuccess();
      void checkLeaderboard();
    } else {
      // ตอบผิด: นับครั้ง + มาสคอตเศร้าชั่วครู่แล้วกลับมา thinking
      setWrongAttempts((w) => w + 1);
      setResult({
        type: "fail",
        stdout: res.stdout,
        error: res.error,
        expected: current.expectedOutput,
      });
      setMood("sad");
      playWrong();
      if (sadTimer.current) clearTimeout(sadTimer.current);
      sadTimer.current = setTimeout(() => setMood("thinking"), 1500);
    }
  };

  // หลังตอบถูก: เช็คกับ server ว่าคะแนนติด top 10 ไหม ถ้าติดให้เปิด modal กรอกชื่อ
  const checkLeaderboard = async () => {
    const score = calculateScore(seconds, wrongAttempts);
    try {
      const res = await fetch("/api/leaderboard/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, score }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.qualifies) setShowModal(true);
    } catch {
      // ไม่มี DB / ออฟไลน์ → ข้ามการบันทึกคะแนนไปเงียบ ๆ
    }
  };

  if (!isValidLevel) {
    return (
      <main className="mx-auto max-w-2xl p-10 text-center">
        <p className="mb-4 text-danger">ไม่พบระดับความยากนี้</p>
        <Link href="/games/bug-hunt" className="text-accent underline">
          กลับไปเลือกระดับ
        </Link>
      </main>
    );
  }

  const meta = DIFFICULTY_META[level];
  const assist = hasAssist(level);
  const score = calculateScore(seconds, wrongAttempts);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* แถบบน: ชื่อเกม, badge ระดับ, เวลา, ปุ่มกลับ + mute */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/games/bug-hunt"
            className="text-sm text-muted transition hover:text-accent"
          >
            ← เลือกระดับ
          </Link>
          <span className="text-lg font-bold">🐛 Bug Hunt</span>
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
        {/* คอลัมน์ซ้าย: โจทย์ + editor + output */}
        <section>
          {current && (
            <>
              <div className="mb-4 rounded-lg border border-border bg-surface p-4">
                <h2 className="font-bold text-accent">{current.title}</h2>
                <p className="mt-1 text-sm text-muted">{current.description}</p>
                <div className="mt-2 text-xs text-muted">
                  ผลลัพธ์ที่ต้องการ:{" "}
                  <code className="rounded bg-bg px-1.5 py-0.5 text-success">
                    {current.expectedOutput.replace(/\n/g, " ⏎ ")}
                  </code>
                </div>
              </div>

              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                bugLineNumber={current.bugLineNumber}
                assist={assist}
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
                    : "▶ Run"}
                </button>
                <HintButton enabled={assist} hint={current.hint} />
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

              <OutputPanel result={result} />
            </>
          )}
        </section>

        {/* คอลัมน์ขวา: มาสคอต + สถานะ */}
        <aside className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-5">
          <Firefly mood={mood} />
          <MascotMessage mood={mood} solved={solved} />
          <div className="w-full space-y-2 text-sm">
            <StatRow label="เวลา" value={formatTime(seconds)} />
            <StatRow label="ตอบผิด" value={`${wrongAttempts} ครั้ง`} />
            <StatRow
              label="คะแนนปัจจุบัน"
              value={String(score)}
              highlight
            />
          </div>
          <Link
            href="/games/bug-hunt/leaderboard"
            className="mt-1 text-xs text-muted underline transition hover:text-accent"
          >
            ดู Leaderboard
          </Link>
        </aside>
      </div>

      {/* modal กรอกชื่อเมื่อติด top 10 */}
      {showModal && current && !submittedName && (
        <NameEntryModal
          level={level}
          score={score}
          timeSeconds={seconds}
          wrongAttempts={wrongAttempts}
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

function OutputPanel({ result }: { result: ResultState }) {
  if (result.type === "idle" || result.type === "running") return null;

  if (result.type === "pass") {
    return (
      <div className="mt-4 rounded-lg border border-success bg-success/10 p-4">
        <div className="mb-1 font-bold text-success">✓ ถูกต้อง! เคลียร์ด่าน</div>
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-[#e6edf3]">
          {result.stdout || "(ไม่มีผลลัพธ์)"}
        </pre>
      </div>
    );
  }

  // fail
  return (
    <div className="mt-4 rounded-lg border border-danger bg-danger/10 p-4">
      <div className="mb-2 font-bold text-danger">✗ ยังไม่ถูก ลองอีกครั้ง</div>
      {result.error ? (
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-danger">
          {result.error}
        </pre>
      ) : (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted">ผลลัพธ์ที่ได้</div>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-bg p-2">
              {result.stdout || "(ว่าง)"}
            </pre>
          </div>
          <div>
            <div className="text-xs text-muted">ผลลัพธ์ที่ต้องการ</div>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-bg p-2 text-success">
              {result.expected}
            </pre>
          </div>
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
  let text = "ค่อย ๆ ดูโค้ดนะ เดี๋ยวก็เจอบั๊ก!";
  if (solved) text = "เก่งมาก! ไปด่านต่อไปกันเลย 🎉";
  else if (mood === "sad") text = "ยังไม่ถูกนะ ลองดูใหม่อีกที";
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

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
