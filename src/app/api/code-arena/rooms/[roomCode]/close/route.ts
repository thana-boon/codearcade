import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaRooms } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

interface CloseBody {
  hostToken?: string;
}

// POST /api/code-arena/rooms/[roomCode]/close → หัวห้องปิดห้อง (ตรวจ hostToken)
export async function POST(
  req: Request,
  { params }: { params: { roomCode: string } },
) {
  try {
    const roomCode = params.roomCode.trim().toUpperCase();
    const { hostToken } = (await req.json()) as CloseBody;

    if (!hostToken) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ปิดห้อง" }, { status: 403 });
    }

    const [room] = await db
      .select()
      .from(codeArenaRooms)
      .where(eq(codeArenaRooms.roomCode, roomCode))
      .limit(1);

    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องนี้" }, { status: 404 });
    }
    // ตรวจ token ของหัวห้อง — คนอื่นปิดห้องไม่ได้
    if (room.hostToken !== hostToken) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ปิดห้อง" }, { status: 403 });
    }

    await db
      .update(codeArenaRooms)
      .set({ isClosed: true })
      .where(eq(codeArenaRooms.id, room.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[arena/rooms/close] error:", err);
    return NextResponse.json({ error: "ปิดห้องไม่สำเร็จ" }, { status: 500 });
  }
}
