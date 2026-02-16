import { pool } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      nombre,
      ubicacion,
      clienteId,
      contacto,
      fechaInicio,
      fechaEntrega,
      descripcion,
      tipo,
      proveedorId
    } = body

    const cookieStore = await cookies() // ✅ AQUÍ VA EL AWAIT
    const token = cookieStore.get('token')?.value

    if (!token) {
      return Response.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id

    const [result] = await pool.query(
      `INSERT INTO proyectos
      (nombre, cliente_id, proveedor_id, direccion_obra, fecha_inicio, fecha_fin_estimada, notas, tipo, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        clienteId || null,
        proveedorId || null,
        ubicacion || null,
        fechaInicio || null,
        fechaEntrega || null,
        descripcion || null,
        tipo || 'Instalación',
        userId
      ]
    )

    return Response.json({
      success: true,
      id: result.insertId
    })

  } catch (error) {
    console.error(error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
