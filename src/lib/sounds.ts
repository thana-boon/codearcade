// โมดูลสร้าง sound effect ด้วย Tone.js แบบ synthesize สด ๆ (ไม่ใช้ไฟล์เสียง)
// import Tone แบบ dynamic เพื่อไม่ให้พังตอน server-side render

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Tone: any = null;
let started = false;
let muted = false;

// โหลด Tone.js (เฉพาะฝั่ง client) และเริ่ม audio context หลัง user gesture แรก
async function ensureStarted(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!Tone) {
    Tone = await import("tone");
  }
  if (!started) {
    await Tone.start();
    started = true;
  }
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

// เล่นโน้ตตามลำดับเวลา (helper กลาง) ข้ามทันทีถ้า mute อยู่
async function playSequence(
  notes: { note: string; time: number; duration: string }[],
  type: OscillatorType = "triangle",
): Promise<void> {
  if (muted) return;
  await ensureStarted();
  if (!Tone) return;

  const synth = new Tone.Synth({
    oscillator: { type },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.2 },
  }).toDestination();
  synth.volume.value = -8;

  const now = Tone.now();
  for (const { note, time, duration } of notes) {
    synth.triggerAttackRelease(note, duration, now + time);
  }
  // เก็บกวาด synth หลังเล่นจบ
  setTimeout(() => synth.dispose(), 1500);
}

// เสียงตอนกดปุ่ม Run ("ติ๊ด" สั้น ๆ)
export function playRun(): void {
  void playSequence([{ note: "C5", time: 0, duration: "16n" }], "square");
}

// เสียงตอบถูก (ไล่ระดับขึ้นให้รู้สึกดี)
export function playSuccess(): void {
  void playSequence(
    [
      { note: "C5", time: 0, duration: "16n" },
      { note: "E5", time: 0.12, duration: "16n" },
      { note: "G5", time: 0.24, duration: "16n" },
      { note: "C6", time: 0.36, duration: "8n" },
    ],
    "triangle",
  );
}

// เสียงตอบผิด (โน้ตต่ำ สั้น ไม่รุนแรง)
export function playWrong(): void {
  void playSequence(
    [
      { note: "A3", time: 0, duration: "16n" },
      { note: "E3", time: 0.14, duration: "8n" },
    ],
    "sawtooth",
  );
}

// เสียงตอนเปิดดู hint (เบา ๆ แบบ "ติง")
export function playHint(): void {
  void playSequence([{ note: "B5", time: 0, duration: "16n" }], "sine");
}
