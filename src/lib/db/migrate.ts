import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// สคริปต์รัน migration อัตโนมัติตอน container start
// idempotent โดยธรรมชาติ: drizzle เก็บประวัติ migration ไว้ จะไม่รันซ้ำด่านที่รันแล้ว
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // ใช้ connection แยก max=1 สำหรับ migration แล้วปิดเมื่อเสร็จ
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("[migrate] running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] done.");

  await migrationClient.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
