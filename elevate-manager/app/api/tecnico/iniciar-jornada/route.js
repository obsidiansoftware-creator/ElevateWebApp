// ─── Verifica Face ID antes de iniciar jornada
// ─── Retorna actividades del día

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function POST(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "tecnico") {
      return Response.json({ error: "No permitido" }, { status: 403 })
    }

    // Obtener body
    const body = await req.json().catch(() => ({}))
    const { faceDescriptor } = body

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return Response.json(
        {
          error: "face_required",
          message: "Se requiere verificación facial",
        },
        { status: 400 }
      )
    }

    // Obtener descriptor guardado
    const [rows] = await pool.execute(
      `SELECT face_descriptor 
       FROM usuarios 
       WHERE id = ? 
       LIMIT 1`,
      [user.id]
    )

    const tecnico = rows[0]

    if (!tecnico || !tecnico.face_descriptor) {
      return Response.json(
        {
          error: "face_not_enrolled",
          message:
            "No tienes Face ID registrado. Contacta al administrador.",
        },
        { status: 400 }
      )
    }

    // Comparar descriptores
    const stored = JSON.parse(tecnico.face_descriptor)
    const received = faceDescriptor

    if (stored.length !== received.length) {
      return Response.json(
        {
          error: "face_mismatch",
          message: "Verificación facial fallida",
        },
        { status: 401 }
      )
    }

    // Distancia euclidiana
    const distance = Math.sqrt(
      stored.reduce((sum, val, i) => {
        return sum + Math.pow(val - received[i], 2)
      }, 0)
    )

    // Umbral típico
    if (distance > 0.6) {
      return Response.json(
        {
          error: "face_mismatch",
          message: "Rostro no reconocido. Intenta de nuevo.",
        },
        { status: 401 }
      )
    }

    // Verificar jornada activa
    const [activas] = await pool.execute(
      `SELECT id 
       FROM jornadas 
       WHERE tecnico_id = ? AND activa = true 
       LIMIT 1`,
      [user.id]
    )

    if (activas.length > 0) {
      return Response.json(
        {
          error: "already_active",
          message: "Ya tienes una jornada activa",
        },
        { status: 400 }
      )
    }

    // Crear jornada
    const [result] = await pool.execute(
      `INSERT INTO jornadas (tecnico_id) VALUES (?)`,
      [user.id]
    )

    // Obtener actividades del día
    const [actividades] = await pool.execute(
      `SELECT 
        a.id, 
        a.titulo, 
        a.descripcion, 
        a.lat, 
        a.lng, 
        a.direccion,
        a.prioridad, 
        a.tipo, 
        a.cliente_nombre,
        v.llegada_confirmada, 
        v.id AS visita_id
       FROM actividades a
       LEFT JOIN visitas v 
         ON v.actividad_id = a.id 
         AND v.tecnico_id = ?
       WHERE a.tecnico_asignado_id = ?
         AND DATE(a.fecha_programada) = CURDATE()
         AND a.completada = false
       ORDER BY a.prioridad ASC`,
      [user.id, user.id]
    )

    return Response.json({
      ok: true,
      jornadaId: result.insertId,
      actividades: actividades,
    })

  } catch (error) {
    console.error("iniciar-jornada error:", error)

    return Response.json(
      { error: "Error al iniciar jornada" },
      { status: 500 }
    )
  }
}