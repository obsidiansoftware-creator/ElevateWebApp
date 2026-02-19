export const runtime = 'nodejs'

import { pool } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

/* ===================== GEOCODE ===================== */
async function geocodeAddress(address) {
  if (!address) return { lat: null, lng: null }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )

    const data = await res.json()

    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }

    return { lat: null, lng: null }
  } catch (error) {
    console.error('Error geocoding:', error)
    return { lat: null, lng: null }
  }
}

/* ===================== GET PROYECTOS ===================== */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return Response.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id

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
        p.proveedor_id,
        c.razon_social AS cliente_nombre
      FROM proyectos p
      LEFT JOIN clientes_finales c 
        ON p.cliente_final_id = c.id
      WHERE p.created_by = ?
      ORDER BY p.id DESC
      `,
      [userId]
    )

    return Response.json({
      success: true,
      data: rows
    })

  } catch (error) {
    console.error('ERROR GET PROYECTOS:', error)

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/* ===================== POST PROYECTO ===================== */
export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return Response.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id

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

    if (!nombre) {
      return Response.json(
        { success: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    const { lat, lng } = await geocodeAddress(ubicacion)

    const [result] = await pool.query(
      `
      INSERT INTO proyectos
      (nombre, cliente_final_id, proveedor_id, direccion_obra,
       fecha_inicio, fecha_fin_estimada, notas,
       lat, lng, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre,
        clienteId || null,
        proveedorId || null,
        ubicacion || null,
        fechaInicio || null,
        fechaEntrega || null,
        descripcion || null,
        lat,
        lng,
        userId
      ]
    )

    return Response.json({
      success: true,
      id: result.insertId
    })

  } catch (error) {
    console.error('ERROR POST PROYECTO:', error)

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
