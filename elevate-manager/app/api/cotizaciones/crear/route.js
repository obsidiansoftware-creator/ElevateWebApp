import { pool } from "@/lib/db"
import { calcularCosto } from "@/lib/cotizacionCalculator"
import { NextResponse } from "next/server"

export async function POST(req) {
  const data = await req.json()

  const costoBase = calcularCosto(data)
  const precioFinal = costoBase + (costoBase * (data.margen / 100))

  const numero = "COT-" + Date.now()

  await pool.query(
    `INSERT INTO cotizaciones
    (numero, cliente_id, capacidad, paradas, velocidad, tipo, acabados, costo_base, margen, precio_final)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      numero,
      data.cliente_id,
      data.capacidad,
      data.paradas,
      data.velocidad,
      data.tipo,
      data.acabados,
      costoBase,
      data.margen,
      precioFinal,
    ]
  )

  return NextResponse.json({ numero, precioFinal })
}