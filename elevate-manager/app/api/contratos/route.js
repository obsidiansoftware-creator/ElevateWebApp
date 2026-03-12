import { pool } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id,
        c.numero,
        c.total,
        c.estado,
        c.firma_cliente,
        cl.razon_social AS cliente_nombre
      FROM contratos c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      ORDER BY c.creado_en DESC
    `)

    return NextResponse.json(rows)

  } catch (error) {
    console.error("Error obteniendo contratos:", error)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}