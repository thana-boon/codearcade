import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { functionForgeLeaderboard } from "@/lib/db/schema";
import { DIFFICULTIES } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/function-forge/leaderboard/[level] → top 10 ของระดับนั้น เรียงคะแนนมากไปน้อย
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
      .from(functionForgeLeaderboard)
      .where(eq(functionForgeLeaderboard.level, level))
      // คะแนนมากก่อน, ถ้าเท่ากันใช้เวลาน้อยกว่าก่อน
      .orderBy(
        desc(functionForgeLeaderboard.score),
        asc(functionForgeLeaderboard.timeSeconds),
      )
      .limit(10);

    return NextResponse.json({ entries: rows });
  } catch (err) {
    console.error("[forge/leaderboard] error:", err);
    // ถ้า DB ยังไม่พร้อม คืน list ว่างเพื่อให้หน้าเว็บไม่พัง
    return NextResponse.json({ entries: [] });
  }
}
