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
import ArenaPlay, { type ArenaSolveStats } from "@/components/ArenaPlay";
import ArenaNameEntryModal from "@/components/ArenaNameEntryModal";
import MuteButton from "@/components/MuteButton";
import { ARENA_META } from "@/lib/levels/code-arena-meta";
import {
  getArenaLevelsByDifficulty,
  prepareArenaLevel,
  type CodeArenaLevel,
  type PreparedArenaLevel,
} from "@/lib/levels/code-arena-levels";
import { setMuted } from "@/lib/sounds";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

export default function SoloPlayWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">กำลังโหลด...</div>}>
      <SoloPlayPage />
    </Suspense>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SoloPlayPage() {
  const params = useSearchParams();
  const levelParam = params.get("level") ?? "";
  const isValidLevel = (DIFFICULTIES as string[]).includes(levelParam);
  const level = levelParam as Difficulty;

  // pool ด่านในระดับนี้ (สุ่มลำดับครั้งเดียว) + เซ็ต id ที่เล่นไปแล้ว
  const pool = useMemo<CodeArenaLevel[]>(
    () => (isValidLevel ? shuffle(getArenaLevelsByDifficulty(level)) : []),
    [level, isValidLevel],
  );
  const playedRef = useRef<Set<string>>(new Set());

  const [current, setCurrent] = useState<PreparedArenaLevel | null>(null);
  const [muted, setMutedState] = useState(false);
  const [solvedStats, setSolvedStats] = useState<ArenaSolveStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submittedName, setSubmittedName] = useState(false);

  // เลือกด่านถัดไป: สุ่มจาก pool ที่ยังไม่ได้เล่น ครบแล้วรีเซ็ตรอบใหม่
  const pickNext = useCallback(() => {
    if (pool.length === 0) return;
    let candidates = pool.filter((l) => !playedRef.current.has(l.id));
    if (candidates.length === 0) {
      playedRef.current = new Set();
      candidates = pool;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    playedRef.current.add(chosen.id);
    setCurrent(prepareArenaLevel(chosen));
    setSolvedStats(null);
    setShowModal(false);
    setSubmittedName(false);
  }, [pool]);

  useEffect(() => {
    if (isValidLevel) pickNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidLevel, pickNext]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  // เมื่อผ่านด่าน: เช็คกับ server ว่าคะแนนติด top 10 ไหม
  const handleSolved = useCallback(
    async (stats: ArenaSolveStats) => {
      setSolvedStats(stats);
      try {
        const res = await fetch("/api/code-arena/leaderboard/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level, score: stats.score }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.qualifies) setShowModal(true);
      } catch {
        // ไม่มี DB / ออฟไลน์ → ข้ามการบันทึกคะแนนไปเงียบ ๆ
      }
    },
    [level],
  );

  if (!isValidLevel) {
    return (
      <main className="mx-auto max-w-2xl p-10 text-center">
        <p className="mb-4 text-danger">ไม่พบระดับความยากนี้</p>
        <Link href="/games/code-arena/solo" className="text-accent underline">
          กลับไปเลือกระดับ
        </Link>
      </main>
    );
  }

  const meta = ARENA_META[level];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/games/code-arena/solo"
            className="text-sm text-muted transition hover:text-accent"
          >
            ← เลือกระดับ
          </Link>
          <span className="text-lg font-bold">⚔️ Code Arena</span>
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${meta.color}`}
          >
            {level}
          </span>
        </div>
        <MuteButton muted={muted} onToggle={() => setMutedState((m) => !m)} />
      </header>

      {current && (
        <ArenaPlay
          key={current.id}
          level={current}
          onSolved={handleSolved}
          actionSlot={
            <button
              onClick={pickNext}
              className={`rounded-md border px-4 py-2 text-sm transition ${
                solvedStats
                  ? "border-accent bg-accent text-bg hover:bg-accent/90"
                  : "border-border bg-surface text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {solvedStats ? "ด่านถัดไป →" : "ข้าม / สุ่มด่านใหม่"}
            </button>
          }
          sidebarSlot={
            <Link
              href="/games/code-arena/leaderboard"
              className="mt-1 text-xs text-muted underline transition hover:text-accent"
            >
              ดู Leaderboard
            </Link>
          }
        />
      )}

      {showModal && current && solvedStats && !submittedName && (
        <ArenaNameEntryModal
          level={level}
          score={solvedStats.score}
          timeSeconds={solvedStats.timeSeconds}
          stepsUsed={solvedStats.stepsUsed}
          wallHits={solvedStats.wallHits}
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
