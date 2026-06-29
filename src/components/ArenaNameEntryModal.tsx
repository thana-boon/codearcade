"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/types";

interface ArenaNameEntryModalProps {
  level: Difficulty;
  score: number;
  timeSeconds: number;
  stepsUsed: number;
  wallHits: number;
  levelId: string;
  onClose: () => void; // ข้าม/ปิดโดยไม่บันทึก
  onSubmitted: () => void; // บันทึกสำเร็จ
}

const MAX_NAME = 12;

// modal กรอกชื่อสไตล์ตู้เกมอาเขต เมื่อทำคะแนน Solo ของ Code Arena ติด top 10
export default function ArenaNameEntryModal({
  level,
  score,
  timeSeconds,
  stepsUsed,
  wallHits,
  levelId,
  onClose,
  onSubmitted,
}: ArenaNameEntryModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("กรุณาใส่ชื่อ");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/code-arena/leaderboard/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          playerName: trimmed,
          timeSeconds,
          stepsUsed,
          wallHits,
          levelId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      onSubmitted();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-pop-in rounded-xl border-2 border-accent bg-surface p-6 text-center shadow-2xl shadow-accent/20">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-warn">
          ★ new high score ★
        </div>
        <h2 className="mb-1 text-2xl font-bold text-accent">ติด TOP 10!</h2>
        <p className="mb-4 text-sm text-muted">
          ระดับ {level} · คะแนน{" "}
          <span className="font-bold text-success">{score}</span>
        </p>

        <label className="mb-2 block text-left text-xs text-muted">
          ใส่ชื่อของคุณ (สูงสุด {MAX_NAME} ตัวอักษร)
        </label>
        <input
          autoFocus
          value={name}
          maxLength={MAX_NAME}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="AAA"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-center text-xl font-bold uppercase tracking-[0.4em] text-accent outline-none focus:border-accent"
        />

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-md border border-border bg-bg px-4 py-2 text-sm text-muted transition hover:text-[#e6edf3] disabled:opacity-50"
          >
            ข้าม
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-bold text-bg transition hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
