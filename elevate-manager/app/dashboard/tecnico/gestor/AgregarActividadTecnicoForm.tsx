"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface Tecnico {
  id: number
  nombre: string
  email: string
  estatus: "activo" | "inactivo" | "bloqueado"
  face_enrollado: boolean
}

export interface Proyecto {
  id: number
  nombre: string
  cliente: string
  ubicacion: string
  lat?: number
  lng?: number
}

export interface Actividad {
  id: number
  titulo: string
  descripcion?: string
  tecnico_id: number
  tecnico_nombre?: string
  proyecto_id?: number
  proyecto_nombre?: string
  fecha_programada: string
  hora_inicio?: string
  hora_fin?: string
  lat?: number
  lng?: number
  direccion?: string
  cliente_nombre?: string
  prioridad: 1 | 2 | 3
  tipo: string
  completada: boolean
  notas?: string
}

interface Props {
  actividad: Actividad | null  // null = crear, Actividad = editar
  tecnicos:  Tecnico[]
  proyectos: Proyecto[]
  onClose:   () => void
  onSaved:   () => void
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const PRIO_CFG = {
  1: { color: "#ff3b5c", label: "ALTA"  },
  2: { color: "#ffb020", label: "MEDIA" },
  3: { color: "#00ffa3", label: "BAJA"  },
}

const TIPO_OPTS = [
  "mantenimiento",
  "instalacion",
  "revision",
  "emergencia",
  "otro",
]

const TIPO_LABELS: Record<string, string> = {
  mantenimiento: "Mantenimiento",
  instalacion:   "Instalación",
  revision:      "Revisión",
  emergencia:    "Emergencia",
  otro:          "Otro",
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AgregarActividadTecnicoForm({
  actividad, tecnicos, proyectos, onClose, onSaved,
}: Props) {
  const isEdit = !!actividad

  const [titulo,        setTitulo]        = useState(actividad?.titulo          || "")
  const [descripcion,   setDescripcion]   = useState(actividad?.descripcion     || "")
  const [tecnicoId,     setTecnicoId]     = useState<number | "">(actividad?.tecnico_id  || "")
  const [proyectoId,    setProyectoId]    = useState<number | "">(actividad?.proyecto_id || "")
  const [fecha,         setFecha]         = useState(actividad?.fecha_programada || "")
  const [horaInicio,    setHoraInicio]    = useState(actividad?.hora_inicio     || "")
  const [horaFin,       setHoraFin]       = useState(actividad?.hora_fin        || "")
  const [direccion,     setDireccion]     = useState(actividad?.direccion       || "")
  const [clienteNombre, setClienteNombre] = useState(actividad?.cliente_nombre  || "")
  const [prioridad,     setPrioridad]     = useState<1 | 2 | 3>(actividad?.prioridad || 3)
  const [tipo,          setTipo]          = useState(actividad?.tipo             || "mantenimiento")
  const [notas,         setNotas]         = useState(actividad?.notas            || "")
  const [completada,    setCompletada]    = useState(actividad?.completada       || false)
  const [focused,       setFocused]       = useState<string | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState("")

  // Cerrar con ESC
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [onClose])

  // Auto-rellenar dirección y cliente desde el proyecto seleccionado
  useEffect(() => {
    if (!proyectoId) return
    const p = proyectos.find(p => p.id === proyectoId)
    if (!p) return
    if (!direccion)     setDireccion(p.ubicacion || "")
    if (!clienteNombre) setClienteNombre(p.cliente || "")
  }, [proyectoId])

  const handleSave = async () => {
    if (!titulo || !tecnicoId || !fecha) {
      setError("Título, técnico y fecha son obligatorios")
      return
    }
    setSaving(true); setError("")
    try {
      const body = {
        titulo,
        descripcion:       descripcion       || null,
        tecnico_id:        tecnicoId,
        proyecto_id:       proyectoId        || null,
        fecha_programada:  fecha,
        hora_inicio:       horaInicio        || null,
        hora_fin:          horaFin           || null,
        direccion:         direccion         || null,
        cliente_nombre:    clienteNombre     || null,
        prioridad,
        tipo,
        notas:             notas             || null,
        completada,
      }
      const res = await fetch(
        isEdit ? `/api/actividades-tecnico/${actividad!.id}` : "/api/actividades-tecnico",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); setSaving(false); return }
      onSaved()
      onClose()
    } catch {
      setError("Error de conexión")
    }
    setSaving(false)
  }

  // ── Campo de texto reutilizable ────────────────────────────────────────────
  const Field = ({
    id, label, value, onChange, type = "text", placeholder,
  }: {
    id: string; label: string; value: string; onChange: (v: string) => void
    type?: string; placeholder?: string
  }) => (
    <div className={`gf-field ${focused === id ? "focused" : ""}`}>
      <label className="gf-label">{label}</label>
      <input
        className="gf-input"
        type={type}
        placeholder={placeholder || label}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
      />
    </div>
  )

