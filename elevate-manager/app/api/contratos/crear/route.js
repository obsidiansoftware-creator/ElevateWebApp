import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { cotizacionId } = await req.json()

    const [cotizacionRows] = await db.query(
      "SELECT * FROM cotizaciones WHERE id = ?",
      [cotizacionId]
    )

    if (cotizacionRows.length === 0) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    const cotizacion = cotizacionRows[0]
    const numeroContrato = `CTR-${Date.now()}`

    await db.query(
      `INSERT INTO contratos 
      (numero, cliente_id, proyecto_id, cotizacion_id, total) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        numeroContrato,
        cotizacion.cliente_id,
        cotizacion.proyecto_id,
        cotizacion.id,
        cotizacion.total,
      ]
    )

    return NextResponse.json({ message: "Contrato creado", numero: numeroContrato })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}