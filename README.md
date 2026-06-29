# 🎮 Code Arcade

เกมฝึกทักษะการเขียนโค้ดแบบเล่นได้ทันที **ไม่ต้องสมัครสมาชิก / ไม่มี login**
ตอนนี้มี 3 เกมให้เล่น:

- **🐛 Bug Hunt** — หาและแก้ bug ในโค้ด Python
- **🔨 Function Forge** — เขียนฟังก์ชัน Python ให้ผ่าน test case ทุกข้อ (มีทั้ง visible และ hidden test)
- **⚔️ Code Arena** — เขียนโค้ด Python คุมหุ่นยนต์เดินฝ่า maze ไปหาเป้าหมาย เล่นเดี่ยวหรือแข่งแบบ multiplayer

> Python รันในเบราว์เซอร์ทั้งหมดด้วย Pyodide (ไม่มี backend สำหรับรันโค้ด)
> Backend มีไว้แค่เก็บคะแนน/Leaderboard เท่านั้น

## ✨ ฟีเจอร์

- **5 ระดับความยาก**: noob, beginner, pro, expert, god — เลือกเล่นได้อิสระ
- รันโค้ด Python จริงในเบราว์เซอร์ด้วย **Pyodide**
- **Monaco Editor** เป็น editor พร้อม syntax highlight
- **Visual-assist** (เฉพาะ noob/beginner): ไฮไลต์บรรทัดที่มี bug + เส้นหยักใต้คำ + ปุ่มคำใบ้
- มาสคอต **หิ่งห้อย** วาดด้วย SVG ล้วน เคลื่อนไหวด้วย `requestAnimationFrame` (3 อารมณ์)
- **Sound effect** สังเคราะห์สดด้วย Tone.js (เปิด/ปิดเสียงได้)
- จับเวลา + คำนวณคะแนน + **Leaderboard** เก็บ top 10 ต่อระดับ (PostgreSQL + Drizzle)
- กรอกชื่อสไตล์ตู้เกมอาเขตเมื่อทำคะแนนติด top 10 (มีตัวกรองคำหยาบ)

## 🔨 Function Forge (เกมที่ 2)

โจทย์สไตล์ LeetCode ย่อ ๆ: ระบบให้ test case มาแล้วผู้เล่นเขียน/เติมฟังก์ชัน Python
ให้ผ่านครบทุกข้อ มีทั้ง **visible test** (เห็น input/expected/ผลที่ได้) และ
**hidden test** (ไม่เปิดเฉลย ใช้กันการ hardcode คำตอบ)

- **5 ระดับความยาก** เหมือน Bug Hunt: noob → god (เขียนฟังก์ชันเดียวจบ ไม่ลามไป algorithm หนัก)
  - noob/beginner ให้ skeleton (signature + docstring + `pass`)
  - pro ให้แค่ signature เปล่า ๆ
  - expert/god กล่องโค้ดว่าง เขียนเองทั้งหมด
- บางด่านเป็น **randomizable**: สุ่ม input ใหม่ทุกครั้ง พร้อมคำนวณ expected จาก input จริง
- รัน test ในเบราว์เซอร์ด้วย Pyodide: define ฟังก์ชัน → เรียกทีละ test → เทียบกับ expected
  (มีตัวกันโค้ดวนไม่รู้จบด้วยการนับจำนวนบรรทัดที่รันผ่าน `sys.settrace`)
- ต้องผ่าน **ครบ 100%** (visible + hidden) ถึงจะเคลียร์ด่าน
- มี Leaderboard แยกของตัวเอง (ตาราง `function_forge_leaderboard`) และสูตรคะแนนของตัวเอง

เพิ่ม/แก้ด่านได้ที่ [src/lib/levels/function-forge-levels.ts](src/lib/levels/function-forge-levels.ts)

## ⚔️ Code Arena (เกมที่ 3)

เขียนโค้ด Python คุมหุ่นยนต์ (bot) ให้เดินฝ่า maze ไปหาเป้าหมาย 🏁
โค้ดทั้งโปรแกรมถูกรันครั้งเดียวด้วย Pyodide แล้วบันทึก "ลำดับการเดิน" (sequence)
ออกมาเล่นเป็น animation ทีละ step ให้เห็นว่า bot เดินไปทางไหน (เล่นซ้ำ/ปรับความเร็วได้)

**Bot API ที่ผู้เล่นเรียกใช้ได้** (รันใน Pyodide โดยผูกกับ state ของ grid):

