import { pool } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const body = await req.json()

    const cookieStore = await cookies()       // 🔹 Espera a que se resuelvan las cookies
    const token = cookieStore.get('token')?.value


    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id

    const {
      razon_social,
      nombre_contacto,
      direccion,
      telefono,
      email,
      rfc,
      tipo_proveedor,
      banco,
      cuenta_bancaria,
      clabe,
      notas,
      servicios
    } = body

    if (!razon_social) {
      return new Response(JSON.stringify({ success: false, error: 'razon_social es obligatorio' }), { status: 400 })
    }

    const [result] = await pool.query(
      `INSERT INTO proveedores
      (razon_social, nombre_contacto, direccion, telefono, email, rfc, tipo_proveedor, banco, cuenta_bancaria, clabe, notas, estatus, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        razon_social,
        nombre_contacto || null,
        direccion || null,
        telefono || null,
        email || null,
        rfc || null,
        tipo_proveedor || null,
        banco || null,
        cuenta_bancaria || null,
        clabe || null,
        notas || null,
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
