// app/api/actividades-tecnicos/route.js

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

// =======================
// GET → listar actividades
// =======================
export async function GET(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tecnicoId = searchParams.get("tecnico_id")
    const fecha = searchParams.get("fecha")

    let query = `
      SELECT 
        at.*,
        u.nombre AS tecnico_nombre,
        u.email AS tecnico_email,
        p.nombre AS proyecto_nombre
      FROM actividades_tecnicos at
      LEFT JOIN usuarios u ON u.id = at.tecnico_id
      LEFT JOIN proyectos p ON p.id = at.proyecto_id
      WHERE at.deleted_at IS NULL
        AND at.cliente_id = ?
    `

    const params = [user.id]

    if (tecnicoId) {
      query += ` AND at.tecnico_id = ?`
      params.push(Number(tecnicoId))
    }

    if (fecha) {
      query += ` AND at.fecha_programada = ?`
      params.push(fecha)
    }

    query += `
      ORDER BY 
        at.fecha_programada ASC,
        at.prioridad ASC
    `

    const [rows] = await pool.execute(query, params)

    return Response.json({
      success: true,
      data: rows
    })
  } catch (error) {
    console.error("GET actividades error:", error)

    return Response.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    )
  }
}

// =======================
// POST → crear actividad
// =======================
export async function POST(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    if (user.rol !== "cliente" && user.rol !== "admin") {
      return Response.json({ error: "No permitido" }, { status: 403 })
    }

    const body = await req.json()

    const {
      titulo,
      descripcion,
      tecnico_id,
      proyecto_id,
      fecha_programada,
      hora_inicio,
      hora_fin,
      lat,
      lng,
      direccion,
      cliente_nombre,
      prioridad,
      tipo,
      notas
    } = body

    // Validación mínima
    if (!titulo || !tecnico_id || !fecha_programada) {
      return Response.json(
        {
          error: "titulo, tecnico_id y fecha_programada son obligatorios"
        },
        { status: 400 }
      )
    }

    // =======================
    // Autofill desde proyecto
    // =======================
    let finalLat = lat || null
    let finalLng = lng || null
    let finalDir = direccion || null
    let finalCliente = cliente_nombre || null

    if (proyecto_id && (!finalLat || !finalLng)) {
      const [prows] = await pool.execute(
        `
        SELECT lat, lng, ubicacion, cliente 
        FROM proyectos 
        WHERE id = ? 
        LIMIT 1
        `,
        [proyecto_id]
      )

      const proyecto = prows?.[0]

      if (proyecto) {
        if (!finalLat) finalLat = proyecto.lat
        if (!finalLng) finalLng = proyecto.lng
        if (!finalDir) finalDir = proyecto.ubicacion
        if (!finalCliente) finalCliente = proyecto.cliente
      }
    }

    // =======================
    // Insert
    // =======================
    const [result] = await pool.execute(
      `
      INSERT INTO actividades_tecnicos
      (
        titulo,
        descripcion,
        tecnico_id,
        cliente_id,
        proyecto_id,
        fecha_programada,
        hora_inicio,
        hora_fin,
        lat,
        lng,
        direccion,
        cliente_nombre,
        prioridad,
        tipo,
        notas
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        titulo,
        descripcion || null,
        tecnico_id,
        user.id,
        proyecto_id || null,
        fecha_programada,
        hora_inicio || null,
        hora_fin || null,
        finalLat,
        finalLng,
        finalDir,
        finalCliente,
        prioridad || 3,
        tipo || "mantenimiento",
        notas || null
      ]
    )

    return Response.json({
      success: true,
      id: result.insertId
    })
  } catch (error) {
    console.error("POST actividades error:", error)

    return Response.json(
      { error: "Error al crear actividad" },
      { status: 500 }
    )
  }
}