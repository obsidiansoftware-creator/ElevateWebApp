export const runtime = 'nodejs'
import { pool } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return Response.json({ success: false }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id

    const [rows] = await pool.query(
      `SELECT id, razon_social 
       FROM clientes 
       WHERE created_by = ?`,
      [userId]
    )

    return Response.json({ success: true, data: rows })

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


/* ===================== POST CLIENTE ===================== */
export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), { status: 401 })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id
    const userRol = decoded.rol

    if (!['admin', 'cliente'].includes(userRol)) {
      return new Response(JSON.stringify({ success: false, error: 'No tienes permisos para crear clientes finales' }), { status: 403 })
    }

    const body = await req.json()
    const { nombre, contacto, tipo, telefono, correo, ubicacion, rfc } = body
    if (!nombre || !tipo) return new Response(JSON.stringify({ success: false, error: "'nombre' y 'tipo' son obligatorios" }), { status: 400 })

    // Obtener el cliente padre automáticamente desde usuario_entidad
    const [rows] = await pool.query(
      'SELECT cliente_id FROM usuario_entidad WHERE usuario_id = ?',
      [userId]
    )

    if (rows.length === 0 || !rows[0].cliente_id) {
      return new Response(JSON.stringify({ success: false, error: 'Usuario no tiene cliente asignado' }), { status: 400 })
    }

    const clienteIdNumber = rows[0].cliente_id

    // Insertar cliente final
    const [result] = await pool.query(
      `INSERT INTO clientes_finales
       (cliente_id, razon_social, nombre_contacto, tipo_cliente, telefono, email, direccion, rfc, estatus, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clienteIdNumber,
        nombre,
        contacto || null,
        tipo || 'persona_fisica',
        telefono || null,
        correo || null,
        ubicacion || null,
        rfc || null,
        'activo',
        userId
      ]
    )

    return new Response(JSON.stringify({ success: true, id: result.insertId }), { status: 201 })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 })
  }
}

