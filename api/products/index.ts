import { query } from "../_db.js";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const { rows } = await query("SELECT id, name FROM products ORDER BY name");
    return res.status(200).json(rows);
  }
  if (req.method === "POST") {
    const { name } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "name es requerido" });
    const { rows } = await query("INSERT INTO products(name) VALUES ($1) RETURNING id, name", [name]);
    return res.status(201).json(rows[0]);
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method Not Allowed" });
}
