"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import CodeEditor from "@/components/CodeEditor";
import Firefly, { type FireflyMood } from "@/components/Firefly";
import MazeBoard from "@/components/MazeBoard";
import { parseMaze } from "@/lib/maze";
import { runArenaBot, type ArenaFrame } from "@/lib/pyodide";
import { calculateArenaScore } from "@/lib/score";
import { playRun, playSuccess, playWrong } from "@/lib/sounds";
import type { PreparedArenaLevel } from "@/lib/levels/code-arena-levels";

// สถิติที่ส่งกลับให้ parent เมื่อผ่านด่าน (ใช้ทั้ง leaderboard solo และ submit-level multiplayer)
export interface ArenaSolveStats {
  timeSeconds: number;
  stepsUsed: number;
  wallHits: number;
  score: number;
}

interface ArenaPlayProps {
  level: PreparedArenaLevel;
  // เรียกครั้งเดียวเมื่อผู้เล่นพา bot ถึงเป้าหมายสำเร็จ
  onSolved: (stats: ArenaSolveStats) => void;
  // slot ปุ่ม/เนื้อหาเพิ่มเติมใต้กล่อง editor (เช่นปุ่มข้าม/ด่านถัดไป)
  actionSlot?: ReactNode;
  // slot ใต้แผงสถิติด้านขวา (เช่นลิงก์ leaderboard หรือสกอร์บอร์ดห้อง)
  sidebarSlot?: ReactNode;
}

// สร้างโค้ดเริ่มต้นในกล่อง editor พร้อมคำอธิบาย bot API
function starterCodeFor(level: PreparedArenaLevel): string {
  const itemLine = level.requiresAllItems
    ? "# is_item_here(), collect_item(), items_collected()\n# *** ด่านนี้ต้องเก็บไอเทม ⭐ ให้ครบก่อนถึงธง ***\n"
    : "";
  return (
    "# คุมหุ่นยนต์ให้เดินไปถึงธง 🏁\n" +
    "# คำสั่งที่ใช้ได้:\n" +
    "#   move_forward()  turn_left()  turn_right()\n" +
    "#   is_wall_ahead()  is_at_goal()\n" +
    itemLine +
    "\n"
  );
}

type AnimState = "idle" | "playing" | "done";

const SPEEDS = [1, 2, 4];

