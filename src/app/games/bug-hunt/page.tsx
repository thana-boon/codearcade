import Link from "next/link";
import {
  DIFFICULTY_META,
  DIFFICULTY_ORDER,
} from "@/lib/levels/difficulty-meta";
import { getLevelsByDifficulty } from "@/lib/levels/bug-hunt-levels";

export default function BugHuntLevelSelect() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-muted transition hover:text-accent"
        >
          ← กลับหน้าหลัก
        </Link>
        <Link
          href="/games/bug-hunt/leaderboard"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent"
        >
          🏆 Leaderboard
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">
          🐛 Bug Hunt
        </h1>
        <p className="mt-2 text-muted">
          เลือกระดับความยากได้อิสระ ไม่มีการปลดล็อก เล่นระดับไหนก่อนก็ได้
        </p>
      </header>

      <section className="grid gap-4">
        {DIFFICULTY_ORDER.map((level) => {
          const meta = DIFFICULTY_META[level];
          const count = getLevelsByDifficulty(level).length;
          return (
            <Link
              key={level}
              href={`/games/bug-hunt/play?level=${level}`}
              className={`group flex items-center gap-4 rounded-xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${meta.color.split(" ")[1]} hover:border-opacity-100`}
            >
              <div className="text-4xl">{meta.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted">{count} โจทย์</span>
                </div>
                <p className="mt-2 font-semibold">{meta.description}</p>
                <p className="mt-1 text-xs text-muted">
                  แนวบั๊ก: {meta.bugTypes}
                </p>
              </div>
              <span className="text-muted transition group-hover:translate-x-1 group-hover:text-accent">
                →
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
