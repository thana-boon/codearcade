import type { Difficulty } from "@/lib/types";

// test case หนึ่งกรณี: input คือ argument ที่จะส่งเข้า function (เรียงตามลำดับ)
// expectedOutput คือค่าที่ function ต้อง return กลับมา
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ForgeTestCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expectedOutput: any;
}

export interface FunctionForgeLevel {
  id: string;
  level: Difficulty;
  title: string;
  // คำอธิบายโจทย์ พร้อมตัวอย่าง input/output อย่างน้อย 1 ตัวอย่าง
  description: string;
  // ชื่อฟังก์ชันที่ผู้เล่นต้องเขียน/เติมให้สมบูรณ์ (ต้องตรงเป๊ะ)
  functionName: string;
  // โค้ด Python เริ่มต้นในกล่อง editor (skeleton/signature/เปล่า ตามระดับ)
  starterCode: string;
  // test ที่ผู้เล่นเห็นรายละเอียด (input + expected + ผลที่ได้)
  visibleTests: ForgeTestCase[];
  // test ที่ซ่อนไว้ ไม่เปิดรายละเอียดให้ผู้เล่น
  hiddenTests: ForgeTestCase[];
  // true = สุ่ม input ใหม่ทุกครั้ง โดยคำนวณ expectedOutput จาก input จริง (ไม่ hardcode)
  randomizable: boolean;
  // ฟังก์ชันสร้างชุด test ใหม่แบบสุ่ม (มีเมื่อ randomizable = true)
  generate?: () => { visibleTests: ForgeTestCase[]; hiddenTests: ForgeTestCase[] };
}

// ---- helper สำหรับด่านที่สุ่มค่า ----
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// skeleton พร้อม docstring + pass (ใช้กับ noob/beginner)
function skeleton(signature: string, doc: string): string {
  return `def ${signature}:\n    """${doc}"""\n    pass\n`;
}

// signature เปล่า ๆ ไม่มี docstring/comment (ใช้กับ pro)
function signatureOnly(signature: string): string {
  return `def ${signature}:\n    \n`;
}

