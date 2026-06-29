"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ARENA_META, ARENA_ORDER } from "@/lib/levels/code-arena-meta";
import type { ArenaLeaderboardRow, Difficulty } from "@/lib/types";

export default function ArenaLeaderboardPage() {
  const [active, setActive] = useState<Difficulty>("noob");
  const [rows, setRows] = useState<ArenaLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/code-arena/leaderboard/${active}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRows(data.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/games/code-arena/solo"
          className="text-sm text-muted transition hover:text-accent"
        >
          ← กลับไปเลือกระดับ
        </Link>
      </div>

      <h1 className="mb-6 text-3xl font-bold">🏆 Leaderboard · Code Arena</h1>

      {/* แท็บเลือกระดับ */}
      <div className="mb-5 flex flex-wrap gap-2">
        {ARENA_ORDER.map((level) => {
          const meta = ARENA_META[level];
          const isActive = level === active;
          return (
            <button
              key={level}
              onClick={() => setActive(level)}
              className={`rounded-md border px-3 py-1.5 text-sm font-bold uppercase transition ${
                isActive
                  ? meta.color
                  : "border-border bg-surface text-muted hover:text-[#e6edf3]"
              }`}
            >
              {meta.emoji} {level}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-surface">
        {loading ? (
          <div className="p-8 text-center text-muted">กำลังโหลด...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted">
            ยังไม่มีคะแนนในระดับนี้ มาเป็นคนแรกกันเถอะ!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3 text-right">คะแนน</th>
                <th className="px-4 py-3 text-right">เวลา</th>
                <th className="px-4 py-3 text-right">step</th>
                <th className="px-4 py-3 text-right">ชน</th>
                <th className="px-4 py-3 text-right">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3 font-bold tabular-nums">{medal(i)}</td>
                  <td className="px-4 py-3 font-semibold">{row.playerName}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-success tabular-nums">
                    {row.score}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                    {formatTime(row.timeSeconds)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                    {row.stepsUsed}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                    {row.wallHits}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted">
                    {formatDate(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function medal(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return String(index + 1);
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}
