// app/api/tecnico/enrollar-face/route.js
// POST → registra el descriptor facial del técnico en su perfil
// DELETE → elimina el Face ID (solo admin o cliente)

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

// ─────────────────────────────────────────────
// POST → ENROLLAR FACE ID
// ─────────────────────────────────────────────
export async function POST(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "tecnico") {
      return Response.json(
        { error: "Solo técnicos pueden registrar Face ID" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { faceDescriptor } = body

    // Validación más robusta
    if (
      !faceDescriptor ||
      !Array.isArray(faceDescriptor) ||
      faceDescriptor.length < 64
    ) {
      return Response.json(
        { error: "Descriptor facial inválido" },
        { status: 400 }
      )
    }

    // Verificar si ya tiene uno registrado
    const [rows] = await pool.execute(
      `SELECT face_enrollado FROM usuarios WHERE id = ? LIMIT 1`,
      [user.id]
    )

    const tecnico = rows[0]

    if (tecnico && tecnico.face_enrollado) {
      return Response.json(
        {
          error:
            "Ya tienes un Face ID registrado. Contacta al administrador para reemplazarlo.",
        },
        { status: 409 }
      )
    }

    // Guardar descriptor
    await pool.execute(
      `UPDATE usuarios 
       SET face_descriptor = ?, face_enrollado = true, updated_at = NOW() 
       WHERE id = ?`,
      [JSON.stringify(faceDescriptor), user.id]
    )

    return Response.json({
      ok: true,
      message: "Face ID registrado correctamente",
    })
  } catch (error) {
    console.error("enrollar-face error:", error)

    return Response.json(
      { error: "Error al registrar Face ID" },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────
// DELETE → ELIMINAR FACE ID
// ─────────────────────────────────────────────
export async function DELETE(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "cliente" && user.rol !== "admin") {
      return Response.json({ error: "No permitido" }, { status: 403 })
    }

    const body = await req.json()
    const { tecnico_id } = body

    if (!tecnico_id) {
      return Response.json(
        { error: "tecnico_id requerido" },
        { status: 400 }
      )
    }

    await pool.execute(
      `UPDATE usuarios 
       SET face_descriptor = NULL, face_enrollado = false, updated_at = NOW()
       WHERE id = ? AND rol = 'tecnico'`,
      [tecnico_id]
    )

    return Response.json({ ok: true })
  } catch (error) {
    console.error("delete-face error:", error)

    return Response.json(
      { error: "Error al eliminar Face ID" },
      { status: 500 }
    )
  }
}