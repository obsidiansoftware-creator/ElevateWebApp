import { pool } from "@/lib/db"
import { calcularDistancia } from "@/lib/geo"
import { getUserFromToken } from "@/lib/auth"

export async function POST(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    const { lat, lng } = await req.json()

    const [jornadas] = await pool.execute(
      `SELECT id FROM jornadas
       WHERE tecnico_id = ?
       AND activa = true
       LIMIT 1`,
      [user.id]
    )

    if (!jornadas.length) {
      return Response.json({ error: "Sin jornada activa" }, { status: 400 })
    }

    const jornada_id = jornadas[0].id

    await pool.execute(
      `INSERT INTO ubicaciones (tecnico_id, jornada_id, lat, lng)
       VALUES (?, ?, ?, ?)`,
      [user.id, jornada_id, lat, lng]
    )

    const [visitas] = await pool.execute(
      `SELECT * FROM visitas
       WHERE tecnico_id = ?
       AND llegada_confirmada = false`,
      [user.id]
    )

    for (const visita of visitas) {
      const distancia = calcularDistancia(
        lat,
        lng,
        visita.obra_lat,
        visita.obra_lng
      )

      if (distancia < 50) {
        await pool.execute(
          `UPDATE visitas
           SET llegada_confirmada = true,
               fecha_llegada = NOW()
           WHERE id = ?`,
          [visita.id]
        )
      }
    }

    return Response.json({ ok: true })

  } catch (error) {
    console.error(error)
    return Response.json({ error: "Error guardando ubicación" }, { status: 500 })
  }
}