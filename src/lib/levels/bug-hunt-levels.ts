import type { Difficulty } from "@/lib/types";

export interface BugHuntLevel {
  id: string;
  level: Difficulty;
  title: string;
  description: string;
  // โค้ด Python ที่มี bug (ใช้ \n คั่นบรรทัด) อาจมี placeholder {{N}} ถ้า randomizable
  buggyCode: string;
  // ผลลัพธ์ stdout ที่ถูกต้อง (ไว้เทียบหลังผู้เล่นแก้ bug แล้วกด Run)
  expectedOutput: string;
  // เลขบรรทัดที่มี bug (1-indexed) สำหรับ highlight ในระดับ noob/beginner, -1 ถ้าไม่ระบุ
  bugLineNumber: number;
  // คำใบ้แบบไม่เฉลยตรง ๆ (ใช้กับ noob/beginner)
  hint: string;
  // true = มี placeholder {{N}} ที่สุ่มค่าได้ ต้องคำนวณ expectedOutput แบบ dynamic
  randomizable: boolean;
  // ช่วงค่าของ {{N}} (inclusive) เมื่อ randomizable
  nRange?: [number, number];
  // ฟังก์ชันคำนวณ expectedOutput จากค่า n (template แทนการ hardcode)
  computeExpected?: (n: number) => string;
}

// ===================== NOOB (6 ด่าน) =====================
// bug ระดับเห็นง่าย: พิมพ์ผิด, syntax error พื้นฐาน
const noob: BugHuntLevel[] = [
  {
    id: "noob-print-typo",
    level: "noob",
    title: "ทักทายชาวโลก",
    description: "โปรแกรมควรพิมพ์ข้อความ Hello, World! แต่มันรันไม่ได้",
    buggyCode: 'message = "Hello, World!"\npirnt(message)',
    expectedOutput: "Hello, World!",
    bugLineNumber: 2,
    hint: "ลองสะกดชื่อฟังก์ชันที่ใช้พิมพ์ข้อความให้ดี ๆ อีกที",
    randomizable: false,
  },
  {
    id: "noob-if-colon",
    level: "noob",
    title: "ผ่านหรือไม่ผ่าน",
    description: "เช็คคะแนน 85 ควรพิมพ์คำว่า pass",
    buggyCode: 'score = 85\nif score >= 50\n    print("pass")',
    expectedOutput: "pass",
    bugLineNumber: 2,
    hint: "บรรทัด if ในภาษา Python ต้องลงท้ายด้วยอะไรบางอย่างเสมอนะ",
    randomizable: false,
  },
  {
    id: "noob-for-colon",
    level: "noob",
    title: "นับเลขสามตัว",
    description: "ควรพิมพ์เลข 0 1 2 ทีละบรรทัด",
    buggyCode: "for i in range(3)\n    print(i)",
    expectedOutput: "0\n1\n2",
    bugLineNumber: 1,
    hint: "บรรทัด for ก็ต้องการเครื่องหมายปิดท้ายเหมือน if เลย",
    randomizable: false,
  },
  {
    id: "noob-indent",
    level: "noob",
    title: "ฟังก์ชันทักทาย",
    description: "เรียก greet() แล้วควรพิมพ์ hi",
    buggyCode: 'def greet():\nprint("hi")\n\ngreet()',
    expectedOutput: "hi",
    bugLineNumber: 2,
    hint: "โค้ดที่อยู่ในฟังก์ชันต้องย่อหน้า (เว้นวรรคหน้าบรรทัด) เข้าไป",
    randomizable: false,
  },
  {
    id: "noob-def-colon",
    level: "noob",
    title: "ยกกำลังสอง",
    description: "square(4) ควรได้ 16",
    buggyCode: "def square(n)\n    return n * n\n\nprint(square(4))",
    expectedOutput: "16",
    bugLineNumber: 1,
    hint: "บรรทัดประกาศฟังก์ชัน def ลืมอะไรไปหรือเปล่านะ",
    randomizable: false,
  },
  {
    id: "noob-len-typo",
    level: "noob",
    title: "นับจำนวนสมาชิก",
    description: "นับว่ามีกี่ตัวใน list ควรได้ 3",
    buggyCode: "items = [10, 20, 30]\nprint(lne(items))",
    expectedOutput: "3",
    bugLineNumber: 2,
    hint: "ฟังก์ชันที่ใช้นับจำนวนสมาชิกสะกดว่าอะไรนะ ลองสลับตัวอักษรดู",
    randomizable: false,
  },
];