// ===================== NOOB (6 ด่าน) =====================
const noob: FunctionForgeLevel[] = [
  {
    id: "ff-noob-is-even",
    level: "noob",
    title: "เลขคู่หรือเปล่า",
    description:
      "เขียน is_even(n) คืน True ถ้า n เป็นเลขคู่ ไม่งั้นคืน False เช่น is_even(4) → True",
    functionName: "is_even",
    starterCode: skeleton("is_even(n)", "คืน True ถ้า n เป็นเลขคู่ ไม่งั้น False"),
    visibleTests: [
      { input: [4], expectedOutput: true },
      { input: [7], expectedOutput: false },
    ],
    hiddenTests: [
      { input: [0], expectedOutput: true },
      { input: [-3], expectedOutput: false },
    ],
    randomizable: true,
    generate: () => {
      const mk = (n: number): ForgeTestCase => ({
        input: [n],
        expectedOutput: n % 2 === 0,
      });
      return {
        visibleTests: [mk(randInt(1, 50) * 2), mk(randInt(1, 50) * 2 - 1)],
        hiddenTests: [mk(0), mk(-randInt(1, 25) * 2 + 1)],
      };
    },
  },
  {
    id: "ff-noob-max-two",
    level: "noob",
    title: "ค่ามากกว่าของสองตัว",
    description:
      "เขียน max_two(a, b) คืนค่าที่มากกว่าระหว่าง a กับ b เช่น max_two(3, 9) → 9",
    functionName: "max_two",
    starterCode: skeleton("max_two(a, b)", "คืนค่าที่มากกว่าระหว่าง a กับ b"),
    visibleTests: [
      { input: [3, 9], expectedOutput: 9 },
      { input: [10, 2], expectedOutput: 10 },
    ],
    hiddenTests: [
      { input: [5, 5], expectedOutput: 5 },
      { input: [-4, -1], expectedOutput: -1 },
    ],
    randomizable: true,
    generate: () => {
      const mk = (a: number, b: number): ForgeTestCase => ({
        input: [a, b],
        expectedOutput: Math.max(a, b),
      });
      return {
        visibleTests: [
          mk(randInt(0, 50), randInt(0, 50)),
          mk(randInt(0, 50), randInt(0, 50)),
        ],
        hiddenTests: [
          mk(randInt(-50, 0), randInt(-50, 0)),
          (() => {
            const v = randInt(1, 50);
            return { input: [v, v], expectedOutput: v };
          })(),
        ],
      };
    },
  },
  {
    id: "ff-noob-abs-value",
    level: "noob",
    title: "ค่าสัมบูรณ์",
    description:
      "เขียน abs_value(n) คืนค่าสัมบูรณ์ของ n (ค่าบวกเสมอ) เช่น abs_value(-5) → 5",
    functionName: "abs_value",
    starterCode: skeleton("abs_value(n)", "คืนค่าสัมบูรณ์ของ n"),
    visibleTests: [
      { input: [-5], expectedOutput: 5 },
      { input: [3], expectedOutput: 3 },
    ],
    hiddenTests: [
      { input: [0], expectedOutput: 0 },
      { input: [-100], expectedOutput: 100 },
    ],
    randomizable: false,
  },
  {
    id: "ff-noob-is-positive",
    level: "noob",
    title: "เป็นจำนวนบวกไหม",
    description:
      "เขียน is_positive(n) คืน True ถ้า n มากกว่า 0 ไม่งั้นคืน False เช่น is_positive(5) → True",
    functionName: "is_positive",
    starterCode: skeleton("is_positive(n)", "คืน True ถ้า n มากกว่า 0"),
    visibleTests: [
      { input: [5], expectedOutput: true },
      { input: [-2], expectedOutput: false },
    ],
    hiddenTests: [
      { input: [0], expectedOutput: false },
      { input: [1], expectedOutput: true },
    ],
    randomizable: false,
  },
  {
    id: "ff-noob-add",
    level: "noob",
    title: "บวกเลขสองตัว",
    description: "เขียน add(a, b) คืนผลบวกของ a กับ b เช่น add(2, 3) → 5",
    functionName: "add",
    starterCode: skeleton("add(a, b)", "คืนผลบวกของ a กับ b"),
    visibleTests: [
      { input: [2, 3], expectedOutput: 5 },
      { input: [10, 20], expectedOutput: 30 },
    ],
    hiddenTests: [
      { input: [0, 0], expectedOutput: 0 },
      { input: [-5, 8], expectedOutput: 3 },
    ],
    randomizable: true,
    generate: () => {
      const mk = (a: number, b: number): ForgeTestCase => ({
        input: [a, b],
        expectedOutput: a + b,
      });
      return {
        visibleTests: [
          mk(randInt(1, 50), randInt(1, 50)),
          mk(randInt(1, 50), randInt(1, 50)),
        ],
        hiddenTests: [mk(0, randInt(1, 50)), mk(randInt(-50, -1), randInt(1, 50))],
      };
    },
  },
  {
    id: "ff-noob-sign",
    level: "noob",
    title: "บวก ลบ หรือศูนย์",
    description:
      'เขียน sign(n) คืน "positive" ถ้า n>0, "negative" ถ้า n<0, "zero" ถ้า n=0 เช่น sign(5) → "positive"',
    functionName: "sign",
    starterCode: skeleton(
      "sign(n)",
      'คืน "positive", "negative" หรือ "zero" ตามค่า n',
    ),
    visibleTests: [
      { input: [5], expectedOutput: "positive" },
      { input: [-3], expectedOutput: "negative" },
    ],
    hiddenTests: [
      { input: [0], expectedOutput: "zero" },
      { input: [-100], expectedOutput: "negative" },
    ],
    randomizable: false,
  },
];

