import { Pool } from "pg";

// Usa DATABASE_URL desde las variables de entorno de Vercel
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10_000
});

export async function query<T = any>(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res;
  } finally {
    client.release();
  }
}

export async function tx<T>(fn: (q: (sql: string, p?: any[]) => Promise<any>) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const runner = (sql: string, p?: any[]) => client.query(sql, p);
    const out = await fn(runner);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    client.release();
  }
}
