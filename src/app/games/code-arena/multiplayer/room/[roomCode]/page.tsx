"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArenaPlay, { type ArenaSolveStats } from "@/components/ArenaPlay";
import MuteButton from "@/components/MuteButton";
import { ARENA_META } from "@/lib/levels/code-arena-meta";
import {
  getArenaLevelById,
  prepareArenaLevel,
  type PreparedArenaLevel,
} from "@/lib/levels/code-arena-levels";
import { loadRoomCreds, type RoomCreds } from "@/lib/arena-client";
import { setMuted } from "@/lib/sounds";
import type { ArenaRoomPlayer, Difficulty } from "@/lib/types";

interface RoomData {
  roomCode: string;
  roomName: string;
  level: Difficulty;
  levelIds: string[];
  levelCount: number;
  isClosed: boolean;
  createdAt: string;
  expiresAt: string;
  players: ArenaRoomPlayer[];
}

type Phase = "lobby" | "playing" | "done";

export default function RoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = (params.roomCode ?? "").toUpperCase();

  const [creds, setCreds] = useState<RoomCreds | null>(null);
  const [credsLoaded, setCredsLoaded] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [phase, setPhase] = useState<Phase>("lobby");
  const [levelIndex, setLevelIndex] = useState(0);
  const [solvedCurrent, setSolvedCurrent] = useState(false);
  const [myTotal, setMyTotal] = useState(0);
  const [muted, setMutedState] = useState(false);

  // โหลด token จาก localStorage (ฝั่ง client)
  useEffect(() => {
    setCreds(loadRoomCreds(roomCode));
    setCredsLoaded(true);
  }, [roomCode]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  // ดึงข้อมูลห้อง + poll ทุก 5 วินาที (auto-refresh สกอร์บอร์ด)
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/code-arena/rooms/${roomCode}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      if (data.room) setRoom(data.room as RoomData);
    } catch {
      // ออฟไลน์/DB ล่ม → คงข้อมูลเดิมไว้
    }
  }, [roomCode]);

  useEffect(() => {
    fetchRoom();
    const id = setInterval(fetchRoom, 5000);
    return () => clearInterval(id);
  }, [fetchRoom]);

  // เตรียมด่านทั้ง 5 จาก levelIds (โหลดฝั่ง client จาก level data)
  const levels = useMemo<PreparedArenaLevel[]>(() => {
    if (!room) return [];
    return room.levelIds
      .map((id) => getArenaLevelById(id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l))
      .map(prepareArenaLevel);
  }, [room]);

  // ส่งคะแนนด่านที่เพิ่งผ่านไปยัง server
  const submittedRef = useRef<Set<number>>(new Set());
  const handleSolved = useCallback(
    async (stats: ArenaSolveStats) => {
      setSolvedCurrent(true);
      if (!creds?.playerToken) return;
      if (submittedRef.current.has(levelIndex)) return;
      submittedRef.current.add(levelIndex);
      try {
        const res = await fetch(
          `/api/code-arena/rooms/${roomCode}/submit-level`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerToken: creds.playerToken,
              levelIndex,
              timeSeconds: stats.timeSeconds,
              stepsUsed: stats.stepsUsed,
              wallHits: stats.wallHits,
            }),
          },
        );
        const data = await res.json();
        if (res.ok && typeof data.totalScore === "number") {
          setMyTotal(data.totalScore);
        }
        void fetchRoom();
      } catch {
        // ส่งไม่สำเร็จ → ข้ามเงียบ ๆ (ยังเล่นต่อได้)
      }
    },
    [creds, levelIndex, roomCode, fetchRoom],
  );

  const goNext = () => {
    if (levelIndex < levels.length - 1) {
      setLevelIndex((i) => i + 1);
      setSolvedCurrent(false);
    } else {
      setPhase("done");
    }
  };

  const closeRoom = async () => {
    if (!creds?.hostToken) return;
    try {
      await fetch(`/api/code-arena/rooms/${roomCode}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken: creds.hostToken }),
      });
      void fetchRoom();
    } catch {
      /* noop */
    }
  };

  // ---------- การแสดงผลตามสถานะ ----------
  if (notFound) {
    return (
      <Centered>
        <p className="mb-4 text-danger">ไม่พบห้องนี้ (อาจหมดอายุหรือถูกปิดไปแล้ว)</p>
        <Link href="/games/code-arena/multiplayer" className="text-accent underline">
          กลับไปหน้า Multiplayer
        </Link>
      </Centered>
    );
  }

  if (credsLoaded && !creds) {
    return (
      <Centered>
        <p className="mb-4 text-muted">
          คุณยังไม่ได้เข้าร่วมห้อง <span className="font-bold">{roomCode}</span>
        </p>
        <Link
          href="/games/code-arena/multiplayer"
          className="rounded-md bg-accent px-4 py-2 font-bold text-bg transition hover:bg-accent/90"
        >
          ไปหน้าเข้าร่วมห้อง
        </Link>
      </Centered>
    );
  }

  if (!room) {
    return <Centered>กำลังโหลดห้อง...</Centered>;
  }

  const meta = ARENA_META[room.level];
  const isHost = Boolean(creds?.hostToken);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/games/code-arena/multiplayer"
            className="text-sm text-muted transition hover:text-accent"
          >
            ← ออก
          </Link>
          <span className="text-lg font-bold">⚔️ {room.roomName}</span>
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${meta.color}`}
          >
            {room.level}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <RoomCodeBadge code={room.roomCode} />
          <MuteButton muted={muted} onToggle={() => setMutedState((m) => !m)} />
        </div>
      </header>

      {room.isClosed && (
        <div className="mb-4 rounded-md border border-warn bg-warn/10 px-4 py-2 text-sm text-warn">
          ห้องนี้ถูกปิดรับผู้เล่นแล้ว — คะแนนที่ส่งหลังจากนี้จะไม่ถูกนับ
        </div>
      )}

      {phase === "lobby" && (
        <Lobby
          room={room}
          isHost={isHost}
          onStart={() => {
            setPhase("playing");
            setLevelIndex(0);
            setSolvedCurrent(false);
          }}
          onClose={closeRoom}
        />
      )}

      {phase === "playing" && levels[levelIndex] && (
        <div>
          <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
            <span className="text-sm font-bold">
              ด่าน {levelIndex + 1} / {levels.length}
            </span>
            <span className="text-sm text-muted">
              คะแนนรวมของคุณ:{" "}
              <span className="font-mono font-bold text-success">{myTotal}</span>
            </span>
          </div>
          <ArenaPlay
            key={`${room.roomCode}-${levelIndex}`}
            level={levels[levelIndex]}
            onSolved={handleSolved}
            actionSlot={
              solvedCurrent ? (
                <button
                  onClick={goNext}
                  className="rounded-md border border-accent bg-accent px-4 py-2 text-sm font-bold text-bg transition hover:bg-accent/90"
                >
                  {levelIndex < levels.length - 1 ? "ด่านถัดไป →" : "ดูผลรวม →"}
                </button>
              ) : null
            }
            sidebarSlot={<Scoreboard players={room.players} compact />}
          />
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-success bg-success/10 p-6 text-center">
            <h2 className="text-2xl font-bold text-success">เล่นครบทุกด่านแล้ว! 🎉</h2>
            <p className="mt-2 text-muted">
              คะแนนรวมของคุณ:{" "}
              <span className="font-mono text-xl font-bold text-success">
                {myTotal}
              </span>
            </p>
          </div>
          <Scoreboard players={room.players} />
        </div>
      )}
    </main>
  );
}

