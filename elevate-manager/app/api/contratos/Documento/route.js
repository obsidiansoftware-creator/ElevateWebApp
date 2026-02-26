import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { contratoId, nombre, url } = await req.json()

    await db.query(
      `INSERT INTO documentos_contrato (contrato_id, nombre, url)
       VALUES (?, ?, ?)`,
      [contratoId, nombre, url]
    )

    return NextResponse.json({ message: "Documento agregado" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}