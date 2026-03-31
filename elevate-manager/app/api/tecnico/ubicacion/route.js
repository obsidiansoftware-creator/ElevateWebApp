// ─── OPTIMIZADO: solo guarda si el técnico se movió >20m
// ─── Guarda ruta + posición actual
// ─── Detecta llegada (radio 50m)

import { pool } from "@/lib/db"
import { calcularDistancia } from "@/lib/geo"
import { getUserFromToken } from "@/lib/auth"

export async function POST(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { lat, lng } = body

    if (lat == null || lng == null) {
      return Response.json(
        { error: "Coordenadas inválidas" },
        { status: 400 }
      )
    }

    // 1. Obtener jornada activa
    const [jornadas] = await pool.execute(
      `SELECT id FROM jornadas 
       WHERE tecnico_id = ? AND activa = true 
       LIMIT 1`,
      [user.id]
    )

    if (!jornadas.length) {
      return Response.json(
        { error: "Sin jornada activa" },
        { status: 400 }
      )
    }

    const jornada_id = jornadas[0].id

    // 2. Obtener última ubicación
    const [lastUbicacion] = await pool.execute(
      `SELECT lat, lng FROM ubicaciones
       WHERE tecnico_id = ? AND jornada_id = ?
       ORDER BY created_at DESC 
       LIMIT 1`,
      [user.id, jornada_id]
    )

    const last = lastUbicacion[0]

    // 3. THROTTLE (20m)
    if (last) {
      const distancia = calcularDistancia(
        lat,
        lng,
        Number(last.lat),
        Number(last.lng)
      )

      if (distancia < 20) {
        // Solo actualiza posición actual
        await pool.execute(
          `INSERT INTO tecnicos_posicion (tecnico_id, lat, lng, jornada_id)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             lat = VALUES(lat), 
             lng = VALUES(lng), 
             updated_at = NOW()`,
          [user.id, lat, lng, jornada_id]
        )

        return Response.json({
          ok: true,
          saved: false,
          reason: "throttled",
        })
      }
    }

    // 4. Guardar punto de ruta
    await pool.execute(
      `INSERT INTO ubicaciones (tecnico_id, jornada_id, lat, lng)
       VALUES (?, ?, ?, ?)`,
      [user.id, jornada_id, lat, lng]
    )

    // 5. Actualizar posición actual
    await pool.execute(
      `INSERT INTO tecnicos_posicion (tecnico_id, lat, lng, jornada_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         lat = VALUES(lat),
         lng = VALUES(lng),
         jornada_id = VALUES(jornada_id),
         updated_at = NOW()`,
      [user.id, lat, lng, jornada_id]
    )

    // 6. Verificar llegada a visitas
    const [visitas] = await pool.execute(
      `SELECT v.*, a.lat AS obra_lat, a.lng AS obra_lng
       FROM visitas v
       JOIN actividades a ON v.actividad_id = a.id
       WHERE v.tecnico_id = ? 
       AND v.llegada_confirmada = false`,
      [user.id]
    )

    for (const visita of visitas) {
      const distancia = calcularDistancia(
        lat,
        lng,
        Number(visita.obra_lat),
        Number(visita.obra_lng)
      )

      if (distancia < 50) {
        await pool.execute(
          `UPDATE visitas 
           SET llegada_confirmada = true, fecha_llegada = NOW() 
           WHERE id = ?`,
          [visita.id]
        )
      }
    }

    return Response.json({ ok: true, saved: true })

  } catch (error) {
    console.error("ubicacion error:", error)

    return Response.json(
      { error: "Error guardando ubicación" },
      { status: 500 }
    )
  }
}