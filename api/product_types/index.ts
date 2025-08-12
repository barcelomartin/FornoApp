import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../_db";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const { rows } = await query(
      `SELECT pt.id, pt.name, pt.product_id, p.name AS product
       FROM product_types pt
       JOIN products p ON p.id = pt.product_id
       ORDER BY p.name, pt.name`
    );
    return res.status(200).json(rows);
  }
  if (req.method === "POST") {
    const { product_id, name } = req.body ?? {};
    if (!product_id || !name) return res.status(400).json({ error: "product_id y name requeridos" });
    const { rows } = await query(
      "INSERT INTO product_types(product_id, name) VALUES ($1,$2) RETURNING id, product_id, name",
      [product_id, name]
    );
    return res.status(201).json(rows[0]);
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method Not Allowed" });
}
