// โมดูลโหลดและรัน Python ในเบราว์เซอร์ด้วย Pyodide (ทำงานฝั่ง client ล้วน ไม่ต้องมี backend)
// โหลด pyodide จาก CDN ครั้งเดียวแล้ว cache ไว้ (singleton)

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PyodideInterface = any;

declare global {
  interface Window {
    // ฟังก์ชัน global ที่มากับ pyodide.js
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

// โหลดสคริปต์ pyodide.js จาก CDN ด้วยการแทรก <script> (โหลดครั้งเดียว)
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`โหลดสคริปต์ไม่สำเร็จ: ${src}`));
    document.head.appendChild(script);
  });
}

// คืน instance ของ pyodide (โหลดครั้งแรกจะใช้เวลาสักครู่)
export function getPyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_CDN}pyodide.js`);
      if (!window.loadPyodide) {
        throw new Error("ไม่พบ loadPyodide หลังโหลดสคริปต์");
      }
      return window.loadPyodide({ indexURL: PYODIDE_CDN });
    })();
  }
  return pyodidePromise;
}

export interface RunResult {
  ok: boolean; // true = รันสำเร็จไม่มี error
  stdout: string; // ข้อความที่โปรแกรมพิมพ์ออกมา
  error: string; // ข้อความ error (ถ้ามี)
}

// รันโค้ด Python แล้วเก็บ stdout / error กลับมา
export async function runPython(code: string): Promise<RunResult> {
  const pyodide = await getPyodide();

  let stdout = "";
  // เก็บทุกบรรทัดที่ถูกพิมพ์ผ่าน print()
  pyodide.setStdout({
    batched: (text: string) => {
      stdout += text + "\n";
    },
  });
  // error ของผู้ใช้ส่วนใหญ่ถูกโยนเป็น exception อยู่แล้ว แต่ดัก stderr ไว้เผื่อ warning
  pyodide.setStderr({
    batched: () => {
      /* ไม่นำ stderr มาปนกับผลลัพธ์ */
    },
  });

  try {
    await pyodide.runPythonAsync(code);
    return { ok: true, stdout, error: "" };
  } catch (err) {
    // ตัด traceback ภายในของ pyodide ออก เหลือเฉพาะข้อความ error ให้ผู้เล่นอ่านง่าย
    const raw = err instanceof Error ? err.message : String(err);
    return { ok: false, stdout, error: cleanTraceback(raw) };
  }
}

// ทำให้ traceback อ่านง่ายขึ้น โดยตัดบรรทัดที่อ้างถึงไฟล์ภายในของ pyodide ออก
function cleanTraceback(raw: string): string {
  const lines = raw.split("\n").filter((line) => {
    const t = line.trim();
    if (!t) return false;
    // ตัดบรรทัด traceback ที่ชี้ไปไฟล์ระบบ
    if (t.startsWith("File \"/lib/")) return false;
    if (t.includes("pyodide")) return false;
    return true;
  });
  return lines.join("\n").trim() || raw.trim();
}

// เทียบผลลัพธ์ที่ได้กับที่คาดหวัง (ตัดช่องว่างหัวท้ายและ normalize ตัวจบบรรทัด)
export function outputMatches(actual: string, expected: string): boolean {
  const norm = (s: string) =>
    s.replace(/\r\n/g, "\n").replace(/\s+$/g, "").trim();
  return norm(actual) === norm(expected);
}