```python
move_forward()    # เดินไปข้างหน้า 1 ช่อง ถ้าข้างหน้าเป็นกำแพง/ขอบจะ "ชน" (นับ wall hit ไม่ขยับ)
turn_left()       # หมุนซ้าย 90 องศา
turn_right()      # หมุนขวา 90 องศา
is_wall_ahead()   # True/False ว่าข้างหน้าเป็นกำแพงหรือขอบไหม
is_at_goal()      # True/False ว่า bot อยู่ที่เป้าหมายหรือยัง
# เพิ่มสำหรับด่าน god ที่มีไอเทม:
is_item_here()    # True/False ว่าช่องปัจจุบันมีไอเทมที่ยังไม่ถูกเก็บไหม
collect_item()    # เก็บไอเทมที่ช่องปัจจุบัน
items_collected() # จำนวนไอเทมที่เก็บไปแล้ว
```

- **5 ระดับความยาก** เหมือนเกมอื่น: noob → god
  - noob/beginner: เดินตรง/เลี้ยว เหมาะกับการใช้ for loop
  - pro: มีทางแยก ต้องใช้ `is_wall_ahead()` + if/else
  - expert: เขาวงกตซับซ้อน เหมาะกับ while loop / wall-following
  - god: ต้องเก็บไอเทม ⭐ ให้ครบก่อนถึงเป้าหมาย (`requiresAllItems`)
- `optimalSteps` ของแต่ละด่านคำนวณด้วย **BFS** (สั้นที่สุด รวมการเก็บไอเทม) เพื่อใช้เทียบคะแนน
- กัน infinite loop ด้วยเพดาน 500 step ในตัว harness (เกินแล้วหยุดและเตือนผู้เล่น)
- มี **2 โหมด**:
  - **Solo** — เล่นคนเดียว มี Leaderboard ของตัวเอง (ตาราง `code_arena_leaderboard`)
  - **Multiplayer** — สร้างห้องด้วย room code + รหัสผ่าน ชวนเพื่อนได้สูงสุด 40 คน
    แข่งเคลียร์ 5 ด่านชุดเดียวกัน รวมคะแนน วัดอันดับในห้อง (auto-refresh ทุก 5 วินาที)
    - ผู้เล่นถูกจดจำด้วย token ใน localStorage (ไม่มี login) — หัวห้องมี hostToken ไว้ปิดห้อง
    - ห้องหมดอายุใน 24 ชม. และถูกลบแบบ lazy เมื่อมี request เข้ามา (ไม่ต้องใช้ cron)
    - รหัสผ่านห้องเก็บเป็น plain text (ไม่ใช่ระบบ auth จริง) และ error ตอน join
      เป็นข้อความรวม ๆ ไม่บอกว่าผิดตรงไหน เพื่อกัน brute-force

เพิ่ม/แก้ด่านได้ที่ [src/lib/levels/code-arena-levels.ts](src/lib/levels/code-arena-levels.ts)
(วาด maze เป็นสตริง: `.`=ทางเดิน `#`=กำแพง `S`=จุดเริ่ม `G`=เป้าหมาย `*`=ไอเทม)

## 🧱 Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| รัน Python | Pyodide (client-side) |
| Code editor | @monaco-editor/react |
| เสียง | Tone.js (synthesized) |
| Database/ORM | PostgreSQL + Drizzle ORM |

## 🚀 เริ่มต้นใช้งานด้วย Docker (แนะนำ)

```bash
cp .env.example .env
docker compose up --build
```

จากนั้นเปิด <http://localhost:3000>

- container `web` จะรัน migration อัตโนมัติก่อนสตาร์ท (idempotent — รันซ้ำได้)
- container `db` เป็น PostgreSQL พร้อม volume เก็บข้อมูลถาวร

## 💻 รันแบบ Local Dev

ต้องมี Node.js 20+ และ PostgreSQL บนเครื่อง (หรือชี้ `DATABASE_URL` ไปที่ DB ใดก็ได้)

```bash
npm install

# ตั้งค่า .env แล้วแก้ DATABASE_URL ให้ชี้ไป localhost เช่น
# DATABASE_URL=postgres://arcade:arcade_password@localhost:5432/code_arcade
cp .env.example .env

# สร้างตาราง (รัน migration)
npm run db:migrate

npm run dev
```

> หมายเหตุ: ถ้ายังไม่ตั้งค่า database แอปยังเล่นเกมได้ปกติ
> เพียงแต่ระบบ Leaderboard จะไม่ทำงาน (หน้าเกมออกแบบให้ไม่พังเมื่อต่อ DB ไม่ได้)

## 📁 โครงสร้างหลัก

