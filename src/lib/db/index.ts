import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// สร้าง connection แบบ singleton + lazy
// ไม่สร้าง/ไม่ throw ตอน import เพื่อให้ `next build` ไม่พังเมื่อยังไม่มี DATABASE_URL
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: PostgresJsDatabase<typeof schema>;
};

function getDb(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.db) return globalForDb.db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = globalForDb.client ?? postgres(connectionString, { max: 5 });
  const instance = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
    globalForDb.db = instance;
  }
  return instance;
}

// proxy ให้เรียกใช้ db ได้เหมือนเดิม แต่ connection ถูกสร้างตอนเรียกครั้งแรกเท่านั้น
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const instance = getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