// ===================== BEGINNER (7 ด่าน) =====================
const beginner: FunctionForgeLevel[] = [
  {
    id: "ff-beg-reverse-string",
    level: "beginner",
    title: "กลับด้านข้อความ",
    description:
      'เขียน reverse_string(s) คืนข้อความที่กลับด้านจากเดิม เช่น reverse_string("hello") → "olleh"',
    functionName: "reverse_string",
    starterCode: skeleton("reverse_string(s)", "คืนข้อความ s ที่กลับด้าน"),
    visibleTests: [
      { input: ["hello"], expectedOutput: "olleh" },
      { input: ["abc"], expectedOutput: "cba" },
    ],
    hiddenTests: [
      { input: [""], expectedOutput: "" },
      { input: ["a"], expectedOutput: "a" },
    ],
    randomizable: false,
  },
  {
    id: "ff-beg-sum-list",
    level: "beginner",
    title: "ผลรวมในลิสต์",
    description:
      "เขียน sum_list(nums) คืนผลรวมของตัวเลขทุกตัวในลิสต์ เช่น sum_list([1, 2, 3]) → 6",
    functionName: "sum_list",
    starterCode: skeleton("sum_list(nums)", "คืนผลรวมของตัวเลขทุกตัวใน nums"),
    visibleTests: [
      { input: [[1, 2, 3]], expectedOutput: 6 },
      { input: [[10, 20]], expectedOutput: 30 },
    ],
    hiddenTests: [
      { input: [[]], expectedOutput: 0 },
      { input: [[-1, 1]], expectedOutput: 0 },
    ],
    randomizable: true,
    generate: () => {
      const arr = (len: number) =>
        Array.from({ length: len }, () => randInt(1, 20));
      const mk = (a: number[]): ForgeTestCase => ({
        input: [a],
        expectedOutput: a.reduce((s, x) => s + x, 0),
      });
      return {
        visibleTests: [mk(arr(3)), mk(arr(4))],
        hiddenTests: [mk([]), mk(arr(5))],
      };
    },
  },
  {
    id: "ff-beg-count-vowels",
    level: "beginner",
    title: "นับสระ",
    description:
      'เขียน count_vowels(s) นับจำนวนสระ (a, e, i, o, u ไม่สนตัวพิมพ์เล็กใหญ่) ในข้อความ เช่น count_vowels("hello") → 2',
    functionName: "count_vowels",
    starterCode: skeleton(
      "count_vowels(s)",
      "นับจำนวนสระ a e i o u ใน s (ไม่สนตัวพิมพ์เล็กใหญ่)",
    ),
    visibleTests: [
      { input: ["hello"], expectedOutput: 2 },
      { input: ["programming"], expectedOutput: 3 },
    ],
    hiddenTests: [
      { input: ["AEIOU"], expectedOutput: 5 },
      { input: ["xyz"], expectedOutput: 0 },
    ],
    randomizable: false,
  },
  {
    id: "ff-beg-count-occurrences",
    level: "beginner",
    title: "นับจำนวนที่ซ้ำ",
    description:
      "เขียน count_occurrences(items, target) นับว่ามี target อยู่กี่ตัวในลิสต์ เช่น count_occurrences([1, 2, 2, 3], 2) → 2",
    functionName: "count_occurrences",
    starterCode: skeleton(
      "count_occurrences(items, target)",
      "นับจำนวน target ที่อยู่ในลิสต์ items",
    ),
    visibleTests: [
      { input: [[1, 2, 2, 3], 2], expectedOutput: 2 },
      { input: [["a", "b", "a"], "a"], expectedOutput: 2 },
    ],
    hiddenTests: [
      { input: [[], 5], expectedOutput: 0 },
      { input: [[1, 1, 1], 1], expectedOutput: 3 },
    ],
    randomizable: false,
  },
  {
    id: "ff-beg-is-palindrome-word",
    level: "beginner",
    title: "คำอ่านกลับได้",
    description:
      'เขียน is_palindrome_word(s) คืน True ถ้าอ่านจากหน้าและหลังเหมือนกัน เช่น is_palindrome_word("level") → True',
    functionName: "is_palindrome_word",
    starterCode: skeleton(
      "is_palindrome_word(s)",
      "คืน True ถ้า s อ่านหน้าหลังเหมือนกัน",
    ),
    visibleTests: [
      { input: ["level"], expectedOutput: true },
      { input: ["hello"], expectedOutput: false },
    ],
    hiddenTests: [
      { input: ["a"], expectedOutput: true },
      { input: [""], expectedOutput: true },
    ],
    randomizable: false,
  },
  {
    id: "ff-beg-first-last-sum",
    level: "beginner",
    title: "หัวบวกท้าย",
    description:
      "เขียน first_last_sum(nums) คืนผลบวกของสมาชิกตัวแรกกับตัวสุดท้าย เช่น first_last_sum([1, 2, 3, 4]) → 5",
    functionName: "first_last_sum",
    starterCode: skeleton(
      "first_last_sum(nums)",
      "คืนผลบวกของสมาชิกตัวแรกกับตัวสุดท้ายของ nums",
    ),
    visibleTests: [
      { input: [[1, 2, 3, 4]], expectedOutput: 5 },
      { input: [[10, 5]], expectedOutput: 15 },
    ],
    hiddenTests: [
      { input: [[7]], expectedOutput: 14 },
      { input: [[-1, 0, 1]], expectedOutput: 0 },
    ],
    randomizable: false,
  },
  {
    id: "ff-beg-to-upper",
    level: "beginner",
    title: "ตัวพิมพ์ใหญ่ทั้งหมด",
    description:
      'เขียน to_upper(s) คืนข้อความที่เป็นตัวพิมพ์ใหญ่ทั้งหมด เช่น to_upper("hi") → "HI"',
    functionName: "to_upper",
    starterCode: skeleton("to_upper(s)", "คืน s ที่เป็นตัวพิมพ์ใหญ่ทั้งหมด"),
    visibleTests: [
      { input: ["hi"], expectedOutput: "HI" },
      { input: ["abc"], expectedOutput: "ABC" },
    ],
    hiddenTests: [
      { input: [""], expectedOutput: "" },
      { input: ["aBc"], expectedOutput: "ABC" },
    ],
    randomizable: false,
  },
];

