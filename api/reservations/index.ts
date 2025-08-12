import { tx } from "../_db";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const out = await tx(async (q: any) => {
      const r = await q(
        "SELECT id, client_name, phone, status, created_at FROM reservations ORDER BY created_at DESC LIMIT 100"
      );
      return r.rows;
    });
    return res.status(200).json(out);
  }

  if (req.method === "POST") {
    const { campaign_id, user_id, client_name, phone, status, items } = req.body ?? {};
    if (!client_name || !phone || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "client_name, phone e items[] requeridos" });
    }

    const created = await tx(async (q: any) => {
      const ins = await q(
        `INSERT INTO reservations (campaign_id, user_id, client_name, phone, status)
         VALUES ($1,$2,$3,$4,COALESCE($5,'pendiente')) RETURNING id`,
        [campaign_id ?? null, user_id ?? null, client_name, phone, status ?? null]
      );
      const reservationId = ins.rows[0].id as string;

      for (const it of items) {
        if (!it.product_type_id || !it.quantity) throw new Error("item inválido");
        await q(
          `INSERT INTO reservation_items (reservation_id, product_type_id, quantity)
           VALUES ($1,$2,$3)`,
          [reservationId, it.product_type_id, it.quantity]
        );
      }
      return { id: reservationId };
    });

    return res.status(201).json(created);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method Not Allowed" });
}

