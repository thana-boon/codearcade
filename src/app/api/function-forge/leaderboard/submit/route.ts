import { NextResponse } from "next/server";
import { and, asc, desc, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { functionForgeLeaderboard } from "@/lib/db/schema";
import { containsProfanity } from "@/lib/profanity";
import { calculateForgeScore } from "@/lib/score";
import { DIFFICULTIES } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SubmitBody {
  level?: string;
  playerName?: string;
  timeSeconds?: number;
  runCount?: number;
  levelId?: string;
}

// POST /api/function-forge/leaderboard/submit → บันทึกคะแนนแล้ว prune ให้เหลือ top 10 ต่อระดับ
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmitBody;
    const { level, playerName, timeSeconds, runCount, levelId } = body;

    // ---- ตรวจความถูกต้องของข้อมูล ----
    if (!level || !(DIFFICULTIES as string[]).includes(level)) {
      return NextResponse.json({ error: "ระดับไม่ถูกต้อง" }, { status: 400 });
    }
    if (
      typeof timeSeconds !== "number" ||
      typeof runCount !== "number" ||
      timeSeconds < 0 ||
      runCount < 1 ||
      !levelId
    ) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    const name = (playerName ?? "").trim();
    if (name.length === 0) {
      return NextResponse.json({ error: "กรุณาใส่ชื่อ" }, { status: 400 });
    }
    if (name.length > 15) {
      return NextResponse.json(
        { error: "ชื่อยาวเกินไป (สูงสุด 15 ตัวอักษร)" },
        { status: 400 },
      );
    }
    if (containsProfanity(name)) {
      return NextResponse.json(
        { error: "ชื่อนี้มีคำไม่เหมาะสม กรุณาเปลี่ยนชื่อ" },
        { status: 400 },
      );
    }

    // คำนวณคะแนนใหม่ที่ฝั่ง server เสมอ (กันการปลอมคะแนนจาก client)
    const score = calculateForgeScore(timeSeconds, runCount);

    await db.insert(functionForgeLeaderboard).values({
      level,
      playerName: name,
      score,
      timeSeconds,
      runCount,
      levelId,
    });

    // prune: เก็บแค่ top 10 ของระดับนี้ ลบที่เหลือทิ้ง (กันตารางโตไม่จำกัด)
    const keep = await db
      .select({ id: functionForgeLeaderboard.id })
      .from(functionForgeLeaderboard)
      .where(eq(functionForgeLeaderboard.level, level))
      .orderBy(
        desc(functionForgeLeaderboard.score),
        asc(functionForgeLeaderboard.timeSeconds),
      )
      .limit(10);

    const keepIds = keep.map((r) => r.id);
    if (keepIds.length > 0) {
      await db
        .delete(functionForgeLeaderboard)
        .where(
          and(
            eq(functionForgeLeaderboard.level, level),
            notInArray(functionForgeLeaderboard.id, keepIds),
          ),
        );
    }

    return NextResponse.json({ ok: true, score });
  } catch (err) {
    console.error("[forge/submit] error:", err);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
