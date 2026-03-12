import { pool } from "@/lib/db"

export async function GET() {
  try {

    const [rows] = await pool.execute(`
      SELECT 
        u.tecnico_id,
        u.lat,
        u.lng
      FROM ubicaciones u
      INNER JOIN (
        SELECT tecnico_id, MAX(id) as ultima
        FROM ubicaciones
        GROUP BY tecnico_id
      ) t
      ON u.id = t.ultima
    `)

    return Response.json(rows)

  } catch (error) {
    console.error(error)

    return Response.json(
      { error: "Error obteniendo ubicaciones" },
      { status: 500 }
    )
  }
}