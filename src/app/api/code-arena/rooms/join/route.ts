import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaRooms, codeArenaRoomPlayers } from "@/lib/db/schema";
import { containsProfanity } from "@/lib/profanity";
import { generateToken, pruneExpiredRooms } from "@/lib/arena-server";

export const dynamic = "force-dynamic";

const MAX_PLAYERS = 40;

interface JoinBody {
  roomCode?: string;
  password?: string;
  playerName?: string;
}

// ข้อความรวม ๆ ไม่บอกว่าผิดตรงไหน (กัน brute-force รหัสห้อง/รหัสผ่าน)
const GENERIC_FAIL = "เข้าร่วมห้องไม่ได้ ตรวจสอบรหัสห้องและรหัสผ่านอีกครั้ง";

// POST /api/code-arena/rooms/join → ตรวจสอบแล้วเพิ่มผู้เล่นเข้าห้อง คืน playerToken
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JoinBody;
    const roomCode = (body.roomCode ?? "").trim().toUpperCase();
    const password = (body.password ?? "").trim();
    const playerName = (body.playerName ?? "").trim();

    if (playerName.length === 0 || playerName.length > 15) {
      return NextResponse.json(
        { error: "ชื่อผู้เล่นต้องยาว 1–15 ตัวอักษร" },
        { status: 400 },
      );
    }
    if (containsProfanity(playerName)) {
      return NextResponse.json(
        { error: "ชื่อนี้มีคำไม่เหมาะสม กรุณาเปลี่ยนชื่อ" },
        { status: 400 },
      );
    }
    if (!roomCode || !password) {
      return NextResponse.json({ error: GENERIC_FAIL }, { status: 400 });
    }

    await pruneExpiredRooms();

    const [room] = await db
      .select()
      .from(codeArenaRooms)
      .where(eq(codeArenaRooms.roomCode, roomCode))
      .limit(1);

    // ห้องไม่มี / รหัสผ่านผิด / หมดอายุ → ข้อความรวม ๆ เหมือนกันหมด
    if (!room || room.password !== password) {
      return NextResponse.json({ error: GENERIC_FAIL }, { status: 400 });
    }
    if (room.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: GENERIC_FAIL }, { status: 400 });
    }

    // สถานะเฉพาะที่บอกได้ (ไม่ช่วย brute-force): ปิดแล้ว / เต็มแล้ว
    if (room.isClosed) {
      return NextResponse.json({ error: "ห้องนี้ปิดรับแล้ว" }, { status: 400 });
    }

    const players = await db
      .select({ id: codeArenaRoomPlayers.id })
      .from(codeArenaRoomPlayers)
      .where(eq(codeArenaRoomPlayers.roomId, room.id));
    if (players.length >= MAX_PLAYERS) {
      return NextResponse.json(
        { error: "ห้องเต็มแล้ว (สูงสุด 40 คน)" },
        { status: 400 },
      );
    }

    const playerToken = generateToken();
    await db.insert(codeArenaRoomPlayers).values({
      roomId: room.id,
      playerToken,
      playerName,
    });

    return NextResponse.json({ playerToken });
  } catch (err) {
    console.error("[arena/rooms/join] error:", err);
    return NextResponse.json({ error: "เข้าร่วมห้องไม่ได้" }, { status: 500 });
  }
}
