// สูตรคำนวณคะแนน (ใช้ทั้งฝั่ง client แสดงผล และฝั่ง server ตอนตรวจ/บันทึก)
// ยิ่งใช้เวลาน้อยและตอบผิดน้อย คะแนนยิ่งสูง ต่ำสุด 0
export function calculateScore(
  timeSeconds: number,
  wrongAttempts: number,
): number {
  return Math.max(0, 1000 - timeSeconds * 2 - wrongAttempts * 50);
}