// ===================== PRO (9 ด่าน) =====================
const pro: FunctionForgeLevel[] = [
  {
    id: "ff-pro-find-max",
    level: "pro",
    title: "หาค่ามากสุดเอง",
    description:
      "เขียน find_max(nums) หาค่ามากที่สุดในลิสต์ (ห้ามใช้ max()) เช่น find_max([3, 7, 2, 9, 4]) → 9",
    functionName: "find_max",
    starterCode: signatureOnly("find_max(nums)"),
    visibleTests: [
      { input: [[3, 7, 2, 9, 4]], expectedOutput: 9 },
      { input: [[1, 2, 3]], expectedOutput: 3 },
    ],
    hiddenTests: [
      { input: [[42]], expectedOutput: 42 },
      { input: [[-5, -2, -9]], expectedOutput: -2 },
    ],
    randomizable: true,
    generate: () => {
      const arr = (len: number) =>
        Array.from({ length: len }, () => randInt(-30, 30));
      const mk = (a: number[]): ForgeTestCase => ({
        input: [a],
        expectedOutput: Math.max(...a),
      });
      return {
        visibleTests: [mk(arr(5)), mk(arr(4))],
        hiddenTests: [mk([randInt(-30, 30)]), mk(arr(6))],
      };
    },
  },
  {
    id: "ff-pro-find-min",
    level: "pro",
    title: "หาค่าน้อยสุดเอง",
    description:
      "เขียน find_min(nums) หาค่าน้อยที่สุดในลิสต์ (ห้ามใช้ min()) เช่น find_min([3, 7, 2, 9, 4]) → 2",
    functionName: "find_min",
    starterCode: signatureOnly("find_min(nums)"),
    visibleTests: [
      { input: [[3, 7, 2, 9, 4]], expectedOutput: 2 },
      { input: [[10, 20, 5]], expectedOutput: 5 },
    ],
    hiddenTests: [
      { input: [[42]], expectedOutput: 42 },
      { input: [[-5, -2, -9]], expectedOutput: -9 },
    ],
    randomizable: false,
  },
  {
    id: "ff-pro-filter-even",
    level: "pro",
    title: "กรองเฉพาะเลขคู่",
    description:
      "เขียน filter_even(nums) คืนลิสต์ใหม่ที่มีเฉพาะเลขคู่ (เรียงตามเดิม) เช่น filter_even([1, 2, 3, 4]) → [2, 4]",
    functionName: "filter_even",
    starterCode: signatureOnly("filter_even(nums)"),
    visibleTests: [
      { input: [[1, 2, 3, 4]], expectedOutput: [2, 4] },
      { input: [[5, 7]], expectedOutput: [] },
    ],
    hiddenTests: [
      { input: [[]], expectedOutput: [] },
      { input: [[2, 4, 6]], expectedOutput: [2, 4, 6] },
    ],
    randomizable: false,
  },
  {
    id: "ff-pro-count-greater",
    level: "pro",
    title: "นับตัวที่มากกว่าเกณฑ์",
    description:
      "เขียน count_greater(nums, threshold) นับจำนวนตัวเลขที่มากกว่า threshold เช่น count_greater([1, 5, 8, 3], 4) → 2",
    functionName: "count_greater",
    starterCode: signatureOnly("count_greater(nums, threshold)"),
    visibleTests: [
      { input: [[1, 5, 8, 3], 4], expectedOutput: 2 },
      { input: [[10, 20, 30], 15], expectedOutput: 2 },
    ],
    hiddenTests: [
      { input: [[], 0], expectedOutput: 0 },
      { input: [[1, 2, 3], 5], expectedOutput: 0 },
    ],
    randomizable: false,
  },
  {
    id: "ff-pro-sum-even",
    level: "pro",
    title: "รวมเฉพาะเลขคู่",
    description:
      "เขียน sum_even(nums) คืนผลรวมของเฉพาะเลขคู่ในลิสต์ เช่น sum_even([1, 2, 3, 4]) → 6",
    functionName: "sum_even",
    starterCode: signatureOnly("sum_even(nums)"),
    visibleTests: [
      { input: [[1, 2, 3, 4]], expectedOutput: 6 },
      { input: [[2, 4, 6]], expectedOutput: 12 },
    ],
    hiddenTests: [
      { input: [[]], expectedOutput: 0 },
      { input: [[1, 3, 5]], expectedOutput: 0 },
    ],
    randomizable: true,
    generate: () => {
      const arr = (len: number) =>
        Array.from({ length: len }, () => randInt(1, 30));
      const mk = (a: number[]): ForgeTestCase => ({
        input: [a],
        expectedOutput: a.filter((x) => x % 2 === 0).reduce((s, x) => s + x, 0),
      });
      return {
        visibleTests: [mk(arr(5)), mk(arr(4))],
        hiddenTests: [mk([]), mk(arr(6))],
      };
    },
  },
  {
    id: "ff-pro-second-largest",
    level: "pro",
    title: "ค่ามากเป็นอันดับสอง",
    description:
      "เขียน second_largest(nums) คืนค่ามากเป็นอันดับสองแบบ 'ไม่นับค่าซ้ำ' เช่น second_largest([3, 7, 2, 9, 4]) → 7 และ second_largest([5, 1, 5, 2]) → 2 (รับประกันว่ามีค่าต่างกันอย่างน้อย 2 ค่า)",
    functionName: "second_largest",
    starterCode: signatureOnly("second_largest(nums)"),
    visibleTests: [
      { input: [[3, 7, 2, 9, 4]], expectedOutput: 7 },
      { input: [[5, 1, 5, 2]], expectedOutput: 2 },
    ],
    hiddenTests: [
      { input: [[9, 9, 9, 8]], expectedOutput: 8 },
      { input: [[-1, -5, -3]], expectedOutput: -3 },
    ],
    randomizable: false,
  },
  {
    id: "ff-pro-bubble-sort",
    level: "pro",
    title: "เรียงลำดับจากน้อยไปมาก",
    description:
      "เขียน sort_asc(nums) คืนลิสต์ที่เรียงจากน้อยไปมาก (ลองเขียน loop เองไม่ใช้ sorted()) เช่น sort_asc([3, 1, 2]) → [1, 2, 3]",
    functionName: "sort_asc",
    starterCode: signatureOnly("sort_asc(nums)"),
    visibleTests: [
      { input: [[3, 1, 2]], expectedOutput: [1, 2, 3] },
      { input: [[5, 4, 3, 2, 1]], expectedOutput: [1, 2, 3, 4, 5] },
    ],
    hiddenTests: [
      { input: [[]], expectedOutput: [] },
      { input: [[1, 2, 3]], expectedOutput: [1, 2, 3] },
      { input: [[3, 1, 3, 2]], expectedOutput: [1, 2, 3, 3] },
    ],
    randomizable: false,
  },
  {
    id: "ff-pro-reverse-list",
    level: "pro",
    title: "กลับด้านลิสต์",
    description:
      "เขียน reverse_list(nums) คืนลิสต์ที่เรียงกลับด้านจากเดิม เช่น reverse_list([1, 2, 3]) → [3, 2, 1]",
    functionName: "reverse_list",
    starterCode: signatureOnly("reverse_list(nums)"),
    visibleTests: [
      { input: [[1, 2, 3]], expectedOutput: [3, 2, 1] },
      { input: [[10, 20, 30, 40]], expectedOutput: [40, 30, 20, 10] },
    ],
    hiddenTests: [
      { input: [[]], expectedOutput: [] },
      { input: [[5]], expectedOutput: [5] },
    ],
    randomizable: false,
  },
  {
    id: "ff-pro-count-words",
    level: "pro",
    title: "นับจำนวนคำ",
    description:
      'เขียน count_words(sentence) นับจำนวนคำในประโยค (คั่นด้วยช่องว่าง) เช่น count_words("hello world") → 2',
    functionName: "count_words",
    starterCode: signatureOnly("count_words(sentence)"),
    visibleTests: [
      { input: ["hello world"], expectedOutput: 2 },
      { input: ["one two three"], expectedOutput: 3 },
    ],
    hiddenTests: [
      { input: [""], expectedOutput: 0 },
      { input: ["single"], expectedOutput: 1 },
    ],
    randomizable: false,
  },
];

