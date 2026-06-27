// ระดับความยากของเกม Bug Hunt
export type Difficulty = "noob" | "beginner" | "pro" | "expert" | "god";

export const DIFFICULTIES: Difficulty[] = [
  "noob",
  "beginner",
  "pro",
  "expert",
  "god",
];

// ระดับที่ได้ visual-assist (highlight บรรทัด bug + ปุ่ม hint ใช้งานได้)
export function hasAssist(level: Difficulty): boolean {
  return level === "noob" || level === "beginner";
}

export interface LeaderboardRow {
  id: number;
  level: string;
  playerName: string;
  score: number;
  timeSeconds: number;
  wrongAttempts: number;
  levelId: string;
  createdAt: string;
}
