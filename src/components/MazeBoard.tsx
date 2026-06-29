"use client";

import { useMemo } from "react";
import { CELL, type Direction } from "@/lib/maze";

interface MazeBoardProps {
  grid: number[][];
  // ตำแหน่ง/ทิศของ bot ที่จะวาด (เฟรมปัจจุบันของ animation)
  botR: number;
  botC: number;
  botDir: Direction;
  // เซ็ตของช่องไอเทมที่ถูกเก็บไปแล้ว ("r,c") เพื่อซ่อนไอเทมที่หายไป
  collected: Set<string>;
  // bot กำลังดีใจ (ถึงเป้า) หรือเสียใจ (ล้มเหลว) ใช้เปลี่ยนสีหน้า bot เล็กน้อย
  status?: "idle" | "happy" | "sad";
}

// องศาการหมุนของ bot ตามทิศ (วาด bot หันขึ้นเป็นค่าเริ่มต้น)
const DIR_ROTATION: Record<Direction, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

// เรนเดอร์ maze เป็นตาราง พร้อม sprite ของ bot ที่ขยับได้ลื่น ๆ ด้วย CSS transition
export default function MazeBoard({
  grid,
  botR,
  botC,
  botDir,
  collected,
  status = "idle",
}: MazeBoardProps) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // ขนาดช่อง: grid ใหญ่ใช้ช่องเล็กลง เพื่อให้ทั้งกระดานพอดีพื้นที่
  const cell = useMemo(() => {
    const maxDim = Math.max(rows, cols);
    return Math.max(20, Math.min(52, Math.floor(440 / maxDim)));
  }, [rows, cols]);

  const botColor =
    status === "happy" ? "#3fb950" : status === "sad" ? "#f85149" : "#58a6ff";

  return (
    <div className="flex justify-center">
      <div
        className="relative rounded-lg border border-border bg-bg p-2"
        style={{ width: cols * cell + 16, height: rows * cell + 16 }}
      >
        {/* ช่องต่าง ๆ ของ maze */}
        {grid.map((row, r) =>
          row.map((value, c) => (
            <CellView
              key={`${r}-${c}`}
              value={value}
              size={cell}
              left={c * cell}
              top={r * cell}
              collected={collected.has(`${r},${c}`)}
            />
          )),
        )}

        {/* sprite ของ bot — ขยับด้วย transform + transition ให้ลื่น */}
        <div
          className="absolute transition-all duration-150 ease-linear"
          style={{
            width: cell,
            height: cell,
            transform: `translate(${botC * cell + 8}px, ${botR * cell + 8}px)`,
            left: 0,
            top: 0,
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center transition-transform duration-150"
            style={{ transform: `rotate(${DIR_ROTATION[botDir]}deg)` }}
          >
            <BotSprite size={Math.floor(cell * 0.74)} color={botColor} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CellView({
  value,
  size,
  left,
  top,
  collected,
}: {
  value: number;
  size: number;
  left: number;
  top: number;
  collected: boolean;
}) {
  const isWall = value === CELL.WALL;
  const isGoal = value === CELL.GOAL;
  const isItem = value === CELL.ITEM && !collected;

  return (
    <div
      className="absolute box-border"
      style={{ width: size, height: size, left: left + 8, top: top + 8 }}
    >
      <div
        className={`h-full w-full border ${
          isWall
            ? "border-[#1c2128] bg-[#21262d]"
            : "border-[#161b22] bg-[#0d1117]"
        }`}
        style={{ borderRadius: 3 }}
      >
        {isGoal && (
          <div className="flex h-full w-full items-center justify-center text-base">
            🏁
          </div>
        )}
        {isItem && (
          <div className="flex h-full w-full animate-pulse items-center justify-center text-base">
            ⭐
          </div>
        )}
      </div>
    </div>
  );
}

// sprite ของ bot วาดด้วย SVG ล้วน (หันขึ้นเป็นค่าเริ่มต้น) สามเหลี่ยมด้านบน = ทิศที่หัน
function BotSprite({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ตัว bot */}
      <rect
        x="22"
        y="30"
        width="56"
        height="50"
        rx="12"
        fill={color}
        stroke="#0d1117"
        strokeWidth="4"
      />
      {/* ตา */}
      <circle cx="40" cy="52" r="7" fill="#0d1117" />
      <circle cx="60" cy="52" r="7" fill="#0d1117" />
      <circle cx="42" cy="50" r="2.5" fill="#fff" />
      <circle cx="62" cy="50" r="2.5" fill="#fff" />
      {/* ลูกศรบอกทิศ (ชี้ขึ้น) */}
      <path d="M50 6 L64 26 L36 26 Z" fill={color} stroke="#0d1117" strokeWidth="3" />
      {/* เสาอากาศ/ไฟ */}
      <circle cx="50" cy="24" r="4" fill="#d29922" />
    </svg>
  );
}
