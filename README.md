# 🎮 Code Arcade

เกมฝึกทักษะการเขียนโค้ดแบบเล่นได้ทันที **ไม่ต้องสมัครสมาชิก / ไม่มี login**
เกมแรกที่เปิดให้เล่นคือ **Bug Hunt** — เกมหาและแก้ bug ในโค้ด Python

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
│   └── api/leaderboard/                 # check / submit / [level]
├── components/
│   ├── Firefly.tsx                     # มาสคอต SVG เคลื่อนไหว
│   ├── CodeEditor.tsx                  # Monaco + highlight bug
│   ├── HintButton.tsx                  # ปุ่มคำใบ้
│   ├── MuteButton.tsx                  # เปิด/ปิดเสียง
│   └── NameEntryModal.tsx             # กรอกชื่อสไตล์อาเขต
└── lib/
    ├── levels/bug-hunt-levels.ts      # ข้อมูลด่านทั้งหมด
    ├── pyodide.ts                     # โหลด/รัน Python
    ├── sounds.ts                      # sound effect (Tone.js)
    ├── score.ts                       # สูตรคำนวณคะแนน
    ├── profanity.ts                   # ตัวกรองคำหยาบ
    └── db/                            # schema + connection + migration
```

## 🧮 สูตรคะแนน

```
score = max(0, 1000 - (timeSeconds * 2) - (wrongAttempts * 50))
```

คะแนนถูกคำนวณซ้ำที่ฝั่ง server เสมอตอนบันทึก เพื่อกันการปลอมคะแนนจาก client

## ➕ การเพิ่มด่านใหม่

แก้ไฟล์ [src/lib/levels/bug-hunt-levels.ts](src/lib/levels/bug-hunt-levels.ts)
เพิ่ม object เข้าไปในระดับที่ต้องการ โดยกำหนด `buggyCode` (โค้ดที่มี bug)
และ `expectedOutput` (ผลลัพธ์ที่ถูกต้องหลังแก้) ให้ตรงกัน

ถ้าตั้ง `randomizable: true` ให้ใส่ `{{N}}` ใน `buggyCode`,
กำหนด `nRange` และฟังก์ชัน `computeExpected` เพื่อสุ่มค่าและคำนวณผลลัพธ์แบบ dynamic
