"use client";

interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

// ปุ่มเปิด/ปิดเสียง อยู่มุมขวาบนของหน้าเล่น (สถานะเก็บใน React state ไม่ persist)
export default function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <button
      onClick={onToggle}
      title={muted ? "เปิดเสียง" : "ปิดเสียง"}
      aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
