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

// ===================== Function Forge: รัน test กับฟังก์ชันที่ผู้เล่นเขียน =====================

// ผลลัพธ์ของ test หนึ่งกรณี (actual/expected เป็น repr ของ Python ไว้แสดงผล)
export interface ForgeTestResult {
  pass: boolean;
  actual: string | null; // repr ของค่าที่ฟังก์ชันคืน (null ถ้าเกิด error ระหว่างเรียก)
  expected: string; // repr ของค่าที่คาดหวัง
  error: string | null; // ข้อความ error ถ้าการเรียกฟังก์ชันล้มเหลว
}

export interface ForgeRunResult {
  // error ตอน define ฟังก์ชัน (syntax error หรือหาฟังก์ชันไม่เจอ) ถ้ามีจะไม่รัน test เลย
  defineError: string | null;
  results: ForgeTestResult[];
}

// test ที่ส่งเข้าไปรัน: input คือ argument list, expectedOutput คือค่าที่คาดหวัง
interface ForgeTestInput {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expectedOutput: unknown;
}

// harness ภาษา Python: รันโค้ดผู้เล่น → หาฟังก์ชัน → เรียกทีละ test → คืนผลเป็น JSON string
// - กัน stdout ของผู้เล่นปนผลลัพธ์ด้วยการ redirect ลง buffer ทิ้ง
// - กัน infinite loop ด้วย sys.settrace นับจำนวนบรรทัดที่รัน ถ้าเกินเพดานให้ยกเลิก
const FORGE_HARNESS = `
import json, sys, io, math, contextlib

_tests = json.loads(__ff_tests_json)
_func_name = __ff_func_name
_user_code = __ff_user_code

def __ff_eq(a, b):
    # bool ต้องเทียบแบบตรงตัว (True != 1 ในเชิงเฉลย)
    if isinstance(a, bool) or isinstance(b, bool):
        return a == b
    # ตัวเลขเทียบแบบเผื่อความคลาดเคลื่อน floating point
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)
    return a == b

_result = {"defineError": None, "results": []}

# รันโค้ดผู้เล่นใน namespace ใหม่ (กลบ stdout/stderr ไม่ให้ปนผลลัพธ์)
_ns = {}
_sink = io.StringIO()
try:
    with contextlib.redirect_stdout(_sink), contextlib.redirect_stderr(_sink):
        exec(_user_code, _ns)
except Exception as e:
    _result["defineError"] = "{}: {}".format(type(e).__name__, e)

_fn = _ns.get(_func_name)
if _result["defineError"] is None and not callable(_fn):
    _result["defineError"] = "ไม่พบฟังก์ชันชื่อ '" + _func_name + "' (ตรวจชื่อให้ตรงกับโจทย์)"

if _result["defineError"] is None:
    _counter = {"n": 0}
    _LIMIT = 3000000  # เพดานจำนวนบรรทัด กันโค้ดวนไม่รู้จบ
    def __ff_trace(frame, event, arg):
        if event == "line":
            _counter["n"] += 1
            if _counter["n"] > _LIMIT:
                raise TimeoutError("รันนานเกินไป (อาจมี infinite loop)")
        return __ff_trace

    for _t in _tests:
        _args = _t.get("input", [])
        _expected = _t.get("expectedOutput")
        _entry = {"pass": False, "actual": None, "expected": repr(_expected), "error": None}
        _b = io.StringIO()
        _counter["n"] = 0
        try:
            sys.settrace(__ff_trace)
            with contextlib.redirect_stdout(_b), contextlib.redirect_stderr(_b):
                _actual = _fn(*_args)
            sys.settrace(None)
            _entry["pass"] = __ff_eq(_actual, _expected)
            _entry["actual"] = repr(_actual)
        except Exception as e:
            sys.settrace(None)
            _entry["error"] = "{}: {}".format(type(e).__name__, e)
        _result["results"].append(_entry)

json.dumps(_result)
`;

