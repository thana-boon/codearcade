import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaRooms, codeArenaRoomPlayers } from "@/lib/db/schema";
import { pruneExpiredRooms } from "@/lib/arena-server";

export const dynamic = "force-dynamic";

// GET /api/code-arena/rooms/[roomCode] → ข้อมูลห้อง + รายชื่อผู้เล่นพร้อมคะแนน (ใช้ auto-refresh)
export async function GET(
  _req: Request,
  { params }: { params: { roomCode: string } },
) {
  const roomCode = params.roomCode.trim().toUpperCase();

  try {
    await pruneExpiredRooms();

    const [room] = await db
      .select()
      .from(codeArenaRooms)
      .where(eq(codeArenaRooms.roomCode, roomCode))
      .limit(1);

    if (!room || room.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "ไม่พบห้องนี้" }, { status: 404 });
    }

    const players = await db
      .select({
        playerName: codeArenaRoomPlayers.playerName,
        levelsCompleted: codeArenaRoomPlayers.levelsCompleted,
        totalScore: codeArenaRoomPlayers.totalScore,
        joinedAt: codeArenaRoomPlayers.joinedAt,
      })
      .from(codeArenaRoomPlayers)
      .where(eq(codeArenaRoomPlayers.roomId, room.id))
      .orderBy(
        desc(codeArenaRoomPlayers.totalScore),
        desc(codeArenaRoomPlayers.levelsCompleted),
      );

    // levelIds เก็บเป็น JSON string array — แปลงกลับให้ client ใช้โหลดด่าน
    let levelIds: string[] = [];
    try {
      levelIds = JSON.parse(room.levelIds) as string[];
    } catch {
      levelIds = [];
    }

    return NextResponse.json({
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        level: room.level,
        levelIds,
        levelCount: levelIds.length,
        isClosed: room.isClosed,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        players,
      },
    });
  } catch (err) {
    console.error("[arena/rooms/get] error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
