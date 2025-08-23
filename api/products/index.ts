import { query } from "../_db.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const { rows } = await query("SELECT id, name FROM products ORDER BY name");
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { name } = req.body ?? {};
      if (!name) return res.status(400).json({ error: "name requerido" });
      const { rows } = await query(
        "INSERT INTO products (name) VALUES ($1) RETURNING id, name",
        [name]
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, name } = req.body ?? {};
      if (!id || !name) return res.status(400).json({ error: "id y name requeridos" });
      const { rows } = await query(
        "UPDATE products SET name=$1 WHERE id=$2 RETURNING id, name",
        [name, id]
      );
      return res.status(200).json(rows[0]);
    }

    res.setHeader("Allow", "GET, POST, PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
