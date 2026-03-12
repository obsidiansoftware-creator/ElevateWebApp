import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "tecnico") {
      return Response.json({ error: "No permitido" }, { status: 403 })
    }

    const [result] = await pool.execute(
      `INSERT INTO jornadas (tecnico_id)
       VALUES (?)`,
      [user.id]
    )

    return Response.json({
      ok: true,
      jornadaId: result.insertId
    })

  } catch (error) {
    console.error(error)
    return Response.json({ error: "Error al iniciar jornada" }, { status: 500 })
  }
}