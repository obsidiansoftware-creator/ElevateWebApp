export const runtime = 'nodejs'

import { pool } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

/* ===================== AUTH ===================== */
async function getUserId() {
  const cookieStore = await cookies() // 🔥 FIX AQUÍ
  const token = cookieStore.get('token')?.value

  if (!token) {
    throw new Error('No autorizado')
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  if (!decoded?.id) {
    throw new Error('Token inválido')
  }

  return decoded.id
}

/* ===================== GET ===================== */
export async function GET() {
  try {
    const userId = await getUserId()

    const [rows] = await pool.query(
      `
      SELECT 
        p.id,
        p.nombre,
        p.direccion_obra,
        p.lat,
        p.lng,
        p.fecha_inicio,
        p.fecha_fin_estimada,
        p.notas,
        p.cliente_final_id,
        p.proveedor_id
      FROM proyectos p
      WHERE p.created_by = ?
      AND p.deleted_at IS NULL
      ORDER BY p.id DESC
      `,
      [userId]
    )

    return Response.json({ success: true, data: rows })

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 401 }
    )
  }
}

/* ===================== POST ===================== */
export async function POST(req) {
  try {
    const userId = await getUserId()
    const body = await req.json()

    const {
      nombre,
      ubicacion,
      clienteId,
      fechaInicio,
      fechaEntrega,
      descripcion,
      proveedorId
    } = body

    const [result] = await pool.query(
      `
      INSERT INTO proyectos
      (nombre, cliente_final_id, proveedor_id, direccion_obra,
       fecha_inicio, fecha_fin_estimada, notas,
       created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre,
        clienteId || null,
        proveedorId || null,
        ubicacion || null,
        fechaInicio || null,
        fechaEntrega || null,
        descripcion || null,
        userId
      ]
    )

    return Response.json({
      success: true,
      id: result.insertId
    })

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/* ===================== PUT ===================== */
export async function PUT(req) {
  try {
    const userId = await getUserId()
    const body = await req.json()

    const {
      id,
      nombre,
      ubicacion,
      clienteId,
      fechaInicio,
      fechaEntrega,
      descripcion,
      proveedorId
    } = body

    await pool.query(
      `
      UPDATE proyectos
      SET nombre = ?,
          cliente_final_id = ?,
          proveedor_id = ?,
          direccion_obra = ?,
          fecha_inicio = ?,
          fecha_fin_estimada = ?,
          notas = ?
      WHERE id = ?
      AND created_by = ?
      AND deleted_at IS NULL
      `,
      [
        nombre,
        clienteId || null,
        proveedorId || null,
        ubicacion || null,
        fechaInicio || null,
        fechaEntrega || null,
        descripcion || null,
        id,
        userId
      ]
    )

    return Response.json({ success: true })

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/* ===================== DELETE (SOFT DELETE) ===================== */
export async function DELETE(req) {
  try {
    const userId = await getUserId()
    const { id } = await req.json()

    await pool.query(
      `
      UPDATE proyectos
      SET deleted_at = NOW()
      WHERE id = ?
      AND created_by = ?
      AND deleted_at IS NULL
      `,
      [id, userId]
    )

    return Response.json({ success: true })

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
