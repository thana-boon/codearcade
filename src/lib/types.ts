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

// แถวตารางคะแนนของเกม Function Forge (ใช้ runCount แทน wrongAttempts)
export interface ForgeLeaderboardRow {
  id: number;
  level: string;
  playerName: string;
  score: number;
  timeSeconds: number;
  runCount: number;
  levelId: string;
  createdAt: string;
}

// แถวตารางคะแนน Solo ของเกม Code Arena
export interface ArenaLeaderboardRow {
  id: number;
  level: string;
  playerName: string;
  score: number;
  timeSeconds: number;
  stepsUsed: number;
  wallHits: number;
  levelId: string;
  createdAt: string;
}

// ข้อมูลห้อง multiplayer (ส่งให้หน้า lobby/รอห้อง)
export interface ArenaRoomInfo {
  roomCode: string;
  roomName: string;
  level: string;
  levelCount: number; // จำนวนด่านในห้อง (ปกติ 5)
  isClosed: boolean;
  createdAt: string;
  expiresAt: string;
  players: ArenaRoomPlayer[];
}

// ผู้เล่นหนึ่งคนในห้อง multiplayer (ใช้แสดงในตารางอันดับสด)
export interface ArenaRoomPlayer {
  playerName: string;
  levelsCompleted: number;
  totalScore: number;
  joinedAt: string;
}
