"use client";

import { useState } from "react";
import { playHint } from "@/lib/sounds";

interface HintButtonProps {
  // มี hint ให้ดูหรือไม่ (เฉพาะ noob/beginner) ถ้า false ปุ่มจะ disabled
  enabled: boolean;
  hint: string;
}

// ปุ่มขอคำใบ้ + popup แสดง hint แบบเป็นมิตร
// ระดับ pro ขึ้นไปจะ disabled พร้อม label "no hint"
export default function HintButton({ enabled, hint }: HintButtonProps) {
  const [open, setOpen] = useState(false);

  if (!enabled) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted opacity-50"
        title="ระดับนี้ไม่มีคำใบ้"
      >
        💡 no hint
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) playHint();
        }}
        className="rounded-md border border-warn bg-surface px-3 py-1.5 text-sm text-warn transition hover:bg-warn/10"
      >
        💡 ขอคำใบ้
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 animate-pop-in rounded-lg border border-warn bg-surface p-4 text-sm shadow-xl">
          <div className="mb-1 font-bold text-warn">คำใบ้</div>
          <p className="leading-relaxed text-[#e6edf3]">{hint}</p>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-muted hover:text-accent"
          >
            ปิด
          </button>
        </div>
      )}
    </div>
  );
}
