import { query } from "./_db.js"; // Asegúrate de usar la ruta correcta y .js en ESM

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  try {
    // Consulta simple para encontrar el usuario
    const { rows } = await query(
      "SELECT id, name, password FROM users WHERE name = $1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const user = rows[0];

    // Aquí podrías usar bcrypt si las contraseñas están hasheadas
    if (user.password !== password) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Respuesta exitosa (podrías generar un JWT aquí)
    return res.status(200).json({
      message: "Login exitoso",
      user: { id: user.id, name: user.name }
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
