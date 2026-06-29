import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ตารางเก็บคะแนน leaderboard ของเกม Bug Hunt
export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    id: serial("id").primaryKey(),
    // ระดับความยาก: 'noob' | 'beginner' | 'pro' | 'expert' | 'god'
    level: text("level").notNull(),
    // ชื่อผู้เล่น (จำกัด 15 ตัวอักษร ตรวจที่ฝั่ง API)
    playerName: text("player_name").notNull(),
    score: integer("score").notNull(),
    // เวลาที่ใช้เคลียร์ด่าน (วินาที)
    timeSeconds: integer("time_seconds").notNull(),
    // จำนวนครั้งที่กด Run แล้วผลลัพธ์ผิดก่อนตอบถูก
    wrongAttempts: integer("wrong_attempts").notNull(),
    // id ของด่านที่เล่น อ้างอิงกับ level data
    levelId: text("level_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // index ช่วยให้ query top 10 ต่อระดับเร็วขึ้น
    levelScoreIdx: index("leaderboard_level_score_idx").on(
      table.level,
      table.score,
    ),
  }),
);

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboardEntries.$inferInsert;

// ตารางเก็บคะแนน leaderboard ของเกม Function Forge (แยกตารางจาก Bug Hunt)
export const functionForgeLeaderboard = pgTable(
  "function_forge_leaderboard",
  {
    id: serial("id").primaryKey(),
    // ระดับความยาก: 'noob' | 'beginner' | 'pro' | 'expert' | 'god'
    level: text("level").notNull(),
    // ชื่อผู้เล่น (จำกัด 15 ตัวอักษร ตรวจที่ฝั่ง API)
    playerName: text("player_name").notNull(),
    score: integer("score").notNull(),
    // เวลาที่ใช้เคลียร์ด่าน (วินาที)
    timeSeconds: integer("time_seconds").notNull(),
    // จำนวนครั้งที่กด Run Tests ทั้งหมดจนผ่าน
    runCount: integer("run_count").notNull(),
    // id ของด่านที่เล่น อ้างอิงกับ level data
    levelId: text("level_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // index ช่วยให้ query top 10 ต่อระดับเร็วขึ้น
    levelScoreIdx: index("function_forge_level_score_idx").on(
      table.level,
      table.score,
    ),
  }),
);

export type ForgeLeaderboardEntry = typeof functionForgeLeaderboard.$inferSelect;
export type NewForgeLeaderboardEntry =
  typeof functionForgeLeaderboard.$inferInsert;

// ====================== Code Arena ======================

// ตารางเก็บคะแนน leaderboard ของโหมด Solo เกม Code Arena (แยกตารางจากเกมอื่น)
export const codeArenaLeaderboard = pgTable(
  "code_arena_leaderboard",
  {
    id: serial("id").primaryKey(),
    // ระดับความยาก: 'noob' | 'beginner' | 'pro' | 'expert' | 'god'
    level: text("level").notNull(),
    // ชื่อผู้เล่น (จำกัด 15 ตัวอักษร ตรวจที่ฝั่ง API)
    playerName: text("player_name").notNull(),
    score: integer("score").notNull(),
    // เวลาที่ใช้เคลียร์ด่าน (วินาที)
    timeSeconds: integer("time_seconds").notNull(),
    // จำนวน step ที่ใช้ (move/turn/collect)
    stepsUsed: integer("steps_used").notNull(),
    // จำนวนครั้งที่เดินชนกำแพง/ขอบ
    wallHits: integer("wall_hits").notNull(),
    // id ของด่านที่เล่น อ้างอิงกับ level data
    levelId: text("level_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    levelScoreIdx: index("code_arena_level_score_idx").on(
      table.level,
      table.score,
    ),
  }),
);

export type ArenaLeaderboardEntry = typeof codeArenaLeaderboard.$inferSelect;
export type NewArenaLeaderboardEntry = typeof codeArenaLeaderboard.$inferInsert;

// ตารางห้องของโหมด Multiplayer
export const codeArenaRooms = pgTable(
  "code_arena_rooms",
  {
    id: serial("id").primaryKey(),
    // รหัสห้อง 6 ตัวอักษร/เลข (unique) ใช้ join
    roomCode: text("room_code").notNull().unique(),
    roomName: text("room_name").notNull(),
    // รหัสผ่านห้อง เก็บเป็น plain text (ไม่ใช่ระบบ auth จริง)
    password: text("password").notNull(),
    level: text("level").notNull(),
    // JSON string array ของ id ด่านทั้ง 5 ที่สุ่มไว้ตอนสร้างห้อง
    levelIds: text("level_ids").notNull(),
    // token สุ่มที่หัวห้องเก็บไว้ใน localStorage เพื่อยืนยันสิทธิ์ปิดห้อง
    hostToken: text("host_token").notNull(),
    isClosed: boolean("is_closed").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // createdAt + 24 ชั่วโมง — ใช้ลบห้องหมดอายุแบบ lazy
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    roomCodeIdx: index("code_arena_room_code_idx").on(table.roomCode),
  }),
);

export type ArenaRoom = typeof codeArenaRooms.$inferSelect;
export type NewArenaRoom = typeof codeArenaRooms.$inferInsert;

// ตารางผู้เล่นในห้อง multiplayer
export const codeArenaRoomPlayers = pgTable(
  "code_arena_room_players",
  {
    id: serial("id").primaryKey(),
    // foreign key อ้างถึง code_arena_rooms.id
    roomId: integer("room_id").notNull(),
    // token สุ่มเก็บใน localStorage แทนการ login
    playerToken: text("player_token").notNull(),
    playerName: text("player_name").notNull(),
    levelsCompleted: integer("levels_completed").notNull().default(0),
    totalScore: integer("total_score").notNull().default(0),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    roomIdx: index("code_arena_room_players_room_idx").on(table.roomId),
  }),
);

export type ArenaRoomPlayerRow = typeof codeArenaRoomPlayers.$inferSelect;
export type NewArenaRoomPlayerRow = typeof codeArenaRoomPlayers.$inferInsert;