// รันโค้ดผู้เล่นกับชุด test (visible + hidden ตามลำดับที่ส่งเข้ามา)
export async function runFunctionTests(
  code: string,
  functionName: string,
  tests: ForgeTestInput[],
): Promise<ForgeRunResult> {
  const pyodide = await getPyodide();

  // ปิด stdout/stderr ระดับ pyodide ไว้ก่อน (harness จัดการ output เองทั้งหมด)
  pyodide.setStdout({ batched: () => {} });
  pyodide.setStderr({ batched: () => {} });

  // ส่งข้อมูลผ่าน globals แทนการฝังในสตริง เพื่อกันปัญหา escape/injection
  pyodide.globals.set("__ff_user_code", code);
  pyodide.globals.set("__ff_func_name", functionName);
  pyodide.globals.set(
    "__ff_tests_json",
    JSON.stringify(
      tests.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
    ),
  );

  try {
    const raw = await pyodide.runPythonAsync(FORGE_HARNESS);
    return JSON.parse(raw as string) as ForgeRunResult;
  } catch (err) {
    // harness ไม่ควร throw แต่ถ้าเกิดเหตุสุดวิสัย ให้รายงานเป็น defineError
    const msg = err instanceof Error ? err.message : String(err);
    return { defineError: cleanTraceback(msg), results: [] };
  }
}

// ===================== Code Arena: รัน bot ใน maze แล้วบันทึก sequence การเดิน =====================

// หนึ่งเฟรมของ animation: สถานะของ bot หลังทำ action นั้น ๆ
export interface ArenaFrame {
  r: number; // แถวปัจจุบันของ bot
  c: number; // คอลัมน์ปัจจุบัน
  dir: "up" | "down" | "left" | "right";
  action: "start" | "move" | "turn_left" | "turn_right" | "collect";
  wallHit: boolean; // true ถ้าเฟรมนี้คือการเดินชนกำแพง/ขอบ (bot ไม่ขยับ)
  collectedCell: [number, number] | null; // ช่องที่เพิ่งเก็บไอเทม (สำหรับให้ไอเทมหายไป)
}

export interface ArenaRunResult {
  error: string | null; // error จากโค้ดผู้เล่น (ถ้ามี) — null = รันจบปกติ
  reached: boolean; // bot จบเกมโดยอยู่ที่เป้าหมาย (และเก็บไอเทมครบถ้าจำเป็น)
  frames: ArenaFrame[]; // ลำดับเฟรมไว้เล่น animation
  steps: number; // จำนวน action ที่นับเป็น step (move/turn/collect)
  wallHits: number; // จำนวนครั้งที่เดินชน
  itemsCollected: number; // จำนวนไอเทมที่เก็บได้
  totalItems: number; // จำนวนไอเทมทั้งหมดในด่าน
  limitHit: boolean; // true ถ้าหยุดเพราะเกินเพดาน step (สงสัยมี infinite loop)
}

// พารามิเตอร์ที่ส่งให้ runner
export interface ArenaRunInput {
  grid: number[][];
  startDirection: "up" | "down" | "left" | "right";
  requiresAllItems: boolean;
}

