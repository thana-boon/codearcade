"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ARENA_META, ARENA_ORDER } from "@/lib/levels/code-arena-meta";
import { saveRoomCreds } from "@/lib/arena-client";
import type { Difficulty } from "@/lib/types";

type Tab = "create" | "join";

export default function MultiplayerEntry() {
  const [tab, setTab] = useState<Tab>("create");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12">
      <div className="mb-8">
        <Link
          href="/games/code-arena"
          className="text-sm text-muted transition hover:text-accent"
        >
          ← กลับ
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">
          ⚔️ Code Arena · Multiplayer
        </h1>
        <p className="mt-2 text-muted">
          สร้างห้องแล้วชวนเพื่อนเข้าร่วมด้วย room code + รหัสผ่าน
          แข่งเคลียร์ 5 ด่านชุดเดียวกัน วัดคะแนนรวม
        </p>
      </header>

      {/* แท็บ สร้างห้อง / เข้าร่วม */}
      <div className="mb-6 flex gap-2">
        <TabButton active={tab === "create"} onClick={() => setTab("create")}>
          สร้างห้อง
        </TabButton>
        <TabButton active={tab === "join"} onClick={() => setTab("join")}>
          เข้าร่วมห้อง
        </TabButton>
      </div>

      {tab === "create" ? <CreateForm /> : <JoinForm />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-accent bg-accent text-bg"
          : "border-border bg-surface text-muted hover:text-[#e6edf3]"
      }`}
    >
      {children}
    </button>
  );
}

function CreateForm() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState<Difficulty>("beginner");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/code-arena/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, password, level, playerName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "สร้างห้องไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      // เก็บ token ลง localStorage เพื่อยืนยันตัวตนในห้อง
      saveRoomCreds(data.roomCode, {
        playerToken: data.playerToken,
        hostToken: data.hostToken,
        playerName: playerName.trim(),
      });
      router.push(`/games/code-arena/multiplayer/room/${data.roomCode}`);
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <Field label="ชื่อห้อง (สูงสุด 30 ตัวอักษร)">
        <input
          value={roomName}
          maxLength={30}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="ห้องของฉัน"
          className={inputClass}
        />
      </Field>
      <Field label="รหัสผ่านห้อง (สูงสุด 20 ตัวอักษร)">
        <input
          value={password}
          maxLength={20}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="ตั้งรหัสให้เพื่อน"
          className={inputClass}
        />
      </Field>
      <Field label="ระดับความยาก">
        <div className="flex flex-wrap gap-2">
          {ARENA_ORDER.map((lv) => {
            const meta = ARENA_META[lv];
            return (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className={`rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition ${
                  level === lv
                    ? meta.color
                    : "border-border bg-bg text-muted hover:text-[#e6edf3]"
                }`}
              >
                {meta.emoji} {lv}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="ชื่อผู้เล่นของคุณ (สูงสุด 15 ตัวอักษร)">
        <input
          value={playerName}
          maxLength={15}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="ชื่อในเกม"
          className={inputClass}
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full rounded-md bg-accent px-4 py-2.5 font-bold text-bg transition hover:bg-accent/90 disabled:opacity-50"
      >
        {submitting ? "กำลังสร้างห้อง..." : "สร้างห้อง →"}
      </button>
    </div>
  );
}

function JoinForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const code = roomCode.trim().toUpperCase();
      const res = await fetch("/api/code-arena/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code, password, playerName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เข้าร่วมห้องไม่ได้");
        setSubmitting(false);
        return;
      }
      saveRoomCreds(code, {
        playerToken: data.playerToken,
        playerName: playerName.trim(),
      });
      router.push(`/games/code-arena/multiplayer/room/${code}`);
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <Field label="รหัสห้อง (room code)">
        <input
          value={roomCode}
          maxLength={6}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          className={`${inputClass} text-center text-lg font-bold uppercase tracking-[0.3em]`}
        />
      </Field>
      <Field label="รหัสผ่านห้อง">
        <input
          value={password}
          maxLength={20}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่านที่หัวห้องตั้งไว้"
          className={inputClass}
        />
      </Field>
      <Field label="ชื่อผู้เล่นของคุณ (สูงสุด 15 ตัวอักษร)">
        <input
          value={playerName}
          maxLength={15}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="ชื่อในเกม"
          className={inputClass}
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full rounded-md bg-success px-4 py-2.5 font-bold text-bg transition hover:bg-success/90 disabled:opacity-50"
      >
        {submitting ? "กำลังเข้าร่วม..." : "เข้าร่วมห้อง →"}
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}