```
src/
├── app/
│   ├── page.tsx                         # เมนูหลัก (Code Arcade)
│   ├── games/bug-hunt/
│   │   ├── page.tsx                     # เลือกระดับความยาก
│   │   ├── play/page.tsx               # หน้าเล่นเกม
│   │   └── leaderboard/page.tsx        # ตารางคะแนน
│   ├── games/function-forge/           # เกมที่ 2 (โครงเดียวกับ bug-hunt)
│   │   ├── page.tsx                     # เลือกระดับความยาก
│   │   ├── play/page.tsx               # หน้าเล่นเกม
│   │   └── leaderboard/page.tsx        # ตารางคะแนน
│   ├── games/code-arena/               # เกมที่ 3 (Solo + Multiplayer)
│   │   ├── page.tsx                     # เลือกโหมด
│   │   ├── solo/play/page.tsx          # เล่นเดี่ยว
│   │   ├── leaderboard/page.tsx        # ตารางคะแนน solo
│   │   └── multiplayer/                 # สร้าง/เข้าร่วม + ห้องรอ/เล่น
│   ├── api/leaderboard/                 # Bug Hunt: check / submit / [level]
│   ├── api/function-forge/leaderboard/  # Function Forge: check / submit / [level]
│   └── api/code-arena/                  # Code Arena: leaderboard + rooms
├── components/
│   ├── Firefly.tsx                     # มาสคอต SVG เคลื่อนไหว (ใช้ทั้ง 2 เกม)
│   ├── CodeEditor.tsx                  # Monaco + highlight bug
│   ├── HintButton.tsx                  # ปุ่มคำใบ้
│   ├── MuteButton.tsx                  # เปิด/ปิดเสียง
│   ├── NameEntryModal.tsx             # กรอกชื่อสไตล์อาเขต (Bug Hunt)
│   └── ForgeNameEntryModal.tsx        # กรอกชื่อสไตล์อาเขต (Function Forge)
└── lib/
    ├── levels/bug-hunt-levels.ts      # ข้อมูลด่าน Bug Hunt
    ├── levels/function-forge-levels.ts # ข้อมูลด่าน Function Forge
    ├── levels/function-forge-meta.ts  # ข้อมูลระดับความยาก Function Forge
    ├── levels/code-arena-levels.ts    # ข้อมูลด่าน Code Arena (maze)
    ├── levels/code-arena-meta.ts      # ข้อมูลระดับความยาก Code Arena
    ├── maze.ts                        # geometry ของ maze + BFS หา optimal steps
    ├── arena-server.ts                # helper ฝั่ง server ของ multiplayer (token/cleanup)
    ├── arena-client.ts                # เก็บ token ห้องใน localStorage
    ├── pyodide.ts                     # โหลด/รัน Python + รัน test Forge + รัน bot Arena
    ├── sounds.ts                      # sound effect (Tone.js)
    ├── score.ts                       # สูตรคำนวณคะแนนของทั้ง 2 เกม
    ├── profanity.ts                   # ตัวกรองคำหยาบ
    └── db/                            # schema + connection + migration
```

## 🧮 สูตรคะแนน

**Bug Hunt**

```
score = max(0, 1000 - (timeSeconds * 2) - (wrongAttempts * 50))
```

**Function Forge** (runCount = จำนวนครั้งที่กด Run Tests ทั้งหมดจนผ่าน)

```
score = max(0, 1000 - (timeSeconds * 1) - ((runCount - 1) * 20))
```

**Code Arena** (extraSteps = step ที่เกินจากเส้นทางสั้นที่สุดที่ BFS หาได้)

```
extraSteps = max(0, stepsUsed - optimalSteps)
score = max(0, 1000 - (timeSeconds * 1) - (extraSteps * 10) - (wallHits * 30))
```

multiplayer: คะแนนรวมของผู้เล่นในห้อง = ผลรวม `score` ของทุกด่านที่เคลียร์ได้

คะแนนถูกคำนวณซ้ำที่ฝั่ง server เสมอตอนบันทึก เพื่อกันการปลอมคะแนนจาก client

## ➕ การเพิ่มด่านใหม่

แก้ไฟล์ [src/lib/levels/bug-hunt-levels.ts](src/lib/levels/bug-hunt-levels.ts)
เพิ่ม object เข้าไปในระดับที่ต้องการ โดยกำหนด `buggyCode` (โค้ดที่มี bug)
และ `expectedOutput` (ผลลัพธ์ที่ถูกต้องหลังแก้) ให้ตรงกัน

ถ้าตั้ง `randomizable: true` ให้ใส่ `{{N}}` ใน `buggyCode`,
กำหนด `nRange` และฟังก์ชัน `computeExpected` เพื่อสุ่มค่าและคำนวณผลลัพธ์แบบ dynamic