function Lobby({
  room,
  isHost,
  onStart,
  onClose,
}: {
  room: RoomData;
  isHost: boolean;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-1 text-lg font-bold">ห้องรอเริ่มเกม</h2>
          <p className="text-sm text-muted">
            ทุกคนเล่นด่านชุดเดียวกัน {room.levelCount} ด่าน
            กดเริ่มเล่นได้เลยไม่ต้องรอครบ — คะแนนจะถูกรวมตามที่แต่ละคนทำได้
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="ผู้เล่นในห้อง" value={`${room.players.length} / 40`} />
            <Info label="จำนวนด่าน" value={String(room.levelCount)} />
            <Info label="หมดอายุ" value={formatExpiry(room.expiresAt)} />
            <Info label="สถานะ" value={room.isClosed ? "ปิดแล้ว" : "เปิดอยู่"} />
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onStart}
              className="rounded-md bg-accent px-5 py-2.5 font-bold text-bg transition hover:bg-accent/90"
            >
              ▶ เริ่มเล่น
            </button>
            {isHost && !room.isClosed && (
              <button
                onClick={onClose}
                className="rounded-md border border-danger px-4 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/10"
              >
                ปิดห้อง
              </button>
            )}
          </div>
        </div>
      </section>
      <aside>
        <Scoreboard players={room.players} />
      </aside>
    </div>
  );
}

function Scoreboard({
  players,
  compact,
}: {
  players: ArenaRoomPlayer[];
  compact?: boolean;
}) {
  return (
    <div className="w-full rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-bold text-accent">
        🏆 อันดับในห้อง ({players.length})
      </h3>
      {players.length === 0 ? (
        <p className="text-xs text-muted">ยังไม่มีผู้เล่น</p>
      ) : (
        <ol className="space-y-1.5">
          {players.slice(0, compact ? 8 : 40).map((p, i) => (
            <li
              key={`${p.playerName}-${i}`}
              className="flex items-center justify-between rounded-md bg-bg px-3 py-1.5 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 text-right text-xs text-muted">{i + 1}</span>
                <span className="font-semibold">{p.playerName}</span>
                <span className="text-xs text-muted">{p.levelsCompleted}/5</span>
              </span>
              <span className="font-mono font-bold text-success tabular-nums">
                {p.totalScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RoomCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <button
      onClick={copy}
      title="คัดลอกรหัสห้อง"
      className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] transition hover:border-accent"
    >
      {code}
      <span className="text-xs text-muted">{copied ? "✓" : "📋"}</span>
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-bg px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono font-bold">{value}</div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-10 text-center text-muted">
      {children}
    </main>
  );
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
