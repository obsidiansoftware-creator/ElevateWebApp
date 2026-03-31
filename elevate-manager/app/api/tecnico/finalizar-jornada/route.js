// ─── Finaliza jornada y limpia posición en tiempo real

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    // Finalizar jornada activa
    await pool.execute(
      `UPDATE jornadas 
       SET activa = false, fecha_fin = NOW()
       WHERE tecnico_id = ? AND activa = true`,
      [user.id]
    )

    // Eliminar posición en tiempo real
    await pool.execute(
      `DELETE FROM tecnicos_posicion 
       WHERE tecnico_id = ?`,
      [user.id]
    )

    return Response.json({ ok: true })

  } catch (error) {
    console.error("finalizar-jornada error:", error)

    return Response.json(
      { error: "Error al finalizar jornada" },
      { status: 500 }
    )
  }
}