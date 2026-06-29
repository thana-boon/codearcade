import type { Difficulty } from "@/lib/types";
import { computeOptimalSteps, type Direction } from "@/lib/maze";

export interface CodeArenaLevel {
  id: string;
  level: Difficulty;
  title: string;
  description: string;
  // grid 2 มิติ: 0=ทางเดิน 1=กำแพง 2=จุดเริ่ม 3=เป้าหมาย 4=ไอเทม
  grid: number[][];
  startDirection: Direction;
  // true = ต้องเก็บไอเทมครบทุกชิ้นก่อนถึงเป้าหมาย (ใช้กับด่าน god)
  requiresAllItems: boolean;
}

// ด่านที่เตรียมพร้อมเล่น: เพิ่ม optimalSteps ที่คำนวณด้วย BFS แล้ว
export interface PreparedArenaLevel extends CodeArenaLevel {
  optimalSteps: number;
}

// ---- helper อ่าน maze จากสตริงเพื่อให้แก้ไขง่ายและลดข้อผิดพลาด ----
// '.' = ทางเดิน, '#' = กำแพง, 'S' = จุดเริ่ม, 'G' = เป้าหมาย, '*' = ไอเทม
const CHAR_TO_CELL: Record<string, number> = {
  ".": 0,
  "#": 1,
  S: 2,
  G: 3,
  "*": 4,
};

function g(rows: string[]): number[][] {
  return rows.map((row) => [...row].map((ch) => CHAR_TO_CELL[ch] ?? 0));
}