export default function ArenaPlay({
  level,
  onSolved,
  actionSlot,
  sidebarSlot,
}: ArenaPlayProps) {
  const maze = parseMaze(level.grid);

  const [code, setCode] = useState(() => starterCodeFor(level));
  const [seconds, setSeconds] = useState(0);
  const [solved, setSolved] = useState(false);
  const [running, setRunning] = useState(false);
  const [pyLoading, setPyLoading] = useState(false);
  const [mood, setMood] = useState<FireflyMood>("thinking");
  const [speed, setSpeed] = useState(1);

  // ผลการรันล่าสุด + สถานะ animation
  const [frames, setFrames] = useState<ArenaFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [lastResult, setLastResult] = useState<{
    reached: boolean;
    steps: number;
    wallHits: number;
    itemsCollected: number;
    totalItems: number;
    error: string | null;
    limitHit: boolean;
  } | null>(null);

  const solvedFiredRef = useRef(false);

  // รีเซ็ตทุกอย่างเมื่อเปลี่ยนด่าน (level prop เปลี่ยน)
  useEffect(() => {
    setCode(starterCodeFor(level));
    setSeconds(0);
    setSolved(false);
    setRunning(false);
    setMood("thinking");
    setFrames([]);
    setFrameIdx(0);
    setAnimState("idle");
    setLastResult(null);
    solvedFiredRef.current = false;
  }, [level]);

  // จับเวลา: นับขึ้นจนกว่าจะผ่านด่าน
  useEffect(() => {
    if (solved) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [solved]);

  // เล่น animation: เดินหน้า frameIdx ตามความเร็วที่เลือก
  useEffect(() => {
    if (animState !== "playing") return;
    if (frameIdx >= frames.length - 1) {
      setAnimState("done");
      return;
    }
    const delay = 180 / speed;
    const id = setTimeout(() => setFrameIdx((i) => i + 1), delay);
    return () => clearTimeout(id);
  }, [animState, frameIdx, frames.length, speed]);

  // เมื่อ animation เล่นจบ ประเมินผลและแจ้ง parent ถ้าผ่าน
  useEffect(() => {
    if (animState !== "done" || !lastResult) return;
    if (lastResult.reached) {
      if (!solvedFiredRef.current) {
        solvedFiredRef.current = true;
        setSolved(true);
        setMood("happy");
        playSuccess();
        const score = calculateArenaScore(
          seconds,
          lastResult.steps,
          level.optimalSteps,
          lastResult.wallHits,
        );
        onSolved({
          timeSeconds: seconds,
          stepsUsed: lastResult.steps,
          wallHits: lastResult.wallHits,
          score,
        });
      }
    } else {
      setMood("sad");
      playWrong();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animState, lastResult]);

  const handleRun = useCallback(async () => {
    if (running || solved) return;
    playRun();
    setRunning(true);
    setMood("thinking");
    setAnimState("idle");
    setLastResult(null);
    setPyLoading(true);

    const result = await runArenaBot(code, {
      grid: level.grid,
      startDirection: level.startDirection,
      requiresAllItems: level.requiresAllItems,
    });
    setPyLoading(false);
    setRunning(false);

    setLastResult({
      reached: result.reached,
      steps: result.steps,
      wallHits: result.wallHits,
      itemsCollected: result.itemsCollected,
      totalItems: result.totalItems,
      error: result.error,
      limitHit: result.limitHit,
    });
    setFrames(result.frames);
    setFrameIdx(0);
    // ถ้ามีเฟรมให้เล่น animation, ถ้าไม่มี (error ตั้งแต่ยังไม่ขยับ) ข้ามไปสรุปผลเลย
    setAnimState(result.frames.length > 1 ? "playing" : "done");
  }, [code, level, running, solved]);

  const replay = useCallback(() => {
    if (frames.length === 0) return;
    setFrameIdx(0);
    setAnimState("playing");
  }, [frames.length]);

  // เฟรมปัจจุบันที่จะวาด (ถ้ายังไม่รัน ใช้ตำแหน่งเริ่มต้น)
  const curFrame: ArenaFrame | null = frames[frameIdx] ?? null;
  const botR = curFrame ? curFrame.r : maze.start.r;
  const botC = curFrame ? curFrame.c : maze.start.c;
  const botDir = curFrame ? curFrame.dir : level.startDirection;

  // ช่องไอเทมที่เก็บไปแล้วจนถึงเฟรมปัจจุบัน
  const collected = new Set<string>();
  for (let i = 0; i <= frameIdx && i < frames.length; i++) {
    const cell = frames[i].collectedCell;
    if (cell) collected.add(`${cell[0]},${cell[1]}`);
  }

  const boardStatus: "idle" | "happy" | "sad" =
    animState === "done" && lastResult
      ? lastResult.reached
        ? "happy"
        : "sad"
      : "idle";

  const displayScore = lastResult
    ? calculateArenaScore(
        seconds,
        lastResult.steps,
        level.optimalSteps,
        lastResult.wallHits,
      )
    : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* คอลัมน์ซ้าย: maze + editor */}
      <section className="min-w-0">
        <div className="mb-4 rounded-lg border border-border bg-surface p-4">
          <h2 className="font-bold text-accent">{level.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {level.description}
          </p>
        </div>

        <MazeBoard
          grid={level.grid}
          botR={botR}
          botC={botC}
          botDir={botDir}
          collected={collected}
          status={boardStatus}
        />

        {/* แถบควบคุม animation */}
        {frames.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
            <button
              onClick={replay}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-muted transition hover:border-accent hover:text-accent"
            >
              ↻ เล่นซ้ำ
            </button>
            <span className="font-mono text-xs text-muted">
              เฟรม {Math.min(frameIdx + 1, frames.length)}/{frames.length}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted">ความเร็ว</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`rounded border px-2 py-0.5 text-xs font-bold transition ${
                    speed === s
                      ? "border-accent text-accent"
                      : "border-border text-muted hover:text-[#e6edf3]"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <CodeEditor
            value={code}
            onChange={(v) => {
              setCode(v);
              if (!solved && mood !== "thinking") setMood("thinking");
            }}
            bugLineNumber={-1}
            assist={false}
            readOnly={solved}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRun}
            disabled={running || solved || animState === "playing"}
            className="rounded-md bg-success px-5 py-2 font-bold text-bg transition hover:bg-success/90 disabled:opacity-50"
          >
            {running
              ? pyLoading
                ? "กำลังเตรียม Python..."
                : "กำลังรัน..."
              : animState === "playing"
                ? "กำลังเล่น..."
                : "▶ Run"}
          </button>
          {actionSlot}
        </div>

        <ResultPanel
          animState={animState}
          result={lastResult}
          optimalSteps={level.optimalSteps}
        />
      </section>

      {/* คอลัมน์ขวา: มาสคอต + สถิติ */}
      <aside className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-5">
        <Firefly mood={mood} />
        <MascotMessage mood={mood} solved={solved} result={lastResult} />
        <div className="w-full space-y-2 text-sm">
          <StatRow label="เวลา" value={formatTime(seconds)} />
          <StatRow
            label="step (optimal)"
            value={
              lastResult ? `${lastResult.steps} (${level.optimalSteps})` : `– (${level.optimalSteps})`
            }
          />
          <StatRow
            label="ชนกำแพง"
            value={lastResult ? String(lastResult.wallHits) : "–"}
          />
          {level.requiresAllItems && (
            <StatRow
              label="ไอเทม"
              value={
                lastResult
                  ? `${lastResult.itemsCollected}/${lastResult.totalItems}`
                  : `0/${maze.items.length}`
              }
            />
          )}
          <StatRow
            label="คะแนน"
            value={lastResult ? String(displayScore) : "–"}
            highlight
          />
        </div>
        {sidebarSlot}
      </aside>
    </div>
  );
}

function ResultPanel({
  animState,
  result,
  optimalSteps,
}: {
  animState: AnimState;
  result: {
    reached: boolean;
    steps: number;
    wallHits: number;
    itemsCollected: number;
    totalItems: number;
    error: string | null;
    limitHit: boolean;
  } | null;
  optimalSteps: number;
}) {
  // แสดงผลสรุปหลัง animation เล่นจบเท่านั้น
  if (animState !== "done" || !result) return null;

  if (result.error) {
    return (
      <div className="mt-4 rounded-lg border border-danger bg-danger/10 p-4">
        <div className="mb-2 font-bold text-danger">✗ โค้ดมีปัญหา</div>
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-danger">
          {result.error}
        </pre>
      </div>
    );
  }

  if (result.limitHit) {
    return (
      <div className="mt-4 rounded-lg border border-warn bg-warn/10 p-4 text-sm text-warn">
        ⚠ เดินวนเกิน 500 step แล้ว ลองตรวจสอบเงื่อนไขการหยุดอีกที (อาจมี infinite
        loop)
      </div>
    );
  }

  const extra = Math.max(0, result.steps - optimalSteps);

  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${
        result.reached
          ? "border-success bg-success/10"
          : "border-danger bg-danger/10"
      }`}
    >
      <div
        className={`mb-2 font-bold ${result.reached ? "text-success" : "text-danger"}`}
      >
        {result.reached
          ? "✓ ถึงเป้าหมายแล้ว! เคลียร์ด่าน"
          : "✗ ยังไปไม่ถึงเป้าหมาย"}
      </div>
      <ul className="space-y-1 text-sm text-muted">
        <li>
          ใช้ {result.steps} step (ดีที่สุด {optimalSteps} ·{" "}
          {extra === 0 ? "เพอร์เฟกต์!" : `เกินมา ${extra}`})
        </li>
        <li>ชนกำแพง {result.wallHits} ครั้ง</li>
        {result.totalItems > 0 && (
          <li>
            เก็บไอเทม {result.itemsCollected}/{result.totalItems} ชิ้น
          </li>
        )}
      </ul>
    </div>
  );
}

function MascotMessage({
  mood,
  solved,
  result,
}: {
  mood: FireflyMood;
  solved: boolean;
  result: { reached: boolean; totalItems: number; itemsCollected: number } | null;
}) {
  let text = "เขียนโค้ดคุม bot ให้ไปถึงธงกัน!";
  if (solved) text = "เยี่ยมมาก! ผ่านด่านแล้ว 🎉";
  else if (mood === "sad") {
    text =
      result && result.totalItems > 0 && result.itemsCollected < result.totalItems
        ? "ยังเก็บไอเทมไม่ครบนะ ลองอีกที"
        : "ยังไม่ถึงเป้าหมาย ลองปรับเส้นทางดูใหม่";
  }
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