// ===================== EXPERT (9 ด่าน) =====================
// เขียนเองทั้งหมด ไม่มี skeleton (กล่องโค้ดว่าง) — โจทย์บอกชื่อฟังก์ชันและตัวอย่างไว้แล้ว
const expert: FunctionForgeLevel[] = [
  {
    id: "ff-exp-factorial",
    level: "expert",
    title: "แฟกทอเรียล (recursive)",
    description:
      "เขียน factorial(n) หา n! แบบ recursive เช่น factorial(5) → 120 (กำหนด factorial(0) = 1)",
    functionName: "factorial",
    starterCode: "",
    visibleTests: [
      { input: [5], expectedOutput: 120 },
      { input: [0], expectedOutput: 1 },
    ],
    hiddenTests: [
      { input: [1], expectedOutput: 1 },
      { input: [6], expectedOutput: 720 },
    ],
    randomizable: true,
    generate: () => {
      const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
      const mk = (n: number): ForgeTestCase => ({
        input: [n],
        expectedOutput: fact(n),
      });
      return {
        visibleTests: [mk(randInt(3, 7)), mk(0)],
        hiddenTests: [mk(1), mk(randInt(3, 8))],
      };
    },
  },
  {
    id: "ff-exp-fib",
    level: "expert",
    title: "ฟีโบนักชีตัวที่ n",
    description:
      "เขียน fib(n) หา fibonacci ตัวที่ n โดย fib(0)=0, fib(1)=1, fib(n)=fib(n-1)+fib(n-2) เช่น fib(7) → 13",
    functionName: "fib",
    starterCode: "",
    visibleTests: [
      { input: [7], expectedOutput: 13 },
      { input: [10], expectedOutput: 55 },
    ],
    hiddenTests: [
      { input: [0], expectedOutput: 0 },
      { input: [1], expectedOutput: 1 },
    ],
    randomizable: false,
  },
  {
    id: "ff-exp-gcd",
    level: "expert",
    title: "ห.ร.ม. (recursive)",
    description:
      "เขียน gcd(a, b) หาตัวหารร่วมมากของ a กับ b แบบ recursive (Euclidean) เช่น gcd(12, 8) → 4",
    functionName: "gcd",
    starterCode: "",
    visibleTests: [
      { input: [12, 8], expectedOutput: 4 },
      { input: [17, 5], expectedOutput: 1 },
    ],
    hiddenTests: [
      { input: [100, 10], expectedOutput: 10 },
      { input: [7, 7], expectedOutput: 7 },
    ],
    randomizable: false,
  },
  {
    id: "ff-exp-power",
    level: "expert",
    title: "ยกกำลัง (recursive)",
    description:
      "เขียน power(base, exp) หา base ยกกำลัง exp แบบ recursive (exp เป็นจำนวนเต็ม ≥ 0) เช่น power(2, 5) → 32",
    functionName: "power",
    starterCode: "",
    visibleTests: [
      { input: [2, 5], expectedOutput: 32 },
      { input: [3, 3], expectedOutput: 27 },
    ],
    hiddenTests: [
      { input: [5, 0], expectedOutput: 1 },
      { input: [2, 10], expectedOutput: 1024 },
    ],
    randomizable: false,
  },
  {
    id: "ff-exp-sum-digits",
    level: "expert",
    title: "ผลรวมของเลขแต่ละหลัก",
    description:
      "เขียน sum_digits(n) หาผลรวมของเลขแต่ละหลักของจำนวนเต็มบวก n แบบ recursive เช่น sum_digits(123) → 6",
    functionName: "sum_digits",
    starterCode: "",
    visibleTests: [
      { input: [123], expectedOutput: 6 },
      { input: [9], expectedOutput: 9 },
    ],
    hiddenTests: [
      { input: [0], expectedOutput: 0 },
      { input: [1000], expectedOutput: 1 },
    ],
    randomizable: false,
  },
  {
    id: "ff-exp-binary-search",
    level: "expert",
    title: "ค้นหาแบบไบนารี",
    description:
      "เขียน binary_search(sorted_nums, target) คืน index ของ target ในลิสต์ที่เรียงแล้ว ถ้าไม่เจอคืน -1 เช่น binary_search([1, 3, 5, 7, 9], 5) → 2",
    functionName: "binary_search",
    starterCode: "",
    visibleTests: [
      { input: [[1, 3, 5, 7, 9], 5], expectedOutput: 2 },
      { input: [[1, 2, 3], 4], expectedOutput: -1 },
    ],
    hiddenTests: [
      { input: [[], 1], expectedOutput: -1 },
      { input: [[1, 2, 3, 4, 5], 1], expectedOutput: 0 },
      { input: [[1, 2, 3, 4, 5], 5], expectedOutput: 4 },
    ],
    randomizable: false,
  },
  {
    id: "ff-exp-count-down",
    level: "expert",
    title: "นับถอยหลังเป็นลิสต์",
    description:
      "เขียน count_down(n) คืนลิสต์ [n, n-1, ..., 1] แบบ recursive ถ้า n ≤ 0 คืนลิสต์ว่าง เช่น count_down(3) → [3, 2, 1]",
    functionName: "count_down",
    starterCode: "",
    visibleTests: [
      { input: [3], expectedOutput: [3, 2, 1] },
      { input: [1], expectedOutput: [1] },
    ],
    hiddenTests: [
      { input: [0], expectedOutput: [] },
      { input: [5], expectedOutput: [5, 4, 3, 2, 1] },
    ],
    randomizable: false,
  },
  {
    id: "ff-exp-reverse-recursive",
    level: "expert",
    title: "กลับข้อความแบบ recursive",
    description:
      'เขียน reverse_recursive(s) กลับด้านข้อความแบบ recursive เช่น reverse_recursive("hello") → "olleh"',
    functionName: "reverse_recursive",
    starterCode: "",
    visibleTests: [
      { input: ["hello"], expectedOutput: "olleh" },
      { input: ["abcd"], expectedOutput: "dcba" },
    ],
    hiddenTests: [
      { input: [""], expectedOutput: "" },
      { input: ["a"], expectedOutput: "a" },
    ],
    randomizable: false,
  },
  {
    id: "ff-exp-sum-to-n",
    level: "expert",
    title: "ผลรวม 1 ถึง n (recursive)",
    description:
      "เขียน sum_to_n(n) หาผลรวมของ 1 ถึง n แบบ recursive เช่น sum_to_n(5) → 15",
    functionName: "sum_to_n",
    starterCode: "",
    visibleTests: [
      { input: [5], expectedOutput: 15 },
      { input: [10], expectedOutput: 55 },
    ],
    hiddenTests: [
      { input: [1], expectedOutput: 1 },
      { input: [0], expectedOutput: 0 },
    ],
    randomizable: true,
    generate: () => {
      const mk = (n: number): ForgeTestCase => ({
        input: [n],
        expectedOutput: (n * (n + 1)) / 2,
      });
      return {
        visibleTests: [mk(randInt(3, 12)), mk(randInt(3, 12))],
        hiddenTests: [mk(1), mk(0)],
      };
    },
  },
];