  return createPortal(
    <div className="gf-backdrop" onClick={onClose}>
      <div className="gf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>

        {/* Corner decorations */}
        <div className="gf-corner tl" /><div className="gf-corner tr" />
        <div className="gf-corner bl" /><div className="gf-corner br" />

        {/* Header */}
        <div className="gf-header">
          <div>
            <div className="gf-eyebrow">{isEdit ? "Modificar" : "Nueva"} actividad</div>
            <div className="gf-title">
              {isEdit ? "Editar" : "Asignar"}{" "}
              <span style={{ color: "#ffb020" }}>Actividad</span>
            </div>
          </div>
          <button className="gf-close" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body — 2 columnas */}
        <div className="gf-body">
          <div className="gf-cols">

            {/* ── COLUMNA 1 ── */}
            <div>
              <div className="gf-section-label">Información General</div>

              <Field id="tit" label="Título *" value={titulo} onChange={setTitulo} />

              {/* Textarea descripción */}
              <div className={`gf-field ${focused === "desc" ? "focused" : ""}`}>
                <label className="gf-label">Descripción</label>
                <textarea
                  className="gf-textarea"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Descripción de la actividad..."
                  onFocus={() => setFocused("desc")}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div className="gf-section-label" style={{ marginTop: 6 }}>Asignación</div>

              {/* Selector técnico */}
              <div className="gf-field">
                <label className="gf-label">Técnico *</label>
                <div className="gf-select-wrap">
                  <select
                    className="gf-select"
                    value={tecnicoId}
                    onChange={e => setTecnicoId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Selecciona un técnico</option>
                    {tecnicos
                      .filter(t => t.estatus === "activo")
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Selector proyecto */}
              <div className="gf-field">
                <label className="gf-label">Proyecto relacionado</label>
                <div className="gf-select-wrap">
                  <select
                    className="gf-select"
                    value={proyectoId}
                    onChange={e => setProyectoId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Sin proyecto</option>
                    {proyectos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {p.cliente}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox completada — solo al editar */}
              {isEdit && (
                <div className="gf-field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    id="completada"
                    checked={completada}
                    onChange={e => setCompletada(e.target.checked)}
                    style={{ accentColor: "#00ffa3", width: 14, height: 14 }}
                  />
                  <label
                    htmlFor="completada"
                    style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: 9,
                      letterSpacing: ".2em",
                      color: "var(--text2,#5c8fa8)",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Marcar como completada
                  </label>
                </div>
              )}
            </div>

            {/* ── COLUMNA 2 ── */}
            <div>
              <div className="gf-section-label">Fecha y Hora</div>

              <Field id="fec" label="Fecha *" value={fecha} onChange={setFecha} type="date" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field id="hi" label="Hora inicio" value={horaInicio} onChange={setHoraInicio} type="time" />
                <Field id="hf" label="Hora fin"    value={horaFin}    onChange={setHoraFin}    type="time" />
              </div>

              <div className="gf-section-label" style={{ marginTop: 6 }}>Ubicación</div>
              <Field id="dir" label="Dirección"     value={direccion}     onChange={setDireccion} />
              <Field id="cn"  label="Cliente en sitio" value={clienteNombre} onChange={setClienteNombre} />

              <div className="gf-section-label" style={{ marginTop: 6 }}>Clasificación</div>

              {/* Prioridad — botones toggle */}
              <div className="gf-field">
                <label className="gf-label">Prioridad</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {([1, 2, 3] as (1 | 2 | 3)[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPrioridad(p)}
                      style={{
                        flex: 1,
                        padding: "7px",
                        borderRadius: 3,
                        border: `1px solid ${prioridad === p ? PRIO_CFG[p].color : "rgba(0,200,255,.12)"}`,
                        background: prioridad === p
                          ? `rgba(${p === 1 ? "255,59,92" : p === 2 ? "255,176,32" : "0,255,163"},0.07)`
                          : "transparent",
                        color: prioridad === p ? PRIO_CFG[p].color : "var(--text2,#5c8fa8)",
                        fontFamily: "'Share Tech Mono',monospace",
                        fontSize: 8,
                        letterSpacing: ".2em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all .18s",
                      }}
                    >
                      {PRIO_CFG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo */}
              <div className="gf-field">
                <label className="gf-label">Tipo de actividad</label>
                <div className="gf-select-wrap">
                  <select
                    className="gf-select"
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                  >
                    {TIPO_OPTS.map(t => (
                      <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div className={`gf-field ${focused === "notas" ? "focused" : ""}`}>
                <label className="gf-label">Notas internas</label>
                <textarea
                  className="gf-textarea"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Instrucciones, observaciones..."
                  rows={2}
                  onFocus={() => setFocused("notas")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              color: "#ff3b5c",
              letterSpacing: ".15em",
              padding: "6px 10px",
              background: "rgba(255,59,92,0.06)",
              border: "1px solid rgba(255,59,92,0.2)",
              borderRadius: 3,
              marginTop: 6,
            }}>
              ● {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="gf-footer">
          <button className="gf-btn gf-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="gf-btn gf-btn-save"
            onClick={handleSave}
            disabled={saving}
            style={{ borderColor: "rgba(255,176,32,.4)", color: "#ffb020" }}
          >
            {saving ? (
              <><div className="gf-spinner" style={{ borderTopColor: "#ffb020" }} />Guardando...</>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {isEdit ? "Actualizar" : "Crear Actividad"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}