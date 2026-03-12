import { pool } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { id, estado } = await req.json()

    if (!id || !estado) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      )
    }

    const estadosValidos = ["PENDIENTE", "FIRMADO", "ACTIVO", "CANCELADO"]

    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      )
    }

    await pool.query(
      `
      UPDATE contratos
      SET estado = ?
      WHERE id = ?
      `,
      [estado, id]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error cambiando estado:", error)
    return NextResponse.json(
      { error: "Error al cambiar estado" },
      { status: 500 }
    )
  }
}