import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaRooms, codeArenaRoomPlayers } from "@/lib/db/schema";
import { calculateArenaScore } from "@/lib/score";
import {
  getArenaLevelById,
  prepareArenaLevel,
} from "@/lib/levels/code-arena-levels";

export const dynamic = "force-dynamic";

interface SubmitBody {
  playerToken?: string;
  levelIndex?: number;
  timeSeconds?: number;
  stepsUsed?: number;
  wallHits?: number;
}

// POST /api/code-arena/rooms/[roomCode]/submit-level
// บันทึกคะแนนของด่านหนึ่ง คำนวณคะแนนฝั่ง server แล้วบวกเข้า totalScore ของผู้เล่น
export async function POST(
  req: Request,
  { params }: { params: { roomCode: string } },
) {
  try {
    const roomCode = params.roomCode.trim().toUpperCase();
    const body = (await req.json()) as SubmitBody;
    const { playerToken, levelIndex, timeSeconds, stepsUsed, wallHits } = body;

    if (
      !playerToken ||
      typeof levelIndex !== "number" ||
      typeof timeSeconds !== "number" ||
      typeof stepsUsed !== "number" ||
      typeof wallHits !== "number" ||
      timeSeconds < 0 ||
      stepsUsed < 0 ||
      wallHits < 0
    ) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    const [room] = await db
      .select()
      .from(codeArenaRooms)
      .where(eq(codeArenaRooms.roomCode, roomCode))
      .limit(1);

    if (!room || room.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "ไม่พบห้องนี้" }, { status: 404 });
    }
    if (room.isClosed) {
      return NextResponse.json({ error: "ห้องนี้ปิดแล้ว" }, { status: 400 });
    }

    let levelIds: string[] = [];
    try {
      levelIds = JSON.parse(room.levelIds) as string[];
    } catch {
      levelIds = [];
    }
    if (levelIndex < 0 || levelIndex >= levelIds.length) {
      return NextResponse.json({ error: "ด่านไม่ถูกต้อง" }, { status: 400 });
    }

    const [player] = await db
      .select()
      .from(codeArenaRoomPlayers)
      .where(
        and(
          eq(codeArenaRoomPlayers.roomId, room.id),
          eq(codeArenaRoomPlayers.playerToken, playerToken),
        ),
      )
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: "ไม่พบผู้เล่นในห้องนี้" }, { status: 403 });
    }

    // ต้องส่งด่านตามลำดับเท่านั้น (กันส่งซ้ำเพื่ออัดคะแนน)
    // levelIndex ต้องเท่ากับจำนวนด่านที่เคลียร์ไปแล้วพอดี
    if (levelIndex !== player.levelsCompleted) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        totalScore: player.totalScore,
        levelsCompleted: player.levelsCompleted,
      });
    }

    // คำนวณคะแนนฝั่ง server จาก optimalSteps จริงของด่าน (ไม่เชื่อ client)
    const levelData = getArenaLevelById(levelIds[levelIndex]);
    const optimal = levelData ? prepareArenaLevel(levelData).optimalSteps : 0;
    const score = calculateArenaScore(timeSeconds, stepsUsed, optimal, wallHits);

    const newTotal = player.totalScore + score;
    const newCompleted = player.levelsCompleted + 1;

    await db
      .update(codeArenaRoomPlayers)
      .set({ totalScore: newTotal, levelsCompleted: newCompleted })
      .where(eq(codeArenaRoomPlayers.id, player.id));

    return NextResponse.json({
      ok: true,
      score,
      totalScore: newTotal,
      levelsCompleted: newCompleted,
    });
  } catch (err) {
    console.error("[arena/rooms/submit-level] error:", err);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
