import { query } from "./_db.js";

export default async function handler(_req: any, res: any) {
  try {
    const { rows } = await query("select now() as now");
    res.status(200).json({ ok: true, now: rows?.[0]?.now });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
