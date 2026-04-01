// app/api/tecnico/route.js

// NOTA: Si tu tabla usuarios NO tiene columna 'nombre', ejecuta primero:
// ALTER TABLE usuarios ADD COLUMN nombre VARCHAR(200) DEFAULT NULL AFTER id;
// ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(30) DEFAULT NULL;
// ALTER TABLE usuarios ADD COLUMN face_enrollado BOOLEAN NOT NULL DEFAULT false;
// ALTER TABLE usuarios ADD COLUMN face_descriptor JSON DEFAULT NULL;

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

// ─────────────────────────────────────────────
// GET → Obtener técnicos
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
      SELECT
        id,
        COALESCE(nombre, SUBSTRING_INDEX(email, '@', 1)) AS nombre,
        email,
        telefono,
        estatus,
        COALESCE(face_enrollado, false) AS face_enrollado,
        ultimo_login,
        created_at,
        deleted_at
      FROM usuarios
      WHERE rol = 'tecnico'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `)

    return Response.json({ success: true, data: rows })

  } catch (e) {
    console.error("GET tecnicos error:", e)
    return Response.json(
      { error: "Error al obtener técnicos", detail: e.message },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────
// POST → Crear técnico
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
      `SELECT id FROM usuarios WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email]
    )

    if (existing.length > 0) {
      return Response.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      )
    }

    const hash = await bcrypt.hash(password, 12)

    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, estatus, face_enrollado)
       VALUES (?, ?, ?, 'tecnico', ?, 'activo', false)`,
      [nombre, email, hash, telefono || null]
    )

    return Response.json({
      success: true,
      id: result.insertId
    })

  } catch (e) {
    console.error("POST tecnico error:", e)
    return Response.json(
      { error: "Error al crear técnico", detail: e.message },
      { status: 500 }
    )
  }
}