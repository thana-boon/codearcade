// เครื่องมือเรขาคณิตของ maze สำหรับเกม Code Arena
// - แปลง grid ตัวเลขเป็นข้อมูลที่ใช้ได้ (ตำแหน่งเริ่ม/เป้าหมาย/ไอเทม)
// - helper เรื่องทิศทางของ bot
// - คำนวณจำนวน step ที่น้อยที่สุด (optimal) ด้วย BFS เพื่อใช้เทียบคะแนน
//
// ใช้ร่วมกันทั้งฝั่ง client (เรนเดอร์ + รัน) และ logic คำนวณคะแนน
// ทำงานล้วน ๆ ด้วย JavaScript ไม่พึ่ง backend

// ความหมายของตัวเลขในแต่ละช่องของ grid
export const CELL = {
  PATH: 0, // ทางเดินปกติ
  WALL: 1, // กำแพง เดินผ่านไม่ได้
  START: 2, // จุดเริ่มต้นของ bot (เดินผ่านได้)
  GOAL: 3, // เป้าหมาย (เดินผ่านได้)
  ITEM: 4, // ไอเทมที่ต้องเก็บ (เดินผ่านได้)
} as const;

export type Direction = "up" | "down" | "left" | "right";

// ทิศทางเรียงตามเข็มนาฬิกา ใช้คำนวณการหมุนซ้าย/ขวา
const CLOCKWISE: Direction[] = ["up", "right", "down", "left"];

// เวกเตอร์การเคลื่อนที่ของแต่ละทิศ (แถว, คอลัมน์)
const DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

export function turnLeft(dir: Direction): Direction {
  const i = CLOCKWISE.indexOf(dir);
  return CLOCKWISE[(i + 3) % 4];
}

export function turnRight(dir: Direction): Direction {
  const i = CLOCKWISE.indexOf(dir);
  return CLOCKWISE[(i + 1) % 4];
}

// ช่องที่อยู่ "ข้างหน้า" bot ตามทิศที่หันอยู่
export function ahead(
  r: number,
  c: number,
  dir: Direction,
): { r: number; c: number } {
  const { dr, dc } = DELTA[dir];
  return { r: r + dr, c: c + dc };
}

export interface ParsedMaze {
  grid: number[][];
  rows: number;
  cols: number;
  start: { r: number; c: number };
  goal: { r: number; c: number };
  items: { r: number; c: number }[];
}

// อ่าน grid แล้วหาตำแหน่งเริ่ม/เป้าหมาย/ไอเทม (ช่องพิเศษถือเป็นทางเดินได้หมด)
export function parseMaze(grid: number[][]): ParsedMaze {
  let start = { r: 0, c: 0 };
  let goal = { r: 0, c: 0 };
  const items: { r: number; c: number }[] = [];

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const v = grid[r][c];
      if (v === CELL.START) start = { r, c };
      else if (v === CELL.GOAL) goal = { r, c };
      else if (v === CELL.ITEM) items.push({ r, c });
    }
  }

  return {
    grid,
    rows: grid.length,
    cols: grid[0]?.length ?? 0,
    start,
    goal,
    items,
  };
}

// ช่องนั้นอยู่ในขอบเขตและเดินได้ (ไม่ใช่กำแพง) หรือไม่
export function isWalkable(grid: number[][], r: number, c: number): boolean {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return false;
  return grid[r][c] !== CELL.WALL;
}

// ====== คำนวณจำนวน step น้อยที่สุดด้วย BFS ======
// 1 step = move_forward / turn_left / turn_right อย่างละ 1 ครั้ง
// state ของ BFS = (แถว, คอลัมน์, ทิศ, เซ็ตไอเทมที่เก็บแล้วเป็น bitmask)
// เป้าหมาย: ไปถึงช่อง goal โดย (ถ้า requiresAllItems) ต้องเก็บไอเทมครบทุกชิ้นก่อน
//
// คืนค่าจำนวน step ที่น้อยที่สุด หรือ null ถ้าไปไม่ถึง (ด่านที่ดีไม่ควรเป็น null)
export function computeOptimalSteps(
  grid: number[][],
  startDirection: Direction,
  requiresAllItems: boolean,
): number | null {
  const maze = parseMaze(grid);
  const itemIndex = new Map<string, number>();
  maze.items.forEach((it, i) => itemIndex.set(`${it.r},${it.c}`, i));
  const fullMask = (1 << maze.items.length) - 1;
  // ถ้าไม่ต้องเก็บไอเทม ให้ถือว่าครบตั้งแต่แรก (mask ไม่ถูกใช้เป็นเงื่อนไขชนะ)
  const needMask = requiresAllItems ? fullMask : 0;

  const dirIdx = (d: Direction) => CLOCKWISE.indexOf(d);

  // เก็บค่า step ที่ดีที่สุดของแต่ละ state ผ่าน key string
  const key = (r: number, c: number, di: number, mask: number) =>
    `${r},${c},${di},${mask}`;

  // collect ไอเทมที่ช่องเริ่มต้นด้วย (เผื่อ start ทับไอเทม — ปกติไม่ทับ)
  const startMask = collectAt(maze, itemIndex, 0, maze.start.r, maze.start.c);

  const queue: {
    r: number;
    c: number;
    di: number;
    mask: number;
    steps: number;
  }[] = [{ r: maze.start.r, c: maze.start.c, di: dirIdx(startDirection), mask: startMask, steps: 0 }];
  const visited = new Set<string>([
    key(maze.start.r, maze.start.c, dirIdx(startDirection), startMask),
  ]);

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];

    // เงื่อนไขชนะ: อยู่ที่ goal และเก็บไอเทมครบตามต้องการ
    if (
      cur.r === maze.goal.r &&
      cur.c === maze.goal.c &&
      (cur.mask & needMask) === needMask
    ) {
      // บวกจำนวนครั้งที่ต้องเรียก collect_item() เข้าไปด้วย (1 ครั้งต่อไอเทม)
      // เพราะ runner นับ collect_item เป็น step เหมือน move/turn
      const collectSteps = requiresAllItems ? maze.items.length : 0;
      return cur.steps + collectSteps;
    }

    const dir = CLOCKWISE[cur.di];
    const next: { r: number; c: number; di: number; mask: number }[] = [];

    // หมุนซ้าย / หมุนขวา (ตำแหน่งคงเดิม)
    next.push({ r: cur.r, c: cur.c, di: dirIdx(turnLeft(dir)), mask: cur.mask });
    next.push({ r: cur.r, c: cur.c, di: dirIdx(turnRight(dir)), mask: cur.mask });

    // เดินหน้า (เฉพาะเมื่อข้างหน้าเดินได้)
    const f = ahead(cur.r, cur.c, dir);
    if (isWalkable(grid, f.r, f.c)) {
      const mask = collectAt(maze, itemIndex, cur.mask, f.r, f.c);
      next.push({ r: f.r, c: f.c, di: cur.di, mask });
    }

    for (const n of next) {
      const k = key(n.r, n.c, n.di, n.mask);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ ...n, steps: cur.steps + 1 });
      }
    }
  }

  return null;
}

// ถ้าช่อง (r,c) มีไอเทม ให้ตั้ง bit ของไอเทมนั้นใน mask (เก็บอัตโนมัติเมื่อเดินถึง)
function collectAt(
  maze: ParsedMaze,
  itemIndex: Map<string, number>,
  mask: number,
  r: number,
  c: number,
): number {
  const idx = itemIndex.get(`${r},${c}`);
  if (idx === undefined) return mask;
  return mask | (1 << idx);
}
