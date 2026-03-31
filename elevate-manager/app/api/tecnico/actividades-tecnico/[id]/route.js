// app/api/actividades-tecnicos/[id]/route.js
// PUT    → editar actividad
// DELETE → soft delete

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

// ─────────────────────────────────────────────
// PUT → ACTUALIZAR ACTIVIDAD
// ─────────────────────────────────────────────
export async function PUT(req, { params }) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "cliente" && user.rol !== "admin") {
      return Response.json({ error: "No permitido" }, { status: 403 })
    }

    const id = Number(params.id)

    if (!id) {
      return Response.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await req.json()

    const {
      titulo,
      descripcion,
      tecnico_id,
      proyecto_id,
      fecha_programada,
      hora_inicio,
      hora_fin,
      lat,
      lng,
      direccion,
      cliente_nombre,
      prioridad,
      tipo,
      completada,
      notas,
    } = body

    // Validaciones mínimas
    if (!titulo || !tecnico_id || !fecha_programada) {
      return Response.json(
        { error: "titulo, tecnico_id y fecha_programada son obligatorios" },
        { status: 400 }
      )
    }

    await pool.execute(
      `UPDATE actividades_tecnicos SET
         titulo=?, descripcion=?, tecnico_id=?, proyecto_id=?,
         fecha_programada=?, hora_inicio=?, hora_fin=?,
         lat=?, lng=?, direccion=?, cliente_nombre=?,
         prioridad=?, tipo=?, completada=?, notas=?,
         updated_at=NOW()
       WHERE id=? AND cliente_id=? AND deleted_at IS NULL`,
      [
        titulo,
        descripcion || null,
        tecnico_id,
        proyecto_id || null,
        fecha_programada,
        hora_inicio || null,
        hora_fin || null,
        lat || null,
        lng || null,
        direccion || null,
        cliente_nombre || null,
        prioridad || 3,
        tipo || "mantenimiento",
        completada ? 1 : 0,
        notas || null,
        id,
        user.id,
      ]
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("PUT actividad error:", error)

    return Response.json(
      { error: "Error al actualizar actividad" },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────
// DELETE → SOFT DELETE
// ─────────────────────────────────────────────
export async function DELETE(_req, { params }) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "cliente" && user.rol !== "admin") {
      return Response.json({ error: "No permitido" }, { status: 403 })
    }

    const id = Number(params.id)

    if (!id) {
      return Response.json({ error: "ID inválido" }, { status: 400 })
    }

    await pool.execute(
      `UPDATE actividades_tecnicos
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = ? AND cliente_id = ?`,
      [id, user.id]
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE actividad error:", error)

    return Response.json(
      { error: "Error al eliminar actividad" },
      { status: 500 }
    )
  }
}