// ===================== NOOB (6 ด่าน) =====================
// เดินตรง/เลี้ยวเดียว ไม่มีทางแยก สอนการเรียก API ทีละบรรทัด
const noob: CodeArenaLevel[] = [
  {
    id: "ca-noob-straight",
    level: "noob",
    title: "เดินตรงไปข้างหน้า",
    description:
      "bot หันไปทางขวาอยู่แล้ว เดินตรงไปเรื่อย ๆ จนถึงธง 🏁 ลองใช้ move_forward() หลาย ๆ ครั้ง",
    grid: g(["#######", "S.....G", "#######"]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-noob-up",
    level: "noob",
    title: "เดินขึ้นบน",
    description: "bot หันขึ้นบน เดินตรงขึ้นไปหาเป้าหมายด้านบนสุด",
    grid: g(["#G#", "#.#", "#.#", "#.#", "#S#"]),
    startDirection: "up",
    requiresAllItems: false,
  },
  {
    id: "ca-noob-turn-right",
    level: "noob",
    title: "เลี้ยวขวาหนึ่งครั้ง",
    description:
      "เดินขึ้นไปก่อน แล้วใช้ turn_right() เลี้ยวไปเก็บเป้าหมายทางขวา",
    grid: g(["#####", "#...G", "#.###", "#.###", "#S###"]),
    startDirection: "up",
    requiresAllItems: false,
  },
  {
    id: "ca-noob-turn-left",
    level: "noob",
    title: "เลี้ยวซ้ายหนึ่งครั้ง",
    description: "เดินขึ้นไปแล้วใช้ turn_left() เลี้ยวไปทางซ้ายหาเป้าหมาย",
    grid: g(["#####", "G...#", "###.#", "###.#", "###S#"]),
    startDirection: "up",
    requiresAllItems: false,
  },
  {
    id: "ca-noob-zigzag",
    level: "noob",
    title: "หักสองที",
    description: "เดินขวา ลงล่าง แล้วเลี้ยวอีกทีไปหาเป้าหมาย",
    grid: g(["S..##", "##.##", "##..G"]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-noob-u",
    level: "noob",
    title: "ตัวยู",
    description: "เดินขวาไปสุด ลงล่าง แล้ววกกลับมาทางซ้ายหาเป้าหมาย",
    grid: g(["S....", "####.", "G...."]),
    startDirection: "right",
    requiresAllItems: false,
  },
];

// ===================== BEGINNER (7 ด่าน) =====================
// มีหลายเลี้ยว ทางเดินยาวขึ้น เหมาะกับการใช้ for loop ย่อโค้ด
const beginner: CodeArenaLevel[] = [
  {
    id: "ca-beg-long-straight",
    level: "beginner",
    title: "ทางยาว",
    description:
      "ทางตรงยาว ๆ ลองใช้ for loop เดินแทนที่จะพิมพ์ move_forward() ทีละบรรทัด",
    grid: g(["#########", "S.......G", "#########"]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-beg-stairs",
    level: "beginner",
    title: "ขั้นบันได",
    description: "เดินขึ้นทีละขั้น สลับเลี้ยวซ้าย-ขวาไปเรื่อย ๆ จนถึงเป้าหมาย",
    grid: g([
      "####G",
      "####.",
      "##...",
      "##.##",
      "S..##",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-beg-spiral",
    level: "beginner",
    title: "วกวน",
    description: "ทางวกไปวกมา เดินตามช่องที่เปิดอยู่จนกว่าจะถึงเป้าหมาย",
    grid: g([
      "S.....",
      "#####.",
      "......",
      ".#####",
      ".....G",
      "######",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-beg-comb",
    level: "beginner",
    title: "หวี",
    description: "ทางเดินหักหลายช่วง ค่อย ๆ ไล่ไปจนถึงปลายทาง",
    grid: g([
      "S.#G",
      "..#.",
      ".#..",
      "....",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-beg-tall",
    level: "beginner",
    title: "หอคอย",
    description: "ไต่ขึ้นไปด้านบน เลี้ยวไปมาตามช่อง จนถึงยอด",
    grid: g([
      "G.###",
      "#.###",
      "#...#",
      "###.#",
      "###.#",
      "###S#",
    ]),
    startDirection: "up",
    requiresAllItems: false,
  },
  {
    id: "ca-beg-snake",
    level: "beginner",
    title: "งูเลื้อย",
    description: "ทางคดเคี้ยวแบบงู เลื้อยซ้าย-ขวาไปจนสุดทาง",
    grid: g([
      "S....",
      "####.",
      ".....",
      ".####",
      "....G",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-beg-loop6",
    level: "beginner",
    title: "หกเหลี่ยมเล็ก",
    description: "เดินรอบกรอบไปหาเป้าหมายอีกฝั่ง ลองนับจังหวะเลี้ยวให้ดี",
    grid: g([
      "S.....",
      "#####.",
      "#####.",
      "#####.",
      "G.....",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
];

// ===================== PRO (9 ด่าน) =====================
// มีทางแยก ต้องใช้ is_wall_ahead() ร่วมกับ if/else ตัดสินใจ
const pro: CodeArenaLevel[] = [
  {
    id: "ca-pro-branch1",
    level: "pro",
    title: "ทางแยกแรก",
    description:
      "มีกำแพงโผล่มาเป็นช่วง ๆ ใช้ is_wall_ahead() เช็กก่อน ถ้าชนให้เลี้ยว",
    grid: g([
      "S.#..G",
      "#.#.##",
      "#...##",
      "######",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-maze8a",
    level: "pro",
    title: "เขาวงกตเล็ก A",
    description: "เขาวงกตขนาดย่อม เดินตามทางที่เปิด เช็กกำแพงทุกครั้งก่อนก้าว",
    grid: g([
      "S.#####",
      "#.#####",
      "#...#G#",
      "###.#.#",
      "###...#",
      "#######",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-maze8b",
    level: "pro",
    title: "เขาวงกตเล็ก B",
    description: "ทางตันหลายจุด ใช้เซ็นเซอร์กำแพงเพื่อเลือกเลี้ยวให้ถูก",
    grid: g([
      "S....#",
      "####.#",
      "#G#..#",
      "#.#.##",
      "#...##",
      "######",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-zig",
    level: "pro",
    title: "ซิกแซ็กกำแพง",
    description: "กำแพงสลับฟันปลา ต้องเลี้ยวหลบไปมาอย่างเป็นจังหวะ",
    grid: g([
      "S.....",
      ".####.",
      ".#G##.",
      ".#.##.",
      ".#....",
      ".#####",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-cross",
    level: "pro",
    title: "สี่แยก",
    description: "เจอสี่แยกกลางทาง ต้องเลือกทางที่พาไปถึงเป้าหมาย",
    grid: g([
      "##S##",
      "##.##",
      "#...#",
      "##.##",
      "##.##",
      "##G##",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-rooms",
    level: "pro",
    title: "ห้องต่อห้อง",
    description: "ทะลุห้องเล็ก ๆ ต่อกันผ่านประตูแคบ ๆ ไปจนถึงห้องสุดท้าย",
    grid: g([
      "S#####",
      ".#####",
      "....##",
      "###.##",
      "###...",
      "#####G",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-hook",
    level: "pro",
    title: "ตะขอ",
    description: "ทางวกกลับเป็นรูปตะขอ ต้องเดินอ้อมไกลหน่อยกว่าจะถึง",
    grid: g([
      "S......",
      "#####.#",
      "#...#.#",
      "#.#.#.#",
      "#.#...#",
      "#G#####",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-detour",
    level: "pro",
    title: "ทางอ้อม",
    description: "ทางตรงตัน ต้องหาเส้นอ้อมด้านข้างเพื่อไปต่อ",
    grid: g([
      "S.#G..",
      "#.#.#.",
      "#.#.#.",
      "#...#.",
      "###..#",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-pro-grid",
    level: "pro",
    title: "ตาราง",
    description: "เขาวงกตแบบตาราง มีหลายเส้นทาง เลือกเส้นที่สั้นที่สุดให้ได้",
    grid: g([
      "S....#",
      "####.#",
      "#....#",
      "#.####",
      "#....G",
      "######",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
];

// ===================== EXPERT (9 ด่าน) =====================
// เขาวงกตซับซ้อนหลายทางแยก เหมาะกับ while loop / wall-following
const expert: CodeArenaLevel[] = [
  {
    id: "ca-exp-maze9a",
    level: "expert",
    title: "เขาวงกตใหญ่ A",
    description: "ทางยาวคดเคี้ยว ใช้ while loop เดินจนกว่าจะถึงเป้าหมาย",
    grid: g([
      "........S",
      ".########",
      ".........",
      "########.",
      ".........",
      ".########",
      ".........",
      "########.",
      "G........",
    ]),
    startDirection: "left",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-maze9b",
    level: "expert",
    title: "เขาวงกตใหญ่ B",
    description: "มีทางตันหลอกหลายจุด ต้องวนหาเส้นที่ทะลุได้จริง",
    grid: g([
      "S.#......",
      "#.#.####.",
      "#.#.#..#.",
      "#.#.#.##.",
      "#...#.#..",
      "###.#.#.#",
      "#.#.#.#.#",
      "#.....#.G",
      "#########",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-comb",
    level: "expert",
    title: "ฟันหวียักษ์",
    description: "ทางเดินเป็นซี่ ๆ ต้องไล่เข้าออกทุกซี่กว่าจะทะลุไปอีกฝั่ง",
    grid: g([
      "S#...#...",
      ".#.#.#.#.",
      ".#.#.#.#.",
      ".#.#.#.#.",
      ".#.#.#.#.",
      "...#...#G",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-spiral",
    level: "expert",
    title: "ก้นหอย",
    description: "เดินวนเป็นก้นหอยเข้าไปหาเป้าหมายใจกลางเขาวงกต",
    grid: g([
      "S........",
      "########.",
      ".......#.",
      ".#####.#.",
      ".#G..#.#.",
      ".#.###.#.",
      ".#.....#.",
      ".#######.",
      ".........",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-rooms",
    level: "expert",
    title: "เขาวงกตหลายห้อง",
    description: "ห้องเชื่อมต่อกันด้วยประตูแคบ ต้องหาประตูที่ถูกในแต่ละห้อง",
    grid: g([
      "S.#...#..",
      "..#.#.#.#",
      "#.#.#...#",
      "#...####.",
      "###.#....",
      "#...#.##.",
      "#.###.#..",
      "#.....#.G",
      "######.##",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-snake",
    level: "expert",
    title: "งูยักษ์",
    description: "ทางงูยาวมาก ต้องเลื้อยกลับไปกลับมาหลายรอบ",
    grid: g([
      "S........",
      "########.",
      ".........",
      ".########",
      ".........",
      "########.",
      ".........",
      ".########",
      "G........",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-twist",
    level: "expert",
    title: "บิดเกลียว",
    description: "ทางบิดไปมาแบบไม่เป็นระเบียบ ต้องอาศัย sensor ตลอดเส้นทาง",
    grid: g([
      "S#...#...",
      ".#.#.#.#.",
      ".#.#.#.#.",
      ".#.#.#.#.",
      ".#.#.#.#.",
      ".#.#.#.#.",
      ".#.#.#.#.",
      ".#.#.#.#.",
      "...#...#G",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-double",
    level: "expert",
    title: "ทางคู่ขนาน",
    description: "มีสองเส้นทางขนานกัน เลือกเส้นที่พาไปถึงเป้าหมายได้จริง",
    grid: g([
      "S.#.....#",
      ".#.#####.",
      ".#.....#.",
      ".#####.#.",
      ".....#.#.",
      "####.#.#.",
      "#G...#...",
      "#.#####.#",
      "#.......#",
    ]),
    startDirection: "down",
    requiresAllItems: false,
  },
  {
    id: "ca-exp-labyrinth",
    level: "expert",
    title: "เขาวงกตปริศนา",
    description: "เขาวงกตหนาแน่น ทางแยกเยอะมาก ใช้ while loop เดินอย่างมีระบบ",
    grid: g([
      "S.......#",
      "#.#####.#",
      "#.#...#.#",
      "#.#.#.#.#",
      "#.#.#.#.#",
      "#...#.#.#",
      "#####.#.#",
      "#G....#..",
      "#######.#",
    ]),
    startDirection: "right",
    requiresAllItems: false,
  },
];

// ===================== GOD (7 ด่าน) =====================
// ต้องเก็บไอเทม (*) ให้ครบก่อนถึงเป้าหมาย maze ใหญ่และซับซ้อน
const god: CodeArenaLevel[] = [
  {
    id: "ca-god-collect3",
    level: "god",
    title: "เก็บสามดวง",
    description:
      "เก็บไอเทม ⭐ ให้ครบทั้งสามชิ้นก่อน แล้วค่อยไปที่เป้าหมาย ใช้ collect_item() เมื่อยืนบนไอเทม",
    grid: g([
      "S....*....",
      ".####.####",
      ".#*....#..",
      ".#.###.#.#",
      ".#...#.#.#",
      ".###.#.#.#",
      "...#.#.#.#",
      "#.#.#.#.#.",
      "#.....*..G",
      "##########",
    ]),
    startDirection: "right",
    requiresAllItems: true,
  },
  {
    id: "ca-god-corners",
    level: "god",
    title: "ไอเทมสี่มุม",
    description: "ไอเทมกระจายตามมุม maze ต้องวางแผนเส้นทางเก็บให้ครบก่อนเข้าเป้า",
    grid: g([
      "S...#...*.",
      ".##.#.##..",
      ".#....#.#.",
      ".#.##.#.#.",
      "*..#..#..G",
      ".#.#.##.#.",
      ".#.#..#.#.",
      ".#.##.#.#.",
      "....#....*",
      "#########.",
    ]),
    startDirection: "down",
    requiresAllItems: true,
  },
  {
    id: "ca-god-line",
    level: "god",
    title: "เรียงเก็บ",
    description: "ไอเทมเรียงอยู่ตามทาง เก็บไปเรื่อย ๆ ระหว่างเดินสู่เป้าหมาย",
    grid: g([
      "S.*.*.*.G",
      "#.#.#.#.#",
      "..#.#.#..",
      ".##.#.##.",
      ".........",
    ]),
    startDirection: "right",
    requiresAllItems: true,
  },
  {
    id: "ca-god-maze10",
    level: "god",
    title: "ล่าสมบัติ",
    description: "maze ใหญ่ ไอเทมซ่อนในซอก ต้องเก็บครบทุกชิ้นแล้วหาทางออก",
    grid: g([
      "S#...#...#",
      ".#.#.#.#.#",
      ".#.#.#.#*#",
      ".#.#.#.#.#",
      "*#.#*#.#.#",
      ".#.#.#.#.#",
      ".#.#.#.#.#",
      ".#.#.#.#.#",
      ".#.#.#.#.#",
      "...#...#G#",
    ]),
    startDirection: "down",
    requiresAllItems: true,
  },
  {
    id: "ca-god-cross",
    level: "god",
    title: "กางเขนสมบัติ",
    description: "ไอเทมวางเป็นรูปกางเขน เก็บให้ครบทุกแขนก่อนกลับไปเป้าหมาย",
    grid: g([
      "....*.....",
      ".########.",
      ".#......#.",
      ".#.####.#.",
      "*..#S.#..*",
      ".#.#.#.#..",
      ".#....#.#.",
      ".######.#.",
      "....*...G.",
      "##########",
    ]),
    startDirection: "up",
    requiresAllItems: true,
  },
  {
    id: "ca-god-double-ring",
    level: "god",
    title: "วงแหวนคู่",
    description: "ไอเทมอยู่บนวงแหวนสองชั้น ต้องวนเก็บทั้งสองชั้นให้ครบ",
    grid: g([
      "S....*....",
      "#########.",
      "..........",
      ".#########",
      ".....*....",
      "#########.",
      "..........",
      ".#########",
      "...*.....G",
      "##########",
    ]),
    startDirection: "right",
    requiresAllItems: true,
  },
  {
    id: "ca-god-final",
    level: "god",
    title: "บททดสอบสุดท้าย",
    description:
      "maze ใหญ่ที่สุด รวมทุกอย่าง: ทางแยกเยอะ ไอเทมหลายจุด เก็บครบแล้วไปเป้าหมาย",
    grid: g([
      "S.....*......",
      "############.",
      ".............",
      ".############",
      "......*......",
      "############.",
      ".............",
      ".############",
      "......*......",
      "############.",
      "G............",
      "#############",
    ]),
    startDirection: "right",
    requiresAllItems: true,
  },
];

const ALL: CodeArenaLevel[] = [...noob, ...beginner, ...pro, ...expert, ...god];

// memoize optimalSteps ที่คำนวณด้วย BFS (กันคำนวณซ้ำทุกครั้งที่เรียก)
const optimalCache = new Map<string, number>();

function getOptimal(level: CodeArenaLevel): number {
  const cached = optimalCache.get(level.id);
  if (cached !== undefined) return cached;
  const steps =
    computeOptimalSteps(level.grid, level.startDirection, level.requiresAllItems) ??
    0;
  optimalCache.set(level.id, steps);
  return steps;
}

export function prepareArenaLevel(level: CodeArenaLevel): PreparedArenaLevel {
  return { ...level, optimalSteps: getOptimal(level) };
}

export function getArenaLevelsByDifficulty(
  level: Difficulty,
): CodeArenaLevel[] {
  return ALL.filter((l) => l.level === level);
}

export function getArenaLevelById(id: string): CodeArenaLevel | undefined {
  return ALL.find((l) => l.id === id);
}

// สุ่มเลือก n ด่านจากระดับที่กำหนด (ใช้ตอนสร้างห้อง multiplayer)
export function pickRandomArenaLevels(
  level: Difficulty,
  n: number,
): CodeArenaLevel[] {
  const pool = [...getArenaLevelsByDifficulty(level)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
