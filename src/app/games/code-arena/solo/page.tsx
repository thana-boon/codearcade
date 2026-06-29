import Link from "next/link";
import { ARENA_META, ARENA_ORDER } from "@/lib/levels/code-arena-meta";
import { getArenaLevelsByDifficulty } from "@/lib/levels/code-arena-levels";

// หน้าเลือกระดับความยากของโหมด Solo (โครงเดียวกับ Bug Hunt / Function Forge)
export default function CodeArenaSoloSelect() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/games/code-arena"
          className="text-sm text-muted transition hover:text-accent"
        >
          ← กลับ
        </Link>
        <Link
          href="/games/code-arena/leaderboard"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent"
        >
          🏆 Leaderboard
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">⚔️ Code Arena · Solo</h1>
        <p className="mt-2 text-muted">
          เลือกระดับความยาก แล้วเขียนโค้ดคุม bot เดิน maze เลือกได้อิสระ
          ไม่มีการปลดล็อก
        </p>
      </header>

      <section className="grid gap-4">
        {ARENA_ORDER.map((level) => {
          const meta = ARENA_META[level];
          const count = getArenaLevelsByDifficulty(level).length;
          return (
            <Link
              key={level}
              href={`/games/code-arena/solo/play?level=${level}`}
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
                  <span className="text-xs text-muted">{count} ด่าน</span>
                </div>
                <p className="mt-2 font-semibold">{meta.description}</p>
                <p className="mt-1 text-xs text-muted">ทักษะ: {meta.skillTypes}</p>
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
