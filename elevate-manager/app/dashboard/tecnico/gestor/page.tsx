"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import '../../../css/tecnicos/gestorTecnico.css'
import AgregaTecnicoForm,          { Tecnico }             from "../gestor/AgregaTecnicoForm"
import AgregarActividadTecnicoForm, { Actividad, Proyecto } from "../gestor/AgregarActividadTecnicoForm"

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type Tab = "tecnicos" | "actividades"

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ESTATUS_CFG = {
  activo:    { color: "#00ffa3", bg: "rgba(0,255,163,0.08)"  },
  inactivo:  { color: "#ff3b5c", bg: "rgba(255,59,92,0.08)"  },
  bloqueado: { color: "#ffb020", bg: "rgba(255,176,32,0.08)" },
}

const PRIO_CFG = {
  1: { color: "#ff3b5c", label: "ALTA"  },
  2: { color: "#ffb020", label: "MEDIA" },
  3: { color: "#00ffa3", label: "BAJA"  },
}

const TIPO_LABELS: Record<string, string> = {
  mantenimiento: "Mantenimiento",
  instalacion:   "Instalación",
  revision:      "Revisión",
  emergencia:    "Emergencia",
  otro:          "Otro",
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const parts   = name.trim().split(/\s+/)
  const letters = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()

  return (
    <div style={{
      width: 38, height: 38, borderRadius: 3, flexShrink: 0,
      background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
      fontSize: 14, letterSpacing: "0.08em", color: "#00ffa3",
    }}>
      {letters}
    </div>
  )
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return createPortal(
    <div className="gf-backdrop" onClick={onCancel}>
      <div className="gf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="gf-corner tl" /><div className="gf-corner tr" />
        <div className="gf-corner bl" /><div className="gf-corner br" />

        <div className="gf-header" style={{ borderBottom: "none" }}>
          <div>
            <div className="gf-eyebrow">Confirmar acción</div>
            <div className="gf-title">¿Estás seguro?</div>
          </div>
        </div>

        <div className="gf-body" style={{ paddingTop: 0 }}>
          <div style={{
            fontFamily: "'Exo 2',sans-serif", fontSize: 13,
            color: "var(--text2,#5c8fa8)", lineHeight: 1.5,
            padding: "10px 12px",
            background: "rgba(255,59,92,0.04)",
            border: "1px solid rgba(255,59,92,0.15)",
            borderRadius: 3,
          }}>
            {message}
            <div style={{
              marginTop: 8,
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 8, letterSpacing: ".2em",
              color: "rgba(255,59,92,0.6)",
            }}>
              EL REGISTRO NO SE ELIMINARÁ — SOLO SE MARCARÁ COMO INACTIVO
            </div>
          </div>
        </div>

        <div className="gf-footer">
          <button className="gf-btn gf-btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="gf-btn"
            onClick={onConfirm}
            style={{
              borderColor: "rgba(255,59,92,.4)", color: "#ff3b5c",
              background: "transparent", fontFamily: "'Rajdhani',sans-serif",
              fontWeight: 600, fontSize: 13, letterSpacing: ".2em",
              textTransform: "uppercase", cursor: "pointer",
              padding: "9px 20px", borderRadius: 3,
              display: "flex", alignItems: "center", gap: 7,
              transition: "all .18s", border: "1px solid rgba(255,59,92,.4)",
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function GestionTecnicosPage() {
  const [tab,           setTab]           = useState<Tab>("tecnicos")
  const [tecnicos,      setTecnicos]      = useState<Tecnico[]>([])
  const [actividades,   setActividades]   = useState<Actividad[]>([])
  const [proyectos,     setProyectos]     = useState<Proyecto[]>([])
  const [search,        setSearch]        = useState("")
  const [actSearch,     setActSearch]     = useState("")
  const [actFiltroTec,  setActFiltroTec]  = useState<number | "todos">("todos")
  const [actFiltroPrio, setActFiltroPrio] = useState<1 | 2 | 3 | "todos">("todos")
  const [loading,       setLoading]       = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showTecModal,  setShowTecModal]  = useState(false)
  const [showActModal,  setShowActModal]  = useState(false)
  const [editingTec,    setEditingTec]    = useState<Tecnico | null>(null)
  const [editingAct,    setEditingAct]    = useState<Actividad | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "tec" | "act"; id: number; msg: string
  } | null>(null)

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadTecnicos = async () => {
    const r = await fetch("/api/tecnico"); const d = await r.json()
    if (d.success) setTecnicos(d.data)
  }
  const loadActividades = async () => {
    const r = await fetch("/api/actividades-tecnico"); const d = await r.json()
    if (d.success) setActividades(d.data)
  }
  const loadProyectos = async () => {
    const r = await fetch("/api/proyectos"); const d = await r.json()
    if (d.success && Array.isArray(d.data)) setProyectos(d.data)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTecnicos(), loadActividades(), loadProyectos()])
      .finally(() => setLoading(false))
  }, [])

  // ── Soft delete ─────────────────────────────────────────────────────────────
  const handleDeleteTec = async (id: number) => {
    await fetch(`/api/tecnico/${id}`, { method: "DELETE" })
    loadTecnicos(); setConfirmDelete(null)
  }
  const handleDeleteAct = async (id: number) => {
    await fetch(`/api/actividades-tecnico/${id}`, { method: "DELETE" })
    loadActividades(); setConfirmDelete(null)
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const filteredTec = tecnicos.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  )
  const filteredAct = actividades.filter(a => {
    const q = actSearch.toLowerCase()
    const matchSearch =
      a.titulo.toLowerCase().includes(q) ||
      (a.tecnico_nombre  || "").toLowerCase().includes(q) ||
      (a.proyecto_nombre || "").toLowerCase().includes(q)
    const matchTec  = actFiltroTec  === "todos" || a.tecnico_id === actFiltroTec
    const matchPrio = actFiltroPrio === "todos" || a.prioridad  === actFiltroPrio
    return matchSearch && matchTec && matchPrio
  })

  // ── Stats ───────────────────────────────────────────────────────────────────
  const tecActivos   = tecnicos.filter(t => t.estatus === "activo").length
  const tecFace      = tecnicos.filter(t => t.face_enrollado).length
  const hoy          = new Date().toISOString().split("T")[0]
  const actHoy       = actividades.filter(a => a.fecha_programada === hoy).length
  const actCompletas = actividades.filter(a => a.completada).length

  return (
    <>
      <div>
        {/* HEADER */}
        <div className="gt-header">
          <div>
            <div className="gt-eyebrow">Panel Administrativo</div>
            <div className="gt-title">GESTIÓN DE <span>TÉCNICOS</span></div>
          </div>
        </div>
        <div className="section-divider" />

        {/* SUMMARY STRIP */}
        <div className="gt-summary">
          {([
            { label: "Técnicos Total",  value: tecnicos.length,   color: "#00c8ff" },
            { label: "Activos",         value: tecActivos,         color: "#00ffa3" },
            { label: "Face ID Reg.",    value: tecFace,            color: "#ffb020" },
            { label: "Actividades hoy", value: actHoy,             color: "#ff6b2b" },
            { label: "Completadas",     value: actCompletas,       color: "#00ffa3" },
            { label: "Total activ.",    value: actividades.length, color: "#00c8ff" },
          ] as { label: string; value: number; color: string }[]).map(s => (
            <div key={s.label} className="gt-sum-item">
              <div className="gt-sum-dot" style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
              <div className="gt-sum-val" style={{ color: s.color }}>{s.value}</div>
              <div className="gt-sum-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* MAIN TABS */}
        <div className="gt-tabs">
          <button
            className={`gt-tab ${tab === "tecnicos" ? "active" : ""}`}
            onClick={() => setTab("tecnicos")}
          >
            Técnicos ({tecnicos.length})
          </button>
          <button
            className={`gt-tab ${tab === "actividades" ? "active" : ""}`}
            style={tab === "actividades" ? { color: "#ffb020", borderBottomColor: "#ffb020" } : {}}
            onClick={() => setTab("actividades")}
          >
            Actividades ({actividades.length})
          </button>
        </div>

        {/* ══════════════ TAB TÉCNICOS ══════════════ */}
        {tab === "tecnicos" && (
          <>
            <div className="gt-toolbar">
              <div className={`gt-search-wrap ${searchFocused ? "focused" : ""}`}>
                <span className="gt-search-icon">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="gt-search-input"
                  placeholder="Buscar técnico..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
              <button className="btn-add-gt" onClick={() => { setEditingTec(null); setShowTecModal(true) }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Nuevo Técnico
              </button>
            </div>

            <div className="gt-meta">
              {filteredTec.length} TÉCNICO{filteredTec.length !== 1 ? "S" : ""}
            </div>

            {loading ? (
              <div className="gt-loading"><div className="gt-spinner-sm" />CARGANDO...</div>
            ) : (
              <div className="gt-grid">
                {filteredTec.length === 0 ? (
                  <div className="gt-empty">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.2">
                      <circle cx="20" cy="14" r="8" stroke="#00ffa3" strokeWidth="1.5" />
                      <path d="M5 38c0-8.28 6.72-15 15-15s15 6.72 15 15"
                        stroke="#00ffa3" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>Sin técnicos registrados</span>
                  </div>
                ) : filteredTec.map(t => {
                  const estCfg = ESTATUS_CFG[t.estatus]
                  return (
                    <div key={t.id} className="tec-card">
                      <div className="tec-card-head">
                        <Avatar name={t.nombre} />
                        <div className="tec-card-info">
                          <div className="tec-card-name">{t.nombre}</div>
                          <div className="tec-card-email">{t.email}</div>
                        </div>
                        <span className="tec-badge" style={{ color: estCfg.color, background: estCfg.bg }}>
                          <span className="tec-badge-dot" />{t.estatus.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {t.telefono && (
                          <div className="tec-field">
                            <span className="tec-field-key">Teléfono</span>
                            <span className="tec-field-val">{t.telefono}</span>
                          </div>
                        )}
                        <div className="tec-field">
                          <span className="tec-field-key">Último login</span>
                          <span className="tec-field-val">
                            {t.ultimo_login
                              ? new Date(t.ultimo_login).toLocaleDateString("es-MX")
                              : "Nunca"}
                          </span>
                        </div>
                      </div>

                      <span
                        className="face-tag"
                        style={t.face_enrollado
                          ? { color: "#00ffa3", background: "rgba(0,255,163,.07)", border: "1px solid rgba(0,255,163,.2)" }
                          : { color: "#ffb020", background: "rgba(255,176,32,.07)", border: "1px solid rgba(255,176,32,.2)" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
                          <circle cx="3.5" cy="4.5" r=".7" fill="currentColor" />
                          <circle cx="7.5" cy="4.5" r=".7" fill="currentColor" />
                          <path d="M3.5 7.5c.5.7 3.5.7 4 0" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" />
                        </svg>
                        {t.face_enrollado ? "Face ID Registrado" : "Face ID Pendiente"}
                      </span>

                      <div className="tec-card-footer">
                        <button className="btn-action btn-edit"
                          onClick={() => { setEditingTec(t); setShowTecModal(true) }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M6.5 1.5l2 2L2 10H0V8L6.5 1.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                          </svg>
                          Editar
                        </button>
                        <button className="btn-action btn-del"
                          onClick={() => setConfirmDelete({ type: "tec", id: t.id, msg: `¿Desactivar al técnico "${t.nombre}"?` })}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 2.5h8M3.5 2.5V1.5h3v1M4 4.5v3M6 4.5v3M2 2.5l.5 6h5l.5-6"
                              stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Desactivar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════ TAB ACTIVIDADES ══════════════ */}
        {tab === "actividades" && (
          <>
            <div className="gt-toolbar">
              <div className={`gt-search-wrap ${searchFocused ? "focused" : ""}`}>
                <span className="gt-search-icon">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="gt-search-input"
                  placeholder="Buscar actividad..."
                  value={actSearch}
                  onChange={e => setActSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>

              {/* Filtro por técnico */}
              <div style={{ position: "relative" }}>
                <select
                  style={{
                    background: "rgba(0,200,255,.03)", border: "1px solid rgba(0,200,255,.15)",
                    borderRadius: 3, padding: "9px 28px 9px 12px",
                    color: "var(--text,#c8e8f5)", fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 10, letterSpacing: ".1em", outline: "none",
                    appearance: "none", cursor: "pointer",
                  }}
                  value={actFiltroTec}
                  onChange={e => setActFiltroTec(e.target.value === "todos" ? "todos" : Number(e.target.value))}
                >
                  <option value="todos">Todos los técnicos</option>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <span style={{
                  position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text2,#5c8fa8)", pointerEvents: "none", fontSize: 11,
                }}>▾</span>
              </div>

              {/* Filtro prioridad */}
              <div className="filter-pills">
                {([
                  { k: "todos", l: "TODAS", c: "#5c8fa8" },
                  { k: 1,       l: "ALTA",  c: "#ff3b5c" },
                  { k: 2,       l: "MEDIA", c: "#ffb020" },
                  { k: 3,       l: "BAJA",  c: "#00ffa3" },
                ] as { k: number | "todos"; l: string; c: string }[]).map(f => (
                  <button key={String(f.k)}
                    className={`filter-pill ${actFiltroPrio === f.k ? "active" : ""}`}
                    style={{ color: actFiltroPrio === f.k ? f.c : undefined }}
                    onClick={() => setActFiltroPrio(f.k as typeof actFiltroPrio)}>
                    <div className="fpill-dot" style={{ background: f.c }} />
                    {f.l}
                  </button>
                ))}
              </div>

              <button className="btn-add-gt btn-add-act"
                onClick={() => { setEditingAct(null); setShowActModal(true) }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Nueva Actividad
              </button>
            </div>

            <div className="gt-meta">
              {filteredAct.length} ACTIVIDAD{filteredAct.length !== 1 ? "ES" : ""}
            </div>

            {loading ? (
              <div className="gt-loading"><div className="gt-spinner-sm" />CARGANDO...</div>
            ) : (
              <div className="gt-grid">
                {filteredAct.length === 0 ? (
                  <div className="gt-empty">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.2">
                      <rect x="6" y="4" width="28" height="32" rx="2" stroke="#ffb020" strokeWidth="1.5" />
                      <path d="M12 13h16M12 19h16M12 25h10"
                        stroke="#ffb020" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
                    </svg>
                    <span>Sin actividades registradas</span>
                  </div>
                ) : filteredAct.map(a => {
                  const pc = PRIO_CFG[a.prioridad]
                  return (
                    <div key={a.id} className="act-card" style={{ "--pcolor": pc.color } as React.CSSProperties}>
                      <div className="act-card-head">
                        <div className="act-card-title">{a.titulo}</div>
                        <span className="act-prio-badge" style={{ color: pc.color }}>{pc.label}</span>
                      </div>

                      <div className="act-fields">
                        <div className="act-field-row">
                          <span className="act-field-key">Técnico</span>
                          <span className="act-field-val">{a.tecnico_nombre || "—"}</span>
                        </div>
                        {a.proyecto_nombre && (
                          <div className="act-field-row">
                            <span className="act-field-key">Proyecto</span>
                            <span className="act-field-val">{a.proyecto_nombre}</span>
                          </div>
                        )}
                        {a.cliente_nombre && (
                          <div className="act-field-row">
                            <span className="act-field-key">Cliente</span>
                            <span className="act-field-val">{a.cliente_nombre}</span>
                          </div>
                        )}
                        <div className="act-field-row">
                          <span className="act-field-key">Fecha</span>
                          <span className="act-field-val">
                            {new Date(a.fecha_programada + "T12:00:00").toLocaleDateString("es-MX", {
                              weekday: "short", day: "2-digit", month: "short",
                            })}
                            {a.hora_inicio && ` · ${a.hora_inicio}`}
                            {a.hora_fin    && ` – ${a.hora_fin}`}
                          </span>
                        </div>
                        {a.direccion && (
                          <div className="act-field-row">
                            <span className="act-field-key">Lugar</span>
                            <span className="act-field-val">{a.direccion}</span>
                          </div>
                        )}
                      </div>

                      <div className="act-tags">
                        <span className="act-tag">{TIPO_LABELS[a.tipo] || a.tipo}</span>
                        <span className="act-done-badge" style={a.completada
                          ? { color: "#00ffa3", background: "rgba(0,255,163,.07)", border: "1px solid rgba(0,255,163,.18)" }
                          : { color: "#5c8fa8", background: "rgba(0,0,0,.2)",       border: "1px solid rgba(0,200,255,.07)" }}>
                          {a.completada ? "✓ COMPLETADA" : "○ PENDIENTE"}
                        </span>
                      </div>

                      <div className="act-card-footer">
                        <button className="btn-action btn-edit"
                          onClick={() => { setEditingAct(a); setShowActModal(true) }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M6.5 1.5l2 2L2 10H0V8L6.5 1.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                          </svg>
                          Editar
                        </button>
                        <button className="btn-action btn-del"
                          onClick={() => setConfirmDelete({ type: "act", id: a.id, msg: `¿Eliminar la actividad "${a.titulo}"?` })}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 2.5h8M3.5 2.5V1.5h3v1M4 4.5v3M6 4.5v3M2 2.5l.5 6h5l.5-6"
                              stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODALES ── */}
      {showTecModal && (
        <AgregaTecnicoForm
          tecnico={editingTec}
          onClose={() => setShowTecModal(false)}
          onSaved={() => { loadTecnicos(); loadActividades() }}
        />
      )}

      {showActModal && (
        <AgregarActividadTecnicoForm
          actividad={editingAct}
          tecnicos={tecnicos}
          proyectos={proyectos}
          onClose={() => setShowActModal(false)}
          onSaved={() => loadActividades()}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message={confirmDelete.msg}
          onConfirm={() =>
            confirmDelete.type === "tec"
              ? handleDeleteTec(confirmDelete.id)
              : handleDeleteAct(confirmDelete.id)
          }
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}