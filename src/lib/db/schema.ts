import {
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
