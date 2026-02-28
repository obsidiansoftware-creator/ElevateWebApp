import { pool } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { contratoId, firma } = await req.json()

    await pool.query(
      `UPDATE contratos 
       SET firma_cliente = ?, 
           firmado_en = NOW(), 
           estado = 'FIRMADO'
       WHERE id = ?`,
      [firma, contratoId]
    )

    return NextResponse.json({ message: "Contrato firmado" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}