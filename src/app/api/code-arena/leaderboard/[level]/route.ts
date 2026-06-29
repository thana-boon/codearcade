import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaLeaderboard } from "@/lib/db/schema";
import { DIFFICULTIES } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/code-arena/leaderboard/[level] → top 10 ของระดับนั้น เรียงคะแนนมากไปน้อย
export async function GET(
  _req: Request,
  { params }: { params: { level: string } },
) {
  const { level } = params;
  if (!(DIFFICULTIES as string[]).includes(level)) {
    return NextResponse.json({ error: "ระดับไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const rows = await db
      .select()
      .from(codeArenaLeaderboard)
      .where(eq(codeArenaLeaderboard.level, level))
      .orderBy(
        desc(codeArenaLeaderboard.score),
        asc(codeArenaLeaderboard.timeSeconds),
      )
      .limit(10);

    return NextResponse.json({ entries: rows });
  } catch (err) {
    console.error("[arena/leaderboard] error:", err);
    return NextResponse.json({ entries: [] });
  }
}