// ===================== BEGINNER (7 ด่าน) =====================
// bug: ลำดับ/ค่าผิด, ไม่แปลงชนิดข้อมูล, สับสน = กับ ==
const beginner: BugHuntLevel[] = [
  {
    id: "beg-assign-vs-eq",
    level: "beginner",
    title: "เท่ากับสิบไหม",
    description: "ถ้า x เท่ากับ 10 ให้พิมพ์ ten",
    buggyCode: 'x = 10\nif x = 10:\n    print("ten")',
    expectedOutput: "ten",
    bugLineNumber: 2,
    hint: "การ 'เปรียบเทียบว่าเท่ากัน' ใช้เครื่องหมายต่างจากการ 'กำหนดค่า' นะ",
    randomizable: false,
  },
  {
    id: "beg-str-int-add",
    level: "beginner",
    title: "อายุปีหน้า",
    description: 'อายุเก็บเป็นข้อความ "20" บวกอีก 1 ปี ควรได้ 21',
    buggyCode: 'age = "20"\nnext_age = age + 1\nprint(next_age)',
    expectedOutput: "21",
    bugLineNumber: 2,
    hint: "ตัวเลขที่เก็บเป็นข้อความ ต้องแปลงเป็นจำนวนเต็มก่อนถึงจะบวกได้",
    randomizable: false,
  },
  {
    id: "beg-precedence",
    level: "beginner",
    title: "ลำดับการคำนวณ",
    description: "ต้องการคำนวณ (2 + 3) แล้วคูณ 4 ควรได้ 20",
    buggyCode: "# ต้องการ (2 + 3) * 4\nresult = 2 + 3 * 4\nprint(result)",
    expectedOutput: "20",
    bugLineNumber: 2,
    hint: "การคูณทำก่อนการบวกเสมอ ถ้าอยากให้บวกก่อนต้องใส่อะไรครอบไว้",
    randomizable: false,
  },
  {
    id: "beg-concat-int",
    level: "beginner",
    title: "แสดงจำนวนนับ",
    description: "ควรพิมพ์ count: 5",
    buggyCode: 'count = 5\nprint("count: " + count)',
    expectedOutput: "count: 5",
    bugLineNumber: 2,
    hint: "จะต่อข้อความกับตัวเลขตรง ๆ ไม่ได้ ต้องแปลงตัวเลขเป็นข้อความก่อน",
    randomizable: false,
  },
  {
    id: "beg-float-div",
    level: "beginner",
    title: "หาค่าเฉลี่ย",
    description: "เฉลี่ยของ 10 หารด้วย 4 ควรได้ 2.5",
    buggyCode: "total = 10\nn = 4\naverage = total // n\nprint(average)",
    expectedOutput: "2.5",
    bugLineNumber: 3,
    hint: "เครื่องหมายหารมีสองแบบ แบบหนึ่งตัดทศนิยมทิ้ง อีกแบบเก็บทศนิยมไว้",
    randomizable: false,
  },
  {
    id: "beg-swap",
    level: "beginner",
    title: "สลับค่าตัวแปร",
    description: "สลับค่า a=5 กับ b=10 ควรได้ผลลัพธ์ 10 5",
    buggyCode: "a = 5\nb = 10\n# ต้องการสลับค่า a กับ b\na = b\nb = a\nprint(a, b)",
    expectedOutput: "10 5",
    bugLineNumber: 4,
    hint: "พอ a = b ค่าเดิมของ a ก็หายไปแล้ว ลองหาตัวแปรพักค่าไว้ก่อน",
    randomizable: false,
  },
  {
    id: "beg-str-mul",
    level: "beginner",
    title: "ราคารวม",
    description: 'ราคา "100" บาท จำนวน 3 ชิ้น ควรได้ 300',
    buggyCode: 'price = "100"\nquantity = 3\nprint(price * quantity)',
    expectedOutput: "300",
    bugLineNumber: 1,
    hint: "ข้อความคูณตัวเลขจะกลายเป็นการพิมพ์ซ้ำ ต้องแปลงราคาเป็นตัวเลขก่อน",
    randomizable: false,
  },
];

