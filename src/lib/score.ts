// สูตรคำนวณคะแนน (ใช้ทั้งฝั่ง client แสดงผล และฝั่ง server ตอนตรวจ/บันทึก)
// ยิ่งใช้เวลาน้อยและตอบผิดน้อย คะแนนยิ่งสูง ต่ำสุด 0
export function calculateScore(
  timeSeconds: number,
  wrongAttempts: number,
): number {
  return Math.max(0, 1000 - timeSeconds * 2 - wrongAttempts * 50);
}

// สูตรคำนวณคะแนนของเกม Function Forge
// ยิ่งใช้เวลาน้อยและกด Run ทดสอบน้อยครั้ง คะแนนยิ่งสูง ต่ำสุด 0
// runCount นับจำนวนครั้งที่กด Run Tests ทั้งหมด (รอบที่ทำให้ผ่านนับด้วย)
// จึงใช้ (runCount - 1) เพื่อไม่หักคะแนนการกด Run รอบแรก
export function calculateForgeScore(
  timeSeconds: number,
  runCount: number,
): number {
  return Math.max(0, 1000 - timeSeconds * 1 - (runCount - 1) * 20);
}

// สูตรคำนวณคะแนนของเกม Code Arena (ใช้ทั้ง Solo และ Multiplayer)
// ยิ่งใช้เวลาน้อย เดิน step เกินจำเป็นน้อย และชนกำแพงน้อย คะแนนยิ่งสูง ต่ำสุด 0
// extraSteps = step ที่เกินจากเส้นทางที่สั้นที่สุด (optimalSteps คำนวณด้วย BFS)
export function calculateArenaScore(
  timeSeconds: number,
  stepsUsed: number,
  optimalSteps: number,
  wallHits: number,
): number {
  const extraSteps = Math.max(0, stepsUsed - optimalSteps);
  return Math.max(0, 1000 - timeSeconds * 1 - extraSteps * 10 - wallHits * 30);
}
