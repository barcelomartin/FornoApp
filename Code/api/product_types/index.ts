import { query } from "../_db.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      // devolvemos todos; el filtro por producto lo hace el frontend
      const { rows } = await query(
        "SELECT id, product_id, name FROM product_types ORDER BY name"
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { product_id, name } = req.body ?? {};
      if (!product_id || !name) return res.status(400).json({ error: "product_id y name requeridos" });
      const { rows } = await query(
        "INSERT INTO product_types (product_id, name) VALUES ($1,$2) RETURNING id, product_id, name",
        [product_id, name]
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, name, product_id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id requerido" });
      const fields: string[] = [];
      const values: any[] = [];
      let i = 1;
      if (name) { fields.push(`name=$${i++}`); values.push(name); }
      if (product_id) { fields.push(`product_id=$${i++}`); values.push(product_id); }
      if (!fields.length) return res.status(400).json({ error: "Nada para actualizar" });
      values.push(id);
      const sql = `UPDATE product_types SET ${fields.join(", ")} WHERE id=$${i} RETURNING id, product_id, name`;
      const { rows } = await query(sql, values);
      return res.status(200).json(rows[0]);
    }

    res.setHeader("Allow", "GET, POST, PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
