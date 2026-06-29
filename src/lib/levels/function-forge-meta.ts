import type { Difficulty } from "@/lib/types";

export interface ForgeMeta {
  level: Difficulty;
  label: string;
  description: string; // อธิบายภาพรวมของโจทย์ในระดับนี้
  algoTypes: string; // แนว algorithm ที่จะเจอ (ไม่บอกเฉลย)
  color: string; // class สีของ badge/border (ใช้ชุดเดียวกับ Bug Hunt เพื่อความสม่ำเสมอ)
  emoji: string;
}

// ใช้ระดับความยากชุดเดียวกับ Bug Hunt (Difficulty) แต่คำอธิบายเป็นแนวเขียนฟังก์ชัน
export const FORGE_META: Record<Difficulty, ForgeMeta> = {
  noob: {
    level: "noob",
    label: "noob",
    description: "เขียนเงื่อนไขและคืนค่าง่าย ๆ",
    algoTypes: "math/condition พื้นฐาน (เลขคู่-คี่, max ของ 2 ค่า, บวก/ลบเลข)",
    color: "text-success border-success",
    emoji: "🌱",
  },
  beginner: {
    level: "beginner",
    label: "beginner",
    description: "จัดการ string และ list เบื้องต้น",
    algoTypes: "reverse string, sum list, นับคำซ้ำ, count vowel",
    color: "text-accent border-accent",
    emoji: "🔰",
  },
  pro: {
    level: "pro",
    label: "pro",
    description: "loop และ list ที่ซับซ้อนขึ้น",
    algoTypes: "หา max/min เอง, filter, sorting เขียนเอง, การวนซ้อนกัน",
    color: "text-warn border-warn",
    emoji: "⚡",
  },
  expert: {
    level: "expert",
    label: "expert",
    description: "recursion และ algorithm หลายขั้นตอน",
    algoTypes: "fibonacci, factorial, binary search, GCD แบบ recursive",
    color: "text-[#d2a8ff] border-[#d2a8ff]",
    emoji: "🔥",
  },
  god: {
    level: "god",
    label: "god",
    description: "algorithm ซับซ้อน ต้องคิดเผื่อ edge case",
    algoTypes: "merge/quick sort, palindrome edge case, dynamic programming",
    color: "text-danger border-danger",
    emoji: "💀",
  },
};

export const FORGE_ORDER: Difficulty[] = [
  "noob",
  "beginner",
  "pro",
  "expert",
  "god",
];
