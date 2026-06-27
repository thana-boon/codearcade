import Link from "next/link";

interface GameCard {
  title: string;
  tagline: string;
  description: string;
  href: string | null; // null = ยังไม่เปิด (coming soon)
  icon: string;
  accent: string;
}

const games: GameCard[] = [
  {
    title: "Bug Hunt",
    tagline: "ล่าบั๊กในโค้ด Python",
    description:
      "หาและแก้ bug ในโค้ด Python ตั้งแต่ระดับ noob ถึง god พร้อมจับเวลาและ leaderboard",
    href: "/games/bug-hunt",
    icon: "🐛",
    accent: "border-accent",
  },
  {
    title: "Code Arena",
    tagline: "เขียนโค้ดแข่งกับเวลา",
    description: "โจทย์ algorithm จับเวลา แข่งกันทำให้ผ่าน test case ให้ครบ",
    href: null,
    icon: "⚔️",
    accent: "border-border",
  },
  {
    title: "Function Forge",
    tagline: "ประดิษฐ์ฟังก์ชันให้สมบูรณ์",
    description: "เติมโค้ดในฟังก์ชันที่ขาดหายให้ทำงานได้ตามสเปก",
    href: null,
    icon: "🔨",
    accent: "border-border",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      {/* หัวข้อสไตล์ terminal */}
      <header className="mb-12">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <span className="h-3 w-3 rounded-full bg-danger" />
          <span className="h-3 w-3 rounded-full bg-warn" />
          <span className="h-3 w-3 rounded-full bg-success" />
          <span className="ml-2">~/code-arcade</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-accent">$</span> Code Arcade
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          เกมฝึกทักษะการเขียนโค้ดแบบเล่นได้ทันที ไม่ต้องสมัครสมาชิก
          เลือกเกมแล้วเริ่มเล่นได้เลย
        </p>
      </header>

      {/* การ์ดเกม */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCardView key={game.title} game={game} />
        ))}
      </section>

      <footer className="mt-auto pt-16 text-center text-xs text-muted">
        Powered by CodeSense
      </footer>
    </main>
  );
}

function GameCardView({ game }: { game: GameCard }) {
  const inner = (
    <div
      className={`group relative h-full rounded-xl border ${game.accent} bg-surface p-6 transition ${
        game.href
          ? "cursor-pointer hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/10"
          : "cursor-not-allowed opacity-40"
      }`}
    >
      {!game.href && (
        <span className="absolute right-4 top-4 rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
          coming soon
        </span>
      )}
      <div className="mb-4 text-4xl">{game.icon}</div>
      <h2 className="text-xl font-bold">{game.title}</h2>
      <p className="mt-1 text-sm text-accent">{game.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {game.description}
      </p>
      {game.href && (
        <span className="mt-4 inline-block text-sm font-semibold text-accent">
          เริ่มเล่น →
        </span>
      )}
    </div>
  );

  if (game.href) {
    return <Link href={game.href}>{inner}</Link>;
  }
  // การ์ด coming soon ไม่คลิกได้
  return <div aria-disabled>{inner}</div>;
}
