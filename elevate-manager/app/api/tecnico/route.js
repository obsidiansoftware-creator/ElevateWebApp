// app/api/tecnicos/route.js
// GET  → lista técnicos
// POST → crea nuevo técnico

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

// ─────────────────────────────────────────────
// GET → LISTAR TÉCNICOS
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "cliente" && user.rol !== "admin") {
      return Response.json({ error: "No permitido" }, { status: 403 })
    }

    const [rows] = await pool.execute(`
      SELECT id, nombre, email, telefono, estatus, face_enrollado,
             ultimo_login, created_at, deleted_at
      FROM usuarios
      WHERE rol = 'tecnico'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `)

    return Response.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error("GET tecnicos error:", error)

    return Response.json(
      { error: "Error al obtener técnicos" },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────
// POST → CREAR TÉCNICO
// ─────────────────────────────────────────────
export async function POST(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "cliente" && user.rol !== "admin") {
      return Response.json(
        { error: "Solo los clientes pueden agregar técnicos" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { nombre, email, password, telefono } = body

    if (!nombre || !email || !password) {
      return Response.json(
        { error: "nombre, email y password son obligatorios" },
        { status: 400 }
      )
    }

    // Verificar email único
    const [existing] = await pool.execute(
      `SELECT id FROM usuarios WHERE email = ? LIMIT 1`,
      [email]
    )

    if (existing.length > 0) {
      return Response.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      )
    }

    // Hash de contraseña
    const hash = await bcrypt.hash(password, 12)

    // Insertar técnico
    const [result] = await pool.execute(
      `INSERT INTO usuarios 
       (nombre, email, password_hash, rol, telefono, estatus)
       VALUES (?, ?, ?, 'tecnico', ?, 'activo')`,
      [nombre, email, hash, telefono || null]
    )

    return Response.json({
      success: true,
      id: result.insertId,
    })
  } catch (error) {
    console.error("POST tecnicos error:", error)

    return Response.json(
      { error: "Error al crear técnico" },
      { status: 500 }
    )
  }
}