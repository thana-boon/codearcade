// helper ฝั่ง server สำหรับโหมด Multiplayer ของ Code Arena
// - สุ่ม room code / token
// - ลบห้องหมดอายุแบบ lazy (เรียกตอนมี request เข้ามาที่ห้องใด ๆ)
import { lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { codeArenaRooms } from "@/lib/db/schema";

// ตัวอักษรที่ไม่กำกวม (ตัด 0/O, 1/I ออก) เพื่อให้พิมพ์ room code ตามได้ง่าย
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

// token สุ่มยาวพอควร ใช้แทนการ login (เก็บใน localStorage ฝั่ง client)
export function generateToken(): string {
  const a = Math.random().toString(36).slice(2);
  const b = Math.random().toString(36).slice(2);
  const c = Date.now().toString(36);
  return `${a}${b}${c}`;
}

// อายุห้อง = 24 ชั่วโมงนับจากตอนสร้าง
export function roomExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + 24 * 60 * 60 * 1000);
}

// ลบห้องที่หมดอายุแล้ว (และผู้เล่นในห้องนั้น) แบบ lazy
// เรียกก่อน query ห้องใด ๆ เพื่อไม่ให้ห้องเก่าค้างในระบบ — ไม่ต้องมี cron
export async function pruneExpiredRooms(): Promise<void> {
  try {
    // ลบเฉพาะแถวห้องที่ expiresAt < now (ผู้เล่นใน room_players ของห้องเก่าจะถูกกรองออกด้วย roomId ที่ไม่มีแล้ว)
    await db.delete(codeArenaRooms).where(lt(codeArenaRooms.expiresAt, new Date()));
  } catch {
    // ถ้า DB ยังไม่พร้อม ปล่อยผ่านเงียบ ๆ ไม่ให้ request พัง
  }
}