// harness ภาษา Python: สร้าง bot API ที่ผูกกับ state ของ maze (เก็บใน Python ล้วน)
// ผู้เล่นเรียก move_forward()/turn_left()/... แล้วทุก action ถูกบันทึกลง _frames
// - กัน infinite loop ด้วยเพดานจำนวน step (เมื่อเกินจะ raise ออกจาก loop)
// - คืนผลเป็น JSON string ให้ฝั่ง JS เล่น animation ต่อ
const ARENA_HARNESS = `
import json

_grid = json.loads(__ca_grid_json)
_dir = __ca_start_dir
_requires_all = bool(__ca_requires_all)
_user_code = __ca_user_code

_ROWS = len(_grid)
_COLS = len(_grid[0]) if _ROWS else 0
_STEP_LIMIT = 500  # เพดานจำนวน step กันโค้ดวนไม่รู้จบ

# หาตำแหน่งเริ่ม/เป้าหมาย/ไอเทม
_start = (0, 0)
_goal = (0, 0)
_items = set()
for _r in range(_ROWS):
    for _c in range(_COLS):
        _v = _grid[_r][_c]
        if _v == 2: _start = (_r, _c)
        elif _v == 3: _goal = (_r, _c)
        elif _v == 4: _items.add((_r, _c))

_total_items = len(_items)
_collected = set()

# state ของ bot (ใช้ list เพื่อแก้ค่าใน closure ได้)
_state = {"r": _start[0], "c": _start[1], "dir": _dir}
_frames = []
_steps = {"n": 0}
_wall_hits = {"n": 0}

_DELTA = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}
_CW = ["up", "right", "down", "left"]

class _StepLimit(Exception):
    pass

def _record(action, wall_hit=False, collected_cell=None):
    _frames.append({
        "r": _state["r"], "c": _state["c"], "dir": _state["dir"],
        "action": action, "wallHit": wall_hit, "collectedCell": collected_cell,
    })

def _count_step():
    _steps["n"] += 1
    if _steps["n"] > _STEP_LIMIT:
        raise _StepLimit()

def _in_bounds(r, c):
    return 0 <= r < _ROWS and 0 <= c < _COLS

def _walkable(r, c):
    return _in_bounds(r, c) and _grid[r][c] != 1

# ---------- bot API ที่ผู้เล่นเรียกได้ ----------
def move_forward():
    _count_step()
    dr, dc = _DELTA[_state["dir"]]
    nr, nc = _state["r"] + dr, _state["c"] + dc
    if _walkable(nr, nc):
        _state["r"], _state["c"] = nr, nc
        _record("move", wall_hit=False)
    else:
        _wall_hits["n"] += 1
        _record("move", wall_hit=True)

def turn_left():
    _count_step()
    i = _CW.index(_state["dir"])
    _state["dir"] = _CW[(i + 3) % 4]
    _record("turn_left")

def turn_right():
    _count_step()
    i = _CW.index(_state["dir"])
    _state["dir"] = _CW[(i + 1) % 4]
    _record("turn_right")

def is_wall_ahead():
    dr, dc = _DELTA[_state["dir"]]
    return not _walkable(_state["r"] + dr, _state["c"] + dc)

def is_at_goal():
    return (_state["r"], _state["c"]) == _goal

def is_item_here():
    pos = (_state["r"], _state["c"])
    return pos in _items and pos not in _collected

def collect_item():
    pos = (_state["r"], _state["c"])
    if pos in _items and pos not in _collected:
        _count_step()
        _collected.add(pos)
        _record("collect", collected_cell=[pos[0], pos[1]])

def items_collected():
    return len(_collected)

_result = {
    "error": None, "reached": False, "frames": [], "steps": 0,
    "wallHits": 0, "itemsCollected": 0, "totalItems": _total_items,
    "limitHit": False,
}

# เฟรมเริ่มต้น (สถานะก่อนเริ่มเดิน) ไว้ให้ animation มีจุดตั้งต้น
_record("start")

_api = {
    "move_forward": move_forward, "turn_left": turn_left, "turn_right": turn_right,
    "is_wall_ahead": is_wall_ahead, "is_at_goal": is_at_goal,
    "is_item_here": is_item_here, "collect_item": collect_item,
    "items_collected": items_collected,
}

try:
    exec(_user_code, _api)
except _StepLimit:
    _result["limitHit"] = True
except Exception as e:
    _result["error"] = "{}: {}".format(type(e).__name__, e)

_at_goal = (_state["r"], _state["c"]) == _goal
_all_items = (len(_collected) == _total_items) if _requires_all else True
_result["reached"] = bool(_at_goal and _all_items)
_result["frames"] = _frames
_result["steps"] = _steps["n"]
_result["wallHits"] = _wall_hits["n"]
_result["itemsCollected"] = len(_collected)

json.dumps(_result)
`;

// รันโค้ดผู้เล่นกับ maze หนึ่งด่าน คืนลำดับเฟรมไว้เล่น animation
export async function runArenaBot(
  code: string,
  input: ArenaRunInput,
): Promise<ArenaRunResult> {
  const pyodide = await getPyodide();

  // harness จัดการ output เอง — ปิด stdout/stderr ระดับ pyodide
  pyodide.setStdout({ batched: () => {} });
  pyodide.setStderr({ batched: () => {} });

  // ส่งข้อมูลผ่าน globals กันปัญหา escape/injection
  pyodide.globals.set("__ca_user_code", code);
  pyodide.globals.set("__ca_grid_json", JSON.stringify(input.grid));
  pyodide.globals.set("__ca_start_dir", input.startDirection);
  pyodide.globals.set("__ca_requires_all", input.requiresAllItems);

  try {
    const raw = await pyodide.runPythonAsync(ARENA_HARNESS);
    return JSON.parse(raw as string) as ArenaRunResult;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      error: cleanTraceback(msg),
      reached: false,
      frames: [],
      steps: 0,
      wallHits: 0,
      itemsCollected: 0,
      totalItems: 0,
      limitHit: false,
    };
  }
}
