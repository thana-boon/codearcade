"use client";

import { useEffect, useRef } from "react";

export type FireflyMood = "happy" | "thinking" | "sad";

interface FireflyProps {
  mood: FireflyMood;
  size?: number;
}

// หิ่งห้อยมาสคอต วาดด้วย SVG ล้วน (ไม่ใช้รูปจาก AI) เคลื่อนไหวด้วย requestAnimationFrame + Math.sin
// ไม่พึ่ง animation library ใด ๆ ทั้งสิ้น
export default function Firefly({ mood, size = 120 }: FireflyProps) {
  // refs ไปยังชิ้นส่วนต่าง ๆ ที่ต้องขยับทุกเฟรม
  const bodyRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const leftWingRef = useRef<SVGEllipseElement>(null);
  const rightWingRef = useRef<SVGEllipseElement>(null);
  const sparkRefs = [
    useRef<SVGGElement>(null),
    useRef<SVGGElement>(null),
    useRef<SVGGElement>(null),
  ];

  // mood เก็บใน ref ด้วย เพื่อให้ loop อ่านค่าล่าสุดได้โดยไม่ต้อง restart loop
  const moodRef = useRef<FireflyMood>(mood);
  moodRef.current = mood;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = (now - start) / 1000; // เวลาเป็นวินาที
      const currentMood = moodRef.current;

      // ลอยขึ้น-ลงเบา ๆ ตลอดเวลา (idle floating) amplitude ~8px
      const floatY = Math.sin(t * 2) * 8;
      // เอียงตัวซ้าย-ขวานิดหน่อย (ไม่เกิน 12 องศา) ความเร็วลอยช้ากว่าการลอย
      const tilt = Math.sin(t * 1.3) * 6;
      if (bodyRef.current) {
        bodyRef.current.setAttribute(
          "transform",
          `translate(0 ${floatY}) rotate(${tilt} 60 60)`,
        );
      }

      // ปีกกระพือถี่ ๆ ด้วยการบีบ scaleX (ตอน thinking กระพือช้าลง)
      const flapSpeed = currentMood === "thinking" ? 14 : 22;
      const flap = 0.55 + Math.abs(Math.sin(t * flapSpeed)) * 0.45;
      if (leftWingRef.current) {
        leftWingRef.current.setAttribute(
          "transform",
          `translate(38 52) scale(${flap} 1)`,
        );
      }
      if (rightWingRef.current) {
        rightWingRef.current.setAttribute(
          "transform",
          `translate(82 52) scale(${flap} 1)`,
        );
      }

      // ก้นเรืองแสง pulse: ตอนตอบถูก (happy) สว่างและเต้นแรงกว่า
      const glowBase = currentMood === "happy" ? 0.85 : 0.5;
      const glowAmp = currentMood === "happy" ? 0.15 : 0.25;
      const glowSpeed = currentMood === "happy" ? 6 : 3;
      const glow = glowBase + Math.sin(t * glowSpeed) * glowAmp;
      if (glowRef.current) {
        glowRef.current.setAttribute("opacity", String(glow));
        glowRef.current.setAttribute("r", String(11 + Math.sin(t * glowSpeed) * 3));
      }

      // ประกายแสง 3 จุด โคจรรอบตัวมาสคอตด้วย polar coordinate (phase ต่างกันทุกจุด)
      sparkRefs.forEach((ref, i) => {
        const phase = (i / sparkRefs.length) * Math.PI * 2;
        const speed = currentMood === "happy" ? 2.5 : 1.4;
        const radius = 46 + Math.sin(t * 2 + phase) * 4;
        const angle = t * speed + phase;
        const cx = 60 + Math.cos(angle) * radius;
        const cy = 60 + Math.sin(angle) * radius * 0.7; // วงรีแนวนอนเล็กน้อย
        const twinkle = 0.3 + Math.abs(Math.sin(t * 4 + phase)) * 0.7;
        if (ref.current) {
          ref.current.setAttribute("transform", `translate(${cx} ${cy})`);
          ref.current.setAttribute("opacity", String(twinkle));
        }
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // ตั้ง loop ครั้งเดียว ไม่ผูกกับ mood (อ่าน mood ผ่าน ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`หิ่งห้อยมาสคอตอารมณ์ ${mood}`}
    >
      <defs>
        <radialGradient id="ff-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ff-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fac775" />
          <stop offset="100%" stopColor="#ef9f27" />
        </linearGradient>
      </defs>

      {/* ประกายแสงโคจรรอบตัว */}
      {sparkRefs.map((ref, i) => (
        <g key={i} ref={ref}>
          <circle r="2.5" fill="#fde68a" />
        </g>
      ))}

      <g ref={bodyRef}>
        {/* แสงเรืองรอบก้น (อยู่ท้ายสุดของลำตัว) */}
        <circle ref={glowRef} cx="60" cy="84" r="11" fill="url(#ff-glow)" />
        <circle cx="60" cy="80" r="6" fill="#fde68a" />

        {/* ปีก 2 ข้าง โปร่งแสง */}
        <ellipse
          ref={leftWingRef}
          cx="0"
          cy="0"
          rx="14"
          ry="20"
          fill="#fac775"
          opacity="0.45"
        />
        <ellipse
          ref={rightWingRef}
          cx="0"
          cy="0"
          rx="14"
          ry="20"
          fill="#fac775"
          opacity="0.45"
        />

        {/* ลำตัวกลม สีส้ม-เหลือง */}
        <ellipse cx="60" cy="58" rx="26" ry="30" fill="url(#ff-body)" />

        {/* หนวด 2 เส้นโค้งบนหัว ปลายมีจุด */}
        <path
          d="M50 32 Q44 18 38 14"
          stroke="#ef9f27"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M70 32 Q76 18 82 14"
          stroke="#ef9f27"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="38" cy="14" r="3" fill="#fde68a" />
        <circle cx="82" cy="14" r="3" fill="#fde68a" />

        {/* ใบหน้าเปลี่ยนตามอารมณ์ */}
        <FaceByMood mood={mood} />
      </g>
    </svg>
  );
}

// วาดสีหน้าแยกตามอารมณ์ (สลับเฉพาะ path ของตา/ปาก/หยดน้ำ/เครื่องหมาย ?)
function FaceByMood({ mood }: { mood: FireflyMood }) {
  if (mood === "happy") {
    return (
      <g>
        {/* ตายิ้ม (โค้งขึ้น) */}
        <path
          d="M48 54 Q52 49 56 54"
          stroke="#3d2b00"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M64 54 Q68 49 72 54"
          stroke="#3d2b00"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* ปากยิ้มกว้าง */}
        <path
          d="M52 64 Q60 74 68 64"
          stroke="#3d2b00"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (mood === "sad") {
    return (
      <g>
        {/* ตาเศร้า (เล็กลง) */}
        <circle cx="52" cy="54" r="2.5" fill="#3d2b00" />
        <circle cx="68" cy="54" r="2.5" fill="#3d2b00" />
        {/* ปากคว่ำ */}
        <path
          d="M52 70 Q60 62 68 70"
          stroke="#3d2b00"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* หยดน้ำตา */}
        <path d="M50 58 q-3 6 0 8 q3 -2 0 -8" fill="#7dd3fc" />
      </g>
    );
  }

  // thinking
  return (
    <g>
      {/* ตาเหลือบมองขึ้น */}
      <circle cx="52" cy="52" r="3" fill="#3d2b00" />
      <circle cx="68" cy="52" r="3" fill="#3d2b00" />
      {/* ปากจู๋เล็ก ๆ */}
      <circle cx="60" cy="66" r="2.5" fill="#3d2b00" />
      {/* เครื่องหมาย ? ลอยข้างหัว */}
      <text
        x="86"
        y="40"
        fontSize="16"
        fontWeight="bold"
        fill="#fde68a"
        fontFamily="monospace"
      >
        ?
      </text>
    </g>
  );
}
