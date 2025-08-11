import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { rows } = await query("SELECT id, name, start_date, end_date FROM campaigns ORDER BY start_date DESC");
    return res.status(200).json(rows);
  }
  if (req.method === "POST") {
    const { name, start_date, end_date } = req.body ?? {};
    if (!name || !start_date || !end_date) return res.status(400).json({ error: "name, start_date, end_date requeridos" });
    const { rows } = await query(
      "INSERT INTO campaigns(name, start_date, end_date) VALUES ($1,$2,$3) RETURNING id, name, start_date, end_date",
      [name, start_date, end_date]
    );
    return res.status(201).json(rows[0]);
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method Not Allowed" });
}
