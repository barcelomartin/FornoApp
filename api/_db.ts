import { Pool } from "pg";

const connStr = process.env.DATABASE_URL;
if (!connStr) throw new Error("Missing env: DATABASE_URL");

export const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }, // Neon + Vercel
  max: 5,
  idleTimeoutMillis: 10_000,
});

export async function query(text: string, params?: any[]) {
  const c = await pool.connect();
  try {
    const res = await c.query(text, params);
    return res;
  } finally {
    c.release();
  }
}

export async function tx<T = any>(fn: (q: any) => Promise<T>) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const q = (sql: string, params?: any[]) => c.query(sql, params);
    const out = await fn(q);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch {}
    throw e;
  } finally {
    c.release();
  }
}
