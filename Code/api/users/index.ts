import { query } from "../_db.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const { rows } = await query("SELECT id, name, role FROM users ORDER BY name");
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { name, password, role = 2 } = req.body ?? {};
      if (!name || !password) return res.status(400).json({ error: "name y password requeridos" });
      const { rows } = await query(
        "INSERT INTO users (name, password, role) VALUES ($1,$2,$3) RETURNING id, name, role",
        [name, password, role]
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, name, password, role } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id requerido" });

      // build dinámico simple
      const fields: string[] = [];
      const values: any[] = [];
      let i = 1;
      if (name) { fields.push(`name=$${i++}`); values.push(name); }
      if (password) { fields.push(`password=$${i++}`); values.push(password); }
      if (role) { fields.push(`role=$${i++}`); values.push(role); }
      if (!fields.length) return res.status(400).json({ error: "Nada para actualizar" });

      values.push(id);
      const sql = `UPDATE users SET ${fields.join(", ")} WHERE id=$${i} RETURNING id, name, role`;
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
