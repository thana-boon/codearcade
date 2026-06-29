// helper ฝั่ง client เก็บ token ของห้อง multiplayer ไว้ใน localStorage
// (ใช้แทนการ login — ผู้เล่นถูกจดจำด้วย token ต่อห้อง)

export interface RoomCreds {
  playerToken: string;
  hostToken?: string; // มีเฉพาะหัวห้อง
  playerName: string;
}

const KEY_PREFIX = "arena_room_";

export function saveRoomCreds(roomCode: string, creds: RoomCreds): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY_PREFIX + roomCode.toUpperCase(),
      JSON.stringify(creds),
    );
  } catch {
    // localStorage ใช้ไม่ได้ (private mode ฯลฯ) → ปล่อยผ่าน
  }
}

export function loadRoomCreds(roomCode: string): RoomCreds | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + roomCode.toUpperCase());
    if (!raw) return null;
    return JSON.parse(raw) as RoomCreds;
  } catch {
    return null;
  }
}
