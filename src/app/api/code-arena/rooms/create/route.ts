import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaRooms, codeArenaRoomPlayers } from "@/lib/db/schema";
import { containsProfanity } from "@/lib/profanity";
import {
  generateRoomCode,
  generateToken,
  pruneExpiredRooms,
  roomExpiry,
} from "@/lib/arena-server";
import { pickRandomArenaLevels } from "@/lib/levels/code-arena-levels";
import { DIFFICULTIES } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROOM_LEVEL_COUNT = 5;

interface CreateBody {
  roomName?: string;
  password?: string;
  level?: string;
  playerName?: string;
}

// POST /api/code-arena/rooms/create → สร้างห้อง, สุ่ม 5 ด่าน, ใส่หัวห้องเป็นผู้เล่นคนแรก
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody;
    const roomName = (body.roomName ?? "").trim();
    const password = (body.password ?? "").trim();
    const level = body.level ?? "";
    const playerName = (body.playerName ?? "").trim();

    if (roomName.length === 0 || roomName.length > 30) {
      return NextResponse.json(
        { error: "ชื่อห้องต้องยาว 1–30 ตัวอักษร" },
        { status: 400 },
      );
    }
    if (password.length === 0 || password.length > 20) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องยาว 1–20 ตัวอักษร" },
        { status: 400 },
      );
    }
    if (!(DIFFICULTIES as string[]).includes(level)) {
      return NextResponse.json({ error: "ระดับไม่ถูกต้อง" }, { status: 400 });
    }
    if (playerName.length === 0 || playerName.length > 15) {
      return NextResponse.json(
        { error: "ชื่อผู้เล่นต้องยาว 1–15 ตัวอักษร" },
        { status: 400 },
      );
    }
    if (containsProfanity(roomName) || containsProfanity(playerName)) {
      return NextResponse.json(
        { error: "มีคำไม่เหมาะสม กรุณาเปลี่ยนข้อความ" },
        { status: 400 },
      );
    }

    await pruneExpiredRooms();

    // สุ่ม 5 ด่านจากระดับนี้ (ทุกคนในห้องเล่นชุดเดียวกัน)
    const levels = pickRandomArenaLevels(
      level as (typeof DIFFICULTIES)[number],
      ROOM_LEVEL_COUNT,
    );
    if (levels.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีด่านในระดับนี้" },
        { status: 400 },
      );
    }
    const levelIds = JSON.stringify(levels.map((l) => l.id));

    // หา roomCode ที่ไม่ชนกับห้องที่ยัง active (ลองสุ่มหลายครั้ง)
    let roomCode = "";
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = generateRoomCode();
      const existing = await db
        .select({ id: codeArenaRooms.id })
        .from(codeArenaRooms)
        .where(eq(codeArenaRooms.roomCode, candidate))
        .limit(1);
      if (existing.length === 0) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) {
      return NextResponse.json(
        { error: "สร้างห้องไม่สำเร็จ ลองใหม่อีกครั้ง" },
        { status: 500 },
      );
    }

    const hostToken = generateToken();
    const playerToken = generateToken();

    const [room] = await db
      .insert(codeArenaRooms)
      .values({
        roomCode,
        roomName,
        password,
        level,
        levelIds,
        hostToken,
        expiresAt: roomExpiry(),
      })
      .returning({ id: codeArenaRooms.id });

    // หัวห้องเป็นผู้เล่นคนแรกของห้อง
    await db.insert(codeArenaRoomPlayers).values({
      roomId: room.id,
      playerToken,
      playerName,
    });

    return NextResponse.json({ roomCode, hostToken, playerToken });
  } catch (err) {
    console.error("[arena/rooms/create] error:", err);
    return NextResponse.json({ error: "สร้างห้องไม่สำเร็จ" }, { status: 500 });
  }
}