// ===================== PRO (9 ด่าน) =====================
// bug: logic ใน เงื่อนไข/loop, off-by-one ใน range, and/or ผิด
const pro: BugHuntLevel[] = [
  {
    id: "pro-sum-to-n",
    level: "pro",
    title: "ผลรวม 1 ถึง N",
    description: "หาผลรวมของเลข 1 ถึง N (รวม N ด้วย)",
    buggyCode:
      "def sum_to_n(n):\n    total = 0\n    for i in range(1, n):\n        total += i\n    return total\n\nprint(sum_to_n({{N}}))",
    expectedOutput: "",
    bugLineNumber: 3,
    hint: "",
    randomizable: true,
    nRange: [3, 10],
    computeExpected: (n) => String((n * (n + 1)) / 2),
  },
  {
    id: "pro-and-or",
    level: "pro",
    title: "ช่วงอายุที่รับได้",
    description: "ผ่านได้ต่อเมื่ออายุอยู่ระหว่าง 18 ถึง 60 (ทดสอบกับอายุ 70)",
    buggyCode:
      'age = 70\n# ต้องผ่านเฉพาะอายุ 18 ถึง 60\nif age >= 18 or age <= 60:\n    print("eligible")\nelse:\n    print("not eligible")',
    expectedOutput: "not eligible",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
  {
    id: "pro-range-inclusive",
    level: "pro",
    title: "พิมพ์ 1 ถึง 5",
    description: "ควรพิมพ์เลข 1 2 3 4 5 ทีละบรรทัด",
    buggyCode: "# ต้องการพิมพ์เลข 1 ถึง 5\nfor i in range(1, 5):\n    print(i)",
    expectedOutput: "1\n2\n3\n4\n5",
    bugLineNumber: 2,
    hint: "",
    randomizable: false,
  },
  {
    id: "pro-find-max",
    level: "pro",
    title: "หาค่ามากที่สุด",
    description: "หาค่ามากสุดใน [3, 7, 2, 9, 4] ควรได้ 9",
    buggyCode:
      "def find_max(nums):\n    biggest = nums[0]\n    for n in nums:\n        if n < biggest:\n            biggest = n\n    return biggest\n\nprint(find_max([3, 7, 2, 9, 4]))",
    expectedOutput: "9",
    bugLineNumber: 4,
    hint: "",
    randomizable: false,
  },
  {
    id: "pro-while-bound",
    level: "pro",
    title: "นับถอยหลัง",
    description: "นับถอยหลังจาก 3 ถึง 1 ควรพิมพ์ 3 2 1",
    buggyCode: "# นับถอยหลัง 3 ถึง 1\nn = 3\nwhile n >= 0:\n    print(n)\n    n -= 1",
    expectedOutput: "3\n2\n1",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
  {
    id: "pro-count-odd",
    level: "pro",
    title: "นับเลขคี่",
    description: "นับจำนวนเลขคี่ใน [1, 2, 3, 4, 5, 6] ควรได้ 3",
    buggyCode:
      "numbers = [1, 2, 3, 4, 5, 6]\ncount = 0\nfor n in numbers:\n    if n % 2 == 0:\n        count += 1\nprint(count)",
    expectedOutput: "3",
    bugLineNumber: 4,
    hint: "",
    randomizable: false,
  },
  {
    id: "pro-sum-list",
    level: "pro",
    title: "รวมสมาชิกทั้งหมด",
    description: "รวมทุกตัวใน [10, 20, 30, 40] ควรได้ 100",
    buggyCode:
      "nums = [10, 20, 30, 40]\ntotal = 0\nfor i in range(len(nums) - 1):\n    total += nums[i]\nprint(total)",
    expectedOutput: "100",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
  {
    id: "pro-mul-table",
    level: "pro",
    title: "สูตรคูณสามแถว",
    description: "พิมพ์สูตรคูณแม่ N สามแถวแรก (N×1, N×2, N×3)",
    buggyCode:
      "n = {{N}}\nfor i in range(1, 4):\n    print(n * n)",
    expectedOutput: "",
    bugLineNumber: 3,
    hint: "",
    randomizable: true,
    nRange: [2, 9],
    computeExpected: (n) => [n * 1, n * 2, n * 3].join("\n"),
  },
  {
    id: "pro-div-both",
    level: "pro",
    title: "หารลงตัวทั้งคู่",
    description: "พิมพ์เลข 1-10 ที่หารด้วย 2 และ 3 ลงตัวพร้อมกัน ควรได้ 6",
    buggyCode:
      "# พิมพ์เลข 1-10 ที่หารด้วย 2 และ 3 ลงตัว\nfor i in range(1, 11):\n    if i % 2 == 0 or i % 3 == 0:\n        print(i)",
    expectedOutput: "6",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
];

// ===================== EXPERT (9 ด่าน) =====================
// bug: nested loop, scope confusion, mutable default argument
const expert: BugHuntLevel[] = [
  {
    id: "exp-mutable-default-list",
    level: "expert",
    title: "เพิ่มของลงตะกร้า",
    description:
      "ทุกครั้งที่เรียก add_item ควรได้ตะกร้าใหม่ที่มีของชิ้นนั้นชิ้นเดียว",
    buggyCode:
      'def add_item(item, items=[]):\n    items.append(item)\n    return items\n\nprint(add_item("a"))\nprint(add_item("b"))',
    expectedOutput: "['a']\n['b']",
    bugLineNumber: 1,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-global-scope",
    level: "expert",
    title: "ตัวนับส่วนกลาง",
    description: "เพิ่มค่า count สองครั้ง สุดท้าย count ควรเป็น 2",
    buggyCode:
      "count = 0\n\ndef increment():\n    count = count + 1\n    return count\n\nincrement()\nincrement()\nprint(count)",
    expectedOutput: "2",
    bugLineNumber: 4,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-nested-var",
    level: "expert",
    title: "รวมทุกค่าใน matrix",
    description: "หาผลรวมของทุกตัวเลขใน [[1, 2], [3, 4]] ควรได้ 10",
    buggyCode:
      "matrix = [[1, 2], [3, 4]]\ntotal = 0\nfor row in matrix:\n    for x in row:\n        total += row\nprint(total)",
    expectedOutput: "10",
    bugLineNumber: 5,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-late-binding",
    level: "expert",
    title: "เก็บฟังก์ชันใน loop",
    description: "สร้างฟังก์ชันที่คืนค่า 1, 2, 3 ตามลำดับ ควรได้ [1, 2, 3]",
    buggyCode:
      "funcs = []\nfor i in range(1, 4):\n    funcs.append(lambda: i)\nresults = [f() for f in funcs]\nprint(results)",
    expectedOutput: "[1, 2, 3]",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-col-sum",
    level: "expert",
    title: "ผลรวมแต่ละคอลัมน์",
    description: "หาผลรวมแต่ละคอลัมน์ของ [[1, 2, 3], [4, 5, 6]] ควรได้ [5, 7, 9]",
    buggyCode:
      "matrix = [[1, 2, 3], [4, 5, 6]]\nsums = [0, 0, 0]\nfor row in matrix:\n    for j in range(len(matrix)):\n        sums[j] += row[j]\nprint(sums)",
    expectedOutput: "[5, 7, 9]",
    bugLineNumber: 4,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-nonlocal",
    level: "expert",
    title: "ตัวนับแบบปิด",
    description: "เรียกตัวนับสองครั้งควรได้ 1 แล้ว 2",
    buggyCode:
      "def make_counter():\n    count = 0\n    def inc():\n        count += 1\n        return count\n    return inc\n\nc = make_counter()\nprint(c())\nprint(c())",
    expectedOutput: "1\n2",
    bugLineNumber: 4,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-pyramid",
    level: "expert",
    title: "สามเหลี่ยมดาว",
    description: "พิมพ์สามเหลี่ยมดาว 3 แถว (1, 2, 3 ดวง)",
    buggyCode:
      'for i in range(3):\n    line = ""\n    for j in range(i):\n        line += "*"\n    print(line)',
    expectedOutput: "*\n**\n***",
    bugLineNumber: 1,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-row-sum",
    level: "expert",
    title: "ผลรวมแต่ละแถว",
    description: "หาผลรวมแต่ละแถวของ [[1, 2], [3, 4], [5, 6]] ควรได้ 3, 7, 11",
    buggyCode:
      "matrix = [[1, 2], [3, 4], [5, 6]]\nfor row in matrix:\n    total = 0\n    for x in row:\n        total = x\n    print(total)",
    expectedOutput: "3\n7\n11",
    bugLineNumber: 5,
    hint: "",
    randomizable: false,
  },
  {
    id: "exp-mutable-default-dict",
    level: "expert",
    title: "บันทึกคะแนน",
    description: "ทุกครั้งที่เรียก add_score ควรได้ dict ใหม่ที่มีคนเดียว",
    buggyCode:
      'def add_score(name, scores={}):\n    scores[name] = 1\n    return scores\n\nprint(add_score("a"))\nprint(add_score("b"))',
    expectedOutput: "{'a': 1}\n{'b': 1}",
    bugLineNumber: 1,
    hint: "",
    randomizable: false,
  },
];

// ===================== GOD (7 ด่าน) =====================
// bug: floating point comparison, off-by-one บน edge case, side-effect, identity
const god: BugHuntLevel[] = [
  {
    id: "god-float-eq",
    level: "god",
    title: "ศูนย์จุดสาม",
    description: "ตรวจว่า 0.1 + 0.2 เท่ากับ 0.3 (ในเชิงคณิตศาสตร์) ควรพิมพ์ equal",
    buggyCode:
      'result = 0.1 + 0.2\nif result == 0.3:\n    print("equal")\nelse:\n    print("not equal")',
    expectedOutput: "equal",
    bugLineNumber: 2,
    hint: "",
    randomizable: false,
  },
  {
    id: "god-prime-edge",
    level: "god",
    title: "สองเป็นจำนวนเฉพาะ",
    description: "ตรวจว่า 2 เป็นจำนวนเฉพาะหรือไม่ ควรได้ True",
    buggyCode:
      "def is_prime(n):\n    if n <= 2:\n        return False\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True\n\nprint(is_prime(2))",
    expectedOutput: "True",
    bugLineNumber: 2,
    hint: "",
    randomizable: false,
  },
  {
    id: "god-slice-edge",
    level: "god",
    title: "สามตัวสุดท้าย",
    description: "เอาสมาชิก 3 ตัวสุดท้ายของ [1, 2, 3, 4, 5] ควรได้ [3, 4, 5]",
    buggyCode: "nums = [1, 2, 3, 4, 5]\nlast_three = nums[-3:-1]\nprint(last_three)",
    expectedOutput: "[3, 4, 5]",
    bugLineNumber: 2,
    hint: "",
    randomizable: false,
  },
  {
    id: "god-side-effect",
    level: "god",
    title: "เรียงโดยไม่แก้ของเดิม",
    description:
      "sorted_copy ควรคืน list ที่เรียงแล้ว โดยไม่แก้ list เดิม สุดท้าย original ต้องเป็น [3, 1, 2]",
    buggyCode:
      "def sorted_copy(data):\n    data.sort()\n    return data\n\noriginal = [3, 1, 2]\nresult = sorted_copy(original)\nprint(original)",
    expectedOutput: "[3, 1, 2]",
    bugLineNumber: 2,
    hint: "",
    randomizable: false,
  },
  {
    id: "god-round-arg",
    level: "god",
    title: "ปัดทศนิยมราคา",
    description: "ปัด 0.1 + 0.2 เป็นทศนิยม 2 ตำแหน่ง ควรได้ 0.3",
    buggyCode:
      "# ปัดราคาเป็นทศนิยม 2 ตำแหน่ง\nprice = 0.1 + 0.2\nprint(round(price))",
    expectedOutput: "0.3",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
  {
    id: "god-fib-offbyone",
    level: "god",
    title: "ฟีโบนักชีตัวที่เจ็ด",
    description: "หา fibonacci ตัวที่ 7 (ลำดับ 1, 1, 2, 3, 5, 8, 13) ควรได้ 13",
    buggyCode:
      "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return b\n\nprint(fib(7))",
    expectedOutput: "13",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
  {
    id: "god-is-vs-eq",
    level: "god",
    title: "เท่ากับพันไหม",
    description: "ตรวจว่าค่า a กับ b ซึ่งเท่ากับ 1000 ทั้งคู่ มีค่าเท่ากันหรือไม่ ควรพิมพ์ match",
    buggyCode:
      'a = 1000\nb = int("1000")\nif a is b:\n    print("match")\nelse:\n    print("no match")',
    expectedOutput: "match",
    bugLineNumber: 3,
    hint: "",
    randomizable: false,
  },
];

export const BUG_HUNT_LEVELS: BugHuntLevel[] = [
  ...noob,
  ...beginner,
  ...pro,
  ...expert,
  ...god,
];

export function getLevelsByDifficulty(level: Difficulty): BugHuntLevel[] {
  return BUG_HUNT_LEVELS.filter((l) => l.level === level);
}

export function getLevelById(id: string): BugHuntLevel | undefined {
  return BUG_HUNT_LEVELS.find((l) => l.id === id);
}

// ผลของการเตรียมด่าน 1 ครั้ง: โค้ดที่พร้อมเล่น + ผลลัพธ์ที่คาดหวัง
export interface PreparedLevel {
  id: string;
  level: Difficulty;
  title: string;
  description: string;
  code: string;
  expectedOutput: string;
  bugLineNumber: number;
  hint: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// เตรียมด่านให้พร้อมเล่น: ถ้า randomizable จะสุ่มค่า {{N}} แล้วแทนในโค้ด
// พร้อมคำนวณ expectedOutput จาก template (ไม่ใช่ hardcode) เพื่อให้แต่ละครั้งต่างกัน
export function prepareLevel(level: BugHuntLevel): PreparedLevel {
  let code = level.buggyCode;
  let expectedOutput = level.expectedOutput;

  if (level.randomizable && level.nRange && level.computeExpected) {
    const [min, max] = level.nRange;
    const n = randInt(min, max);
    code = code.replace(/\{\{N\}\}/g, String(n));
    expectedOutput = level.computeExpected(n);
  }

  return {
    id: level.id,
    level: level.level,
    title: level.title,
    description: level.description,
    code,
    expectedOutput,
    bugLineNumber: level.bugLineNumber,
    hint: level.hint,
  };
}
