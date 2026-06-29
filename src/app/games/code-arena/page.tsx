import Link from "next/link";

// หน้าเลือกโหมดของ Code Arena: Solo หรือ Multiplayer
export default function CodeArenaHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted transition hover:text-accent">
          ← กลับหน้าหลัก
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">⚔️ Code Arena</h1>
        <p className="mt-2 max-w-2xl text-muted">
          เขียนโค้ด Python สั่งให้หุ่นยนต์เดินฝ่า maze ไปให้ถึงเป้าหมาย 🏁
          ยิ่งใช้เวลาน้อย เดินสั้น และไม่ชนกำแพง คะแนนยิ่งสูง
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <ModeCard
          href="/games/code-arena/solo"
          icon="🧑‍💻"
          title="เล่นเดี่ยว (Solo)"
          tagline="ฝึกคนเดียว เก็บคะแนนขึ้น leaderboard"
          description="เลือกระดับความยากแล้วไล่เคลียร์ด่าน เหมือน Bug Hunt และ Function Forge มีตารางคะแนนของตัวเอง"
        />
        <ModeCard
          href="/games/code-arena/multiplayer"
          icon="👥"
          title="เล่นเป็นกลุ่ม (Multiplayer)"
          tagline="สร้างห้อง / เข้าร่วมแข่งกับเพื่อน"
          description="สร้างห้องด้วย room code + รหัสผ่าน ชวนเพื่อนเข้าร่วมได้สูงสุด 40 คน แข่งเคลียร์ 5 ด่านชุดเดียวกัน วัดคะแนนรวม"
        />
      </section>
    </main>
  );
}

function ModeCard({
  href,
  icon,
  title,
  tagline,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/10"
    >
      <div className="mb-4 text-4xl">{icon}</div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-accent">{tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-accent">
        เข้าสู่โหมดนี้ →
      </span>
    </Link>
  );
}