// ===================== GOD (7 ด่าน) =====================
// algorithm ซับซ้อน + เน้น edge case (hidden test 3-4 ข้อ) กล่องโค้ดว่าง
const god: FunctionForgeLevel[] = [
  {
    id: "ff-god-merge-sort",
    level: "god",
    title: "merge sort",
    description:
      "เขียน merge_sort(nums) เรียงลิสต์จากน้อยไปมากด้วยแนวคิด merge sort เช่น merge_sort([5, 2, 8, 1]) → [1, 2, 5, 8]",
    functionName: "merge_sort",
    starterCode: "",
    visibleTests: [
      { input: [[5, 2, 8, 1]], expectedOutput: [1, 2, 5, 8] },
      { input: [[3, 1, 2]], expectedOutput: [1, 2, 3] },
    ],
    hiddenTests: [
      { input: [[]], expectedOutput: [] },
      { input: [[1]], expectedOutput: [1] },
      { input: [[3, 3, 1, 2, 2]], expectedOutput: [1, 2, 2, 3, 3] },
      { input: [[-1, -5, 3, 0]], expectedOutput: [-5, -1, 0, 3] },
    ],
    randomizable: false,
  },
  {
    id: "ff-god-is-palindrome",
    level: "god",
    title: "ปาลินโดรมข้ามช่องว่าง",
    description:
      'เขียน is_palindrome(s) คืน True ถ้าข้อความอ่านหน้าหลังเหมือนกัน โดย "ไม่สนช่องว่างและตัวพิมพ์เล็กใหญ่" เช่น is_palindrome("race car") → True',
    functionName: "is_palindrome",
    starterCode: "",
    visibleTests: [
      { input: ["race car"], expectedOutput: true },
      { input: ["hello"], expectedOutput: false },
    ],
    hiddenTests: [
      { input: [""], expectedOutput: true },
      { input: ["Aba"], expectedOutput: true },
      { input: ["Was it a car or a cat I saw"], expectedOutput: true },
      { input: ["ab"], expectedOutput: false },
    ],
    randomizable: false,
  },
  {
    id: "ff-god-coin-change",
    level: "god",
    title: "ทอนเหรียญน้อยที่สุด",
    description:
      "เขียน coin_change(coins, amount) หาจำนวนเหรียญน้อยที่สุดที่รวมได้เท่ากับ amount ถ้าทอนไม่ได้คืน -1 เช่น coin_change([1, 2, 5], 11) → 3",
    functionName: "coin_change",
    starterCode: "",
    visibleTests: [
      { input: [[1, 2, 5], 11], expectedOutput: 3 },
      { input: [[2], 3], expectedOutput: -1 },
    ],
    hiddenTests: [
      { input: [[1, 2, 5], 0], expectedOutput: 0 },
      { input: [[5, 10], 3], expectedOutput: -1 },
      { input: [[1, 5, 10, 25], 30], expectedOutput: 2 },
      { input: [[1], 4], expectedOutput: 4 },
    ],
    randomizable: false,
  },
  {
    id: "ff-god-two-sum",
    level: "god",
    title: "คู่ที่บวกได้เป้าหมาย",
    description:
      "เขียน two_sum(nums, target) คืน index ของเลขสองตัว (i < j) ที่บวกกันได้ target โดยไล่ i จากน้อยไปมากแล้ว j ถัดจาก i ถ้าไม่มีคืนลิสต์ว่าง เช่น two_sum([2, 7, 11, 15], 9) → [0, 1]",
    functionName: "two_sum",
    starterCode: "",
    visibleTests: [
      { input: [[2, 7, 11, 15], 9], expectedOutput: [0, 1] },
      { input: [[3, 2, 4], 6], expectedOutput: [1, 2] },
    ],
    hiddenTests: [
      { input: [[3, 3], 6], expectedOutput: [0, 1] },
      { input: [[1, 2, 3], 7], expectedOutput: [] },
      { input: [[0, 4, 3, 0], 0], expectedOutput: [0, 3] },
    ],
    randomizable: false,
  },
  {
    id: "ff-god-lcp",
    level: "god",
    title: "คำนำหน้าร่วมที่ยาวสุด",
    description:
      'เขียน longest_common_prefix(strs) คืนคำนำหน้า (prefix) ร่วมที่ยาวที่สุดของทุกข้อความในลิสต์ ถ้าไม่มีคืน "" เช่น longest_common_prefix(["flower", "flow", "flight"]) → "fl"',
    functionName: "longest_common_prefix",
    starterCode: "",
    visibleTests: [
      {
        input: [["flower", "flow", "flight"]],
        expectedOutput: "fl",
      },
      { input: [["dog", "cat"]], expectedOutput: "" },
    ],
    hiddenTests: [
      { input: [["abc"]], expectedOutput: "abc" },
      { input: [["same", "same"]], expectedOutput: "same" },
      { input: [["ab", "abc", "abcd"]], expectedOutput: "ab" },
      { input: [[""]], expectedOutput: "" },
    ],
    randomizable: false,
  },
  {
    id: "ff-god-count-unique",
    level: "god",
    title: "นับค่าที่ไม่ซ้ำ",
    description:
      "เขียน count_unique(nums) คืนจำนวนค่าที่แตกต่างกันในลิสต์ เช่น count_unique([1, 2, 2, 3]) → 3",
    functionName: "count_unique",
    starterCode: "",
    visibleTests: [
      { input: [[1, 2, 2, 3]], expectedOutput: 3 },
      { input: [[1, 1, 1]], expectedOutput: 1 },
    ],
    hiddenTests: [
      { input: [[]], expectedOutput: 0 },
      { input: [[-1, -1, 2, 3, 3]], expectedOutput: 3 },
      { input: [[5]], expectedOutput: 1 },
    ],
    randomizable: false,
  },
  {
    id: "ff-god-flatten",
    level: "god",
    title: "ยุบลิสต์ซ้อนหนึ่งชั้น",
    description:
      "เขียน flatten(nested) ยุบลิสต์ของลิสต์ (ซ้อนหนึ่งชั้น) ให้เป็นลิสต์เดียวเรียงตามเดิม เช่น flatten([[1, 2], [3, 4]]) → [1, 2, 3, 4]",
    functionName: "flatten",
    starterCode: "",
    visibleTests: [
      {
        input: [
          [
            [1, 2],
            [3, 4],
          ],
        ],
        expectedOutput: [1, 2, 3, 4],
      },
      { input: [[[1], [2], [3]]], expectedOutput: [1, 2, 3] },
    ],
    hiddenTests: [
      { input: [[[]]], expectedOutput: [] },
      { input: [[[1, 2], []]], expectedOutput: [1, 2] },
      { input: [[[5]]], expectedOutput: [5] },
    ],
    randomizable: false,
  },
];

