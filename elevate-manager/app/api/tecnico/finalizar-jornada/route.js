import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    await pool.execute(
      `UPDATE jornadas
       SET activa = false,
           fecha_fin = NOW()
       WHERE tecnico_id = ?
       AND activa = true`,
      [user.id]
    )

    return Response.json({ ok: true })

  } catch (error) {
    console.error(error)
    return Response.json({ error: "Error al finalizar jornada" }, { status: 500 })
  }
}