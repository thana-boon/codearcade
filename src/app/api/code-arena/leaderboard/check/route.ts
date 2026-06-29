import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaLeaderboard } from "@/lib/db/schema";
import { DIFFICULTIES } from "@/lib/types";

export const dynamic = "force-dynamic";

// POST /api/code-arena/leaderboard/check { level, score } → { qualifies: boolean }
// ตรวจว่าคะแนนนี้จะติด top 10 ของระดับนั้นหรือไม่
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { level, score } = body as { level?: string; score?: number };

    if (
      !level ||
      !(DIFFICULTIES as string[]).includes(level) ||
      typeof score !== "number"
    ) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const top = await db
      .select({ score: codeArenaLeaderboard.score })
      .from(codeArenaLeaderboard)
      .where(eq(codeArenaLeaderboard.level, level))
      .orderBy(desc(codeArenaLeaderboard.score))
      .limit(10);

    const qualifies = top.length < 10 || score > top[top.length - 1].score;

    return NextResponse.json({ qualifies });
  } catch (err) {
    console.error("[arena/check] error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