export const FUNCTION_FORGE_LEVELS: FunctionForgeLevel[] = [
  ...noob,
  ...beginner,
  ...pro,
  ...expert,
  ...god,
];

export function getForgeLevelsByDifficulty(
  level: Difficulty,
): FunctionForgeLevel[] {
  return FUNCTION_FORGE_LEVELS.filter((l) => l.level === level);
}

export function getForgeLevelById(
  id: string,
): FunctionForgeLevel | undefined {
  return FUNCTION_FORGE_LEVELS.find((l) => l.id === id);
}

// ด่านที่เตรียมพร้อมเล่นแล้ว (สุ่ม test ถ้า randomizable)
export interface PreparedForgeLevel {
  id: string;
  level: Difficulty;
  title: string;
  description: string;
  functionName: string;
  starterCode: string;
  visibleTests: ForgeTestCase[];
  hiddenTests: ForgeTestCase[];
}

// เตรียมด่าน: ถ้า randomizable จะสุ่ม input ใหม่พร้อมคำนวณ expectedOutput จาก input จริง
export function prepareForgeLevel(
  level: FunctionForgeLevel,
): PreparedForgeLevel {
  let visibleTests = level.visibleTests;
  let hiddenTests = level.hiddenTests;

  if (level.randomizable && level.generate) {
    const generated = level.generate();
    visibleTests = generated.visibleTests;
    hiddenTests = generated.hiddenTests;
  }

  return {
    id: level.id,
    level: level.level,
    title: level.title,
    description: level.description,
    functionName: level.functionName,
    starterCode: level.starterCode,
    visibleTests,
    hiddenTests,
  };
}
