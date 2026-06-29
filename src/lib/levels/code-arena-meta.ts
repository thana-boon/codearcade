import type { Difficulty } from "@/lib/types";

export interface ArenaMeta {
  level: Difficulty;
  label: string;
  description: string; // อธิบายภาพรวมของด่านในระดับนี้
  skillTypes: string; // ทักษะ/แนวคิดที่จะได้ใช้ (ไม่บอกเฉลย)
  color: string; // class สีของ badge/border (ชุดเดียวกับเกมอื่นเพื่อความสม่ำเสมอ)
  emoji: string;
}

// ใช้ระดับความยากชุดเดียวกับเกมอื่น (Difficulty) แต่คำอธิบายเป็นแนวคุม bot เดิน maze
export const ARENA_META: Record<Difficulty, ArenaMeta> = {
  noob: {
    level: "noob",
    label: "noob",
    description: "เดินตรงและเลี้ยวง่าย ๆ ทำความรู้จัก bot API",
    skillTypes: "move_forward / turn_left / turn_right เรียงทีละบรรทัด",
    color: "text-success border-success",
    emoji: "🌱",
  },
  beginner: {
    level: "beginner",
    label: "beginner",
    description: "มีหลายเลี้ยว เหมาะกับการใช้ loop ย่อโค้ดให้สั้นลง",
    skillTypes: "for loop, เดินซ้ำ ๆ, เลี้ยวหลายครั้ง",
    color: "text-accent border-accent",
    emoji: "🔰",
  },
  pro: {
    level: "pro",
    label: "pro",
    description: "มีทางแยก ต้องใช้ is_wall_ahead() ตัดสินใจ",
    skillTypes: "if/else + sensor, ตรวจกำแพงก่อนเดิน",
    color: "text-warn border-warn",
    emoji: "⚡",
  },
  expert: {
    level: "expert",
    label: "expert",
    description: "เขาวงกตซับซ้อน ใช้ while loop เดินจนกว่าจะถึง",
    skillTypes: "while loop, wall-following, วนจนกว่าถึงเป้าหมาย",
    color: "text-[#d2a8ff] border-[#d2a8ff]",
    emoji: "🔥",
  },
  god: {
    level: "god",
    label: "god",
    description: "ต้องเก็บไอเทมให้ครบก่อนถึงเป้าหมาย พร้อม maze ใหญ่",
    skillTypes: "เก็บไอเทม (collect_item), วางแผนเส้นทาง, รวมทุกทักษะ",
    color: "text-danger border-danger",
    emoji: "💀",
  },
};

export const ARENA_ORDER: Difficulty[] = [
  "noob",
  "beginner",
  "pro",
  "expert",
  "god",
];
