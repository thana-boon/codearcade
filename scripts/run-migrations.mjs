// สคริปต์รัน migration แบบ raw SQL (ใช้ตอน container start)
// อ่านไฟล์ .sql ในโฟลเดอร์ drizzle ตามลำดับแล้ว execute ทีละ statement
// ทุก migration เขียนแบบ idempotent (IF NOT EXISTS) จึงรันซ้ำได้ไม่พัง
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const migrationsDir = join(process.cwd(), "drizzle");

async function main() {
  const sql = postgres(connectionString, { max: 1 });

  // ดึงรายชื่อไฟล์ .sql เรียงตามชื่อ (0000_, 0001_, ...)
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), "utf8");
    // drizzle ใช้ "--> statement-breakpoint" คั่นแต่ละ statement
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`[migrate] applying ${file} (${statements.length} statements)`);
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
  }

  await sql.end();
  console.log("[migrate] done.");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
