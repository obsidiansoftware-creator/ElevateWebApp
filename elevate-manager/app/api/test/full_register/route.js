export const runtime = 'nodejs'

import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  const connection = await pool.getConnection()

  try {
    const body = await req.json()

    const {
      email,
      password,
      razon_social,
      nombre_contacto,
      tipo_cliente,
      telefono,
      telefono_secundario,
      email_cliente,
      email_facturacion,
      direccion,
      rfc,
      notas
    } = body

    // =========================
    // VALIDACIÓN
    // =========================
    if (!email || !password || !razon_social || !tipo_cliente) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos obligatorios'
      }), { status: 400 })
    }

    await connection.beginTransaction()

    // =========================
    // 1. VALIDAR EMAIL ÚNICO
    // =========================
    const [existing] = await connection.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      await connection.rollback()
      return new Response(JSON.stringify({
        success: false,
        error: 'El email ya existe'
      }), { status: 400 })
    }

    // =========================
    // 2. CREAR USUARIO
    // =========================
    const passwordHash = await bcrypt.hash(password, 10)

    const [userResult] = await connection.query(
      `INSERT INTO usuarios (email, password_hash, rol, estatus)
       VALUES (?, ?, 'cliente', 'activo')`,
      [email, passwordHash]
    )

    const userId = userResult.insertId

    // =========================
    // 3. CREAR CLIENTE (TU TABLA REAL)
    // =========================
    const [clienteResult] = await connection.query(
      `INSERT INTO clientes (
        razon_social,
        nombre_contacto,
        tipo_cliente,
        telefono,
        telefono_secundario,
        email,
        email_facturacion,
        direccion,
        rfc,
        estatus,
        notas,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, ?)`,
      [
        razon_social,
        nombre_contacto || null,
        tipo_cliente,
        telefono || null,
        telefono_secundario || null,
        email_cliente || null,
        email_facturacion || null,
        direccion || null,
        rfc || null,
        notas || null,
        userId
      ]
    )

    const clienteId = clienteResult.insertId

    // =========================
    // 4. RELACIONAR
    // =========================
    await connection.query(
      `INSERT INTO usuario_entidad (usuario_id, cliente_id)
       VALUES (?, ?)`,
      [userId, clienteId]
    )

    await connection.commit()

    return new Response(JSON.stringify({
      success: true,
      message: 'Usuario y cliente creados correctamente',
      data: {
        usuario_id: userId,
        cliente_id: clienteId
      }
    }), { status: 201 })

  } catch (error) {
    await connection.rollback()

    console.error('ERROR:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 })

  } finally {
    connection.release()
  }
}