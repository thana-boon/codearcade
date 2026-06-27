// รายการคำหยาบ/ไม่เหมาะสม (ภาษาไทย + อังกฤษ) สำหรับกรองชื่อผู้เล่นก่อนบันทึก leaderboard
// เก็บแบบ normalize (ตัวพิมพ์เล็ก) แล้วเทียบแบบ substring
const BLOCKLIST: string[] = [
  // อังกฤษ
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "cunt",
  "pussy",
  "sex",
  "nigger",
  "nigga",
  "slut",
  "whore",
  "rape",
  "penis",
  "vagina",
  // ไทย (คำหยาบทั่วไป)
  "เหี้ย",
  "สัส",
  "สัด",
  "ควย",
  "เย็ด",
  "หี",
  "แตด",
  "ระยำ",
  "ไอ้สัตว์",
  "อีดอก",
  "ดอกทอง",
  "กระหรี่",
  "หน้าหี",
  "แม่ง",
  "มึง",
  "กู",
];

// คืน true ถ้าชื่อมีคำไม่เหมาะสม
export function containsProfanity(name: string): boolean {
  const normalized = name.toLowerCase().replace(/\s+/g, "");
  return BLOCKLIST.some((word) => normalized.includes(word));
}
