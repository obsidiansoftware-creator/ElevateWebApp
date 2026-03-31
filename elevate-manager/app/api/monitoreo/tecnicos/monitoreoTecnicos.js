// ─── Retorna técnicos activos con posición, ruta y actividades

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    // 1. Técnicos activos
    const [tecnicos] = await pool.execute(
      `SELECT 
        tp.tecnico_id, 
        tp.lat, 
        tp.lng, 
        tp.updated_at, 
        tp.jornada_id,
        u.nombre, 
        u.email,
        j.fecha_inicio
       FROM tecnicos_posicion tp
       JOIN usuarios u ON u.id = tp.tecnico_id
       JOIN jornadas j ON j.id = tp.jornada_id
       WHERE j.activa = true`
    )

    const result = await Promise.all(
      tecnicos.map(async (t) => {

        // 2. Ruta del día
        const [ruta] = await pool.execute(
          `SELECT lat, lng 
           FROM ubicaciones
           WHERE tecnico_id = ? 
             AND jornada_id = ?
           ORDER BY created_at ASC`,
          [t.tecnico_id, t.jornada_id]
        )

        // 3. Actividades
        const [actividades] = await pool.execute(
          `SELECT 
            a.id, 
            a.titulo, 
            a.descripcion, 
            a.lat, 
            a.lng,
            a.prioridad, 
            a.tipo, 
            a.cliente_nombre, 
            a.direccion,
            v.llegada_confirmada, 
            v.fecha_llegada,
            e.url AS evidencia_url, 
            e.tipo AS evidencia_tipo
           FROM actividades a
           LEFT JOIN visitas v 
             ON v.actividad_id = a.id 
             AND v.tecnico_id = ?
           LEFT JOIN evidencias e 
             ON e.actividad_id = a.id 
             AND e.tecnico_id = ?
           WHERE a.tecnico_asignado_id = ?
             AND DATE(a.fecha_programada) = CURDATE()
           ORDER BY a.prioridad ASC`,
          [t.tecnico_id, t.tecnico_id, t.tecnico_id]
        )

        return {
          tecnico_id: t.tecnico_id,
          nombre: t.nombre,
          lat: Number(t.lat),
          lng: Number(t.lng),
          updated_at: t.updated_at,
          fecha_inicio: t.fecha_inicio,

          ruta: ruta.map((r) => ({
            lat: Number(r.lat),
            lng: Number(r.lng),
          })),

          actividades: actividades,
        }
      })
    )

    return Response.json(result)

  } catch (error) {
    console.error("monitoreo error:", error)

    return Response.json(
      { error: "Error en monitoreo" },
      { status: 500 }
    )
  }
}