import { NextResponse } from "next/server";
import { and, asc, desc, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaLeaderboard } from "@/lib/db/schema";
import { containsProfanity } from "@/lib/profanity";
import { calculateArenaScore } from "@/lib/score";
import {
  getArenaLevelById,
  prepareArenaLevel,
} from "@/lib/levels/code-arena-levels";
import { DIFFICULTIES } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SubmitBody {
  level?: string;
  playerName?: string;
  timeSeconds?: number;
  stepsUsed?: number;
  wallHits?: number;
  levelId?: string;
}

// POST /api/code-arena/leaderboard/submit → บันทึกคะแนน solo แล้ว prune ให้เหลือ top 10 ต่อระดับ
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmitBody;
    const { level, playerName, timeSeconds, stepsUsed, wallHits, levelId } = body;

    // ---- ตรวจความถูกต้องของข้อมูล ----
    if (!level || !(DIFFICULTIES as string[]).includes(level)) {
      return NextResponse.json({ error: "ระดับไม่ถูกต้อง" }, { status: 400 });
    }
    if (
      typeof timeSeconds !== "number" ||
      typeof stepsUsed !== "number" ||
      typeof wallHits !== "number" ||
      timeSeconds < 0 ||
      stepsUsed < 0 ||
      wallHits < 0 ||
      !levelId
    ) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    // ด่านต้องมีจริงและตรงกับระดับที่ส่งมา
    const levelData = getArenaLevelById(levelId);
    if (!levelData || levelData.level !== level) {
      return NextResponse.json({ error: "ด่านไม่ถูกต้อง" }, { status: 400 });
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
    // optimalSteps มาจาก BFS ของด่านจริง ไม่เชื่อค่าจาก client
    const optimal = prepareArenaLevel(levelData).optimalSteps;
    const score = calculateArenaScore(timeSeconds, stepsUsed, optimal, wallHits);

    await db.insert(codeArenaLeaderboard).values({
      level,
      playerName: name,
      score,
      timeSeconds,
      stepsUsed,
      wallHits,
      levelId,
    });

    // prune: เก็บแค่ top 10 ของระดับนี้ ลบที่เหลือทิ้ง
    const keep = await db
      .select({ id: codeArenaLeaderboard.id })
      .from(codeArenaLeaderboard)
      .where(eq(codeArenaLeaderboard.level, level))
      .orderBy(
        desc(codeArenaLeaderboard.score),
        asc(codeArenaLeaderboard.timeSeconds),
      )
      .limit(10);

    const keepIds = keep.map((r) => r.id);
    if (keepIds.length > 0) {
      await db
        .delete(codeArenaLeaderboard)
        .where(
          and(
            eq(codeArenaLeaderboard.level, level),
            notInArray(codeArenaLeaderboard.id, keepIds),
          ),
        );
    }

    return NextResponse.json({ ok: true, score });
  } catch (err) {
    console.error("[arena/submit] error:", err);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
