import type { Difficulty } from "@/lib/types";

export interface DifficultyMeta {
  level: Difficulty;
  label: string;
  description: string; // อธิบายแนวบั๊กที่จะเจอ (ไม่บอกเฉลย)
  bugTypes: string;
  color: string; // class สีของ badge/border
  emoji: string;
}

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  noob: {
    level: "noob",
    label: "noob",
    description: "bug ที่เห็นง่าย ๆ จิ้มปุ๊บติดปั๊บ",
    bugTypes: "พิมพ์ผิด, syntax error พื้นฐาน",
    color: "text-success border-success",
    emoji: "🌱",
  },
  beginner: {
    level: "beginner",
    label: "beginner",
    description: "ลำดับหรือค่าที่สลับ หรือใส่ค่าผิด",
    bugTypes: "ลำดับการคำนวณ, ไม่แปลงชนิดข้อมูล, = กับ ==",
    color: "text-accent border-accent",
    emoji: "🔰",
  },
  pro: {
    level: "pro",
    label: "pro",
    description: "เงื่อนไขหรือ loop ทำงานเพี้ยน",
    bugTypes: "off-by-one ใน range(), and/or ผิด, loop วนผิด",
    color: "text-warn border-warn",
    emoji: "⚡",
  },
  expert: {
    level: "expert",
    label: "expert",
    description: "logic หลายชั้น ต้องอ่านให้ขาด",
    bugTypes: "nested loop, scope สับสน, mutable default argument",
    color: "text-[#d2a8ff] border-[#d2a8ff]",
    emoji: "🔥",
  },
  god: {
    level: "god",
    label: "god",
    description: "บั๊กเนียนมาก ต้องอ่านอย่างพินิจ",
    bugTypes: "floating point, off-by-one บน edge case, side-effect",
    color: "text-danger border-danger",
    emoji: "💀",
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = [
  "noob",
  "beginner",
  "pro",
  "expert",
  "god",
];
