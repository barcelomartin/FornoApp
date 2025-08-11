import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { rows } = await query<{ now: string }>("select now() as now");
  res.status(200).json({ ok: true, now: rows[0]?.now });
}
