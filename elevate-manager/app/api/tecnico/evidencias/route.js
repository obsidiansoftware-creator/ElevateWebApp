// ─── Recibe evidencia (foto/video) y la guarda localmente

import { pool } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const MAX_SIZE_MB = 50
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
]

export async function POST(req) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await req.formData()

    const file = formData.get("file")
    const actividad_id = formData.get("actividad_id")
    const nota = formData.get("nota")

    if (!file) {
      return Response.json(
        { error: "No se recibió archivo" },
        { status: 400 }
      )
    }

    if (!actividad_id) {
      return Response.json(
        { error: "actividad_id requerido" },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Tipo no permitido: ${file.type}` },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return Response.json(
        {
          error: `Archivo demasiado grande (máx ${MAX_SIZE_MB}MB)`,
        },
        { status: 400 }
      )
    }

    // Verificar jornada activa
    const [jornadas] = await pool.execute(
      `SELECT id 
       FROM jornadas 
       WHERE tecnico_id = ? AND activa = true 
       LIMIT 1`,
      [user.id]
    )

    if (!jornadas.length) {
      return Response.json(
        { error: "Sin jornada activa" },
        { status: 400 }
      )
    }

    const jornada_id = jornadas[0].id

    // Generar nombre de archivo
    const ext = file.name?.split(".").pop() || "jpg"
    const filename = `ev_${user.id}_${actividad_id}_${Date.now()}.${ext}`

    const dir = path.join(process.cwd(), "public", "evidencias")

    // Crear carpeta si no existe
    await mkdir(dir, { recursive: true })

    // Guardar archivo
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(dir, filename), buffer)

    const url = `/evidencias/${filename}`

    // Guardar en BD
    const [result] = await pool.execute(
      `INSERT INTO evidencias 
       (tecnico_id, actividad_id, jornada_id, url, tipo, nota)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        Number(actividad_id),
        jornada_id,
        url,
        file.type.startsWith("video") ? "video" : "foto",
        nota || null,
      ]
    )

    return Response.json({
      ok: true,
      url,
      id: result.insertId,
    })

  } catch (error) {
    console.error("evidencia error:", error)

    return Response.json(
      { error: "Error al subir evidencia" },
      { status: 500 }
    )
  }
}