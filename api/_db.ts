import { Pool } from "pg";

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  // Para ver el fallo claro en logs
  throw new Error("Missing env: DATABASE_URL");
}

export const pool = new Pool({
  connectionString: connStr,
  // Fuerza SSL para Neon en Vercel
  ssl: { rejectUnauthorized: false },
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
