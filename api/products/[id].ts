import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../_db";

export default async function handler(req: any, res: any) {
  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: "id requerido" });

  if (req.method === "GET") {
    const { rows } = await query("SELECT id, name FROM products WHERE id=$1", [id]);
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "no encontrado" });
  }
  if (req.method === "PUT") {
    const { name } = req.body ?? {};
    const { rows } = await query("UPDATE products SET name = COALESCE($2,name) WHERE id=$1 RETURNING id, name", [id, name]);
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "no encontrado" });
  }
  if (req.method === "DELETE") {
    await query("DELETE FROM products WHERE id=$1", [id]);
    return res.status(204).end();
  }
  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method Not Allowed" });
}
