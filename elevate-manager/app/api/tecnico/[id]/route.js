// app/api/tecnicos/[id]/route.js
// PUT    → editar técnico
// DELETE → soft delete

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

// ─────────────────────────────────────────────
// PUT → ACTUALIZAR TÉCNICO
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

    const body = await req.json()
    const { nombre, email, telefono, estatus, password } = body

    const id = Number(params.id)

    if (!id) {
      return Response.json({ error: "ID inválido" }, { status: 400 })
    }

    // Si mandan password → se hashea
    if (password) {
      const hash = await bcrypt.hash(password, 12)

      await pool.execute(
        `UPDATE usuarios 
         SET nombre=?, email=?, telefono=?, estatus=?, password_hash=?, updated_at=NOW()
         WHERE id=? AND rol='tecnico' AND deleted_at IS NULL`,
        [nombre, email, telefono || null, estatus, hash, id]
      )
    } else {
      await pool.execute(
        `UPDATE usuarios 
         SET nombre=?, email=?, telefono=?, estatus=?, updated_at=NOW()
         WHERE id=? AND rol='tecnico' AND deleted_at IS NULL`,
        [nombre, email, telefono || null, estatus, id]
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("PUT tecnico error:", error)

    return Response.json(
      { error: "Error al actualizar técnico" },
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

    // Soft delete
    await pool.execute(
      `UPDATE usuarios 
       SET deleted_at = NOW(), estatus = 'inactivo', updated_at = NOW()
       WHERE id = ? AND rol = 'tecnico'`,
      [id]
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE tecnico error:", error)

    return Response.json(
      { error: "Error al eliminar técnico" },
      { status: 500 }
    )
  }
}