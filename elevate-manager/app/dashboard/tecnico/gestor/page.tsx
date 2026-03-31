"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface Tecnico {
  id: number; nombre: string; email: string; telefono?: string
  estatus: "activo"|"inactivo"|"bloqueado"; face_enrollado: boolean
  ultimo_login?: string; created_at: string
}

interface Proyecto {
  id: number; nombre: string; cliente: string; ubicacion: string; lat?: number; lng?: number
}

interface Actividad {
  id: number; titulo: string; descripcion?: string
  tecnico_id: number; tecnico_nombre?: string
  proyecto_id?: number; proyecto_nombre?: string
  fecha_programada: string; hora_inicio?: string; hora_fin?: string
  lat?: number; lng?: number; direccion?: string; cliente_nombre?: string
  prioridad: 1|2|3; tipo: string; completada: boolean; notas?: string
}

type Tab = "tecnicos"|"actividades"

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ESTATUS_CFG = {
  activo:    { color:"#00ffa3", bg:"rgba(0,255,163,0.08)"  },
  inactivo:  { color:"#ff3b5c", bg:"rgba(255,59,92,0.08)"  },
  bloqueado: { color:"#ffb020", bg:"rgba(255,176,32,0.08)" },
}
const PRIO_CFG = {
  1: { color:"#ff3b5c", label:"ALTA"   },
  2: { color:"#ffb020", label:"MEDIA"  },
  3: { color:"#00ffa3", label:"BAJA"   },
}
const TIPO_OPTS = ["mantenimiento","instalacion","revision","emergencia","otro"]
const TIPO_LABELS: Record<string,string> = {
  mantenimiento:"Mantenimiento", instalacion:"Instalación",
  revision:"Revisión", emergencia:"Emergencia", otro:"Otro"
}

function Avatar({ name }: { name: string }) {
  const l = name.trim().split(/\s+/)
  const letters = l.length >= 2 ? (l[0][0]+l[1][0]).toUpperCase() : name.slice(0,2).toUpperCase()
  return (
    <div style={{ width:38,height:38,borderRadius:3,flexShrink:0,background:"rgba(0,255,163,0.08)",
      border:"1px solid rgba(0,255,163,0.2)",display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,letterSpacing:"0.08em",color:"#00ffa3" }}>
      {letters}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL TECNICO
// ═══════════════════════════════════════════════════════════════════════════════
function TecnicoModal({
  tecnico, onClose, onSaved
}: { tecnico: Tecnico|null; onClose:()=>void; onSaved:()=>void }) {
  const isEdit = !!tecnico
  const [nombre,   setNombre]   = useState(tecnico?.nombre   || "")
  const [email,    setEmail]    = useState(tecnico?.email     || "")
  const [telefono, setTelefono] = useState(tecnico?.telefono || "")
  const [password, setPassword] = useState("")
  const [estatus,  setEstatus]  = useState(tecnico?.estatus  || "activo")
  const [focused,  setFocused]  = useState<string|null>(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState("")

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key==="Escape" && onClose()
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [onClose])

  const handleSave = async () => {
    if (!nombre || !email) { setError("Nombre y email son obligatorios"); return }
    if (!isEdit && !password) { setError("La contraseña es obligatoria para nuevos técnicos"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch(
        isEdit ? `/api/tecnicos/${tecnico!.id}` : "/api/tecnicos",
        { method: isEdit ? "PUT" : "POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ nombre, email, telefono, password: password||undefined, estatus }) }
      )
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); setSaving(false); return }
      onSaved(); onClose()
    } catch { setError("Error de conexión") }
    setSaving(false)
  }

  const F = ({ id, label, value, onChange, type="text", placeholder, required=false }:
    { id:string; label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string; required?:boolean }) => (
    <div className={`gf-field ${focused===id?"focused":""}`}>
      <label className="gf-label">{label}{required&&<span className="gf-req">*</span>}</label>
      <input className="gf-input" type={type} placeholder={placeholder||label} value={value}
        onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(id)} onBlur={()=>setFocused(null)}/>
    </div>
  )

  return createPortal(
    <div className="gf-backdrop" onClick={onClose}>
      <div className="gf-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div className="gf-corner tl"/><div className="gf-corner tr"/>
        <div className="gf-corner bl"/><div className="gf-corner br"/>

        <div className="gf-header">
          <div>
            <div className="gf-eyebrow">{isEdit?"Modificar registro":"Nuevo registro"}</div>
            <div className="gf-title">
              {isEdit?"Editar":"Agregar"} <span style={{color:"#00ffa3"}}>Técnico</span>
            </div>
          </div>
          <button className="gf-close" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="gf-body">
          {/* Info de Face ID */}
          {!isEdit && (
            <div style={{ padding:"10px 12px", background:"rgba(0,200,255,0.04)", border:"1px solid rgba(0,200,255,0.15)",
              borderRadius:3, marginBottom:14 }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:".3em",
                color:"#00c8ff", textTransform:"uppercase", marginBottom:4 }}>ℹ AVISO FACE ID</div>
              <div style={{ fontFamily:"'Exo 2',sans-serif", fontSize:11, color:"var(--text2,#5c8fa8)", lineHeight:1.5 }}>
                Al crearse la cuenta, el técnico deberá registrar su Face ID al hacer su primer inicio de sesión.
              </div>
            </div>
          )}

          <div className="gf-section-label">Datos Personales</div>
          <F id="nom" label="Nombre completo" value={nombre} onChange={setNombre} required/>
          <F id="tel" label="Teléfono" value={telefono} onChange={setTelefono} type="tel"/>

          <div className="gf-section-label" style={{marginTop:6}}>Acceso al Sistema</div>
          <F id="em" label="Correo electrónico" value={email} onChange={setEmail} type="email" required/>
          <F id="pw" label={isEdit?"Nueva contraseña (opcional)":"Contraseña"} value={password}
            onChange={setPassword} type="password" required={!isEdit} placeholder={isEdit?"Dejar vacío para no cambiar":"••••••••"}/>

          {isEdit && (
            <>
              <div className="gf-section-label" style={{marginTop:6}}>Estado</div>
              <div className="gf-field">
                <label className="gf-label">Estatus</label>
                <div className="gf-select-wrap">
                  <select className="gf-select" value={estatus} onChange={e=>setEstatus(e.target.value as any)}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {error && (
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#ff3b5c",
              letterSpacing:".15em", padding:"6px 10px", background:"rgba(255,59,92,0.06)",
              border:"1px solid rgba(255,59,92,0.2)", borderRadius:3 }}>
              ● {error}
            </div>
          )}
        </div>

        <div className="gf-footer">
          <button className="gf-btn gf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="gf-btn gf-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="gf-spinner"/>Guardando...</> : <>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isEdit?"Actualizar":"Crear Técnico"}
            </>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL ACTIVIDAD
// ═══════════════════════════════════════════════════════════════════════════════
function ActividadModal({
  actividad, tecnicos, proyectos, onClose, onSaved
}: { actividad:Actividad|null; tecnicos:Tecnico[]; proyectos:Proyecto[]; onClose:()=>void; onSaved:()=>void }) {
  const isEdit = !!actividad
  const [titulo,        setTitulo]        = useState(actividad?.titulo         || "")
  const [descripcion,   setDescripcion]   = useState(actividad?.descripcion    || "")
  const [tecnicoId,     setTecnicoId]     = useState<number|"">(actividad?.tecnico_id || "")
  const [proyectoId,    setProyectoId]    = useState<number|"">(actividad?.proyecto_id || "")
  const [fecha,         setFecha]         = useState(actividad?.fecha_programada || "")
  const [horaInicio,    setHoraInicio]    = useState(actividad?.hora_inicio    || "")
  const [horaFin,       setHoraFin]       = useState(actividad?.hora_fin       || "")
  const [direccion,     setDireccion]     = useState(actividad?.direccion      || "")
  const [clienteNombre, setClienteNombre] = useState(actividad?.cliente_nombre || "")
  const [prioridad,     setPrioridad]     = useState<1|2|3>(actividad?.prioridad || 3)
  const [tipo,          setTipo]          = useState(actividad?.tipo           || "mantenimiento")
  const [notas,         setNotas]         = useState(actividad?.notas          || "")
  const [completada,    setCompletada]    = useState(actividad?.completada     || false)
  const [focused,       setFocused]       = useState<string|null>(null)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState("")

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key==="Escape" && onClose()
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [onClose])

  // Auto-rellenar desde proyecto seleccionado
  useEffect(() => {
    if (!proyectoId) return
    const p = proyectos.find(p => p.id === proyectoId)
    if (p) {
      if (!direccion)     setDireccion(p.ubicacion || "")
      if (!clienteNombre) setClienteNombre(p.cliente || "")
    }
  }, [proyectoId])

  const handleSave = async () => {
    if (!titulo || !tecnicoId || !fecha) { setError("Título, técnico y fecha son obligatorios"); return }
    setSaving(true); setError("")
    try {
      const body = { titulo, descripcion, tecnico_id: tecnicoId, proyecto_id: proyectoId||null,
        fecha_programada: fecha, hora_inicio: horaInicio||null, hora_fin: horaFin||null,
        direccion, cliente_nombre: clienteNombre, prioridad, tipo, notas, completada }
      const res = await fetch(
        isEdit ? `/api/actividades-tecnicos/${actividad!.id}` : "/api/actividades-tecnicos",
        { method: isEdit?"PUT":"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) }
      )
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); setSaving(false); return }
      onSaved(); onClose()
    } catch { setError("Error de conexión") }
    setSaving(false)
  }

  const FI = ({ id, label, value, onChange, type="text", placeholder }:
    { id:string; label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string }) => (
    <div className={`gf-field ${focused===id?"focused":""}`}>
      <label className="gf-label">{label}</label>
      <input className="gf-input" type={type} placeholder={placeholder||label} value={value}
        onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(id)} onBlur={()=>setFocused(null)}/>
    </div>
  )

  return createPortal(
    <div className="gf-backdrop" onClick={onClose}>
      <div className="gf-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}>
        <div className="gf-corner tl"/><div className="gf-corner tr"/>
        <div className="gf-corner bl"/><div className="gf-corner br"/>

        <div className="gf-header">
          <div>
            <div className="gf-eyebrow">{isEdit?"Modificar":"Nueva"} actividad</div>
            <div className="gf-title">
              {isEdit?"Editar":"Asignar"} <span style={{color:"#ffb020"}}>Actividad</span>
            </div>
          </div>
          <button className="gf-close" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="gf-body">
          <div className="gf-cols">
            {/* COL 1 */}
            <div>
              <div className="gf-section-label">Información General</div>
              <FI id="tit" label="Título *" value={titulo} onChange={setTitulo}/>
              <div className={`gf-field ${focused==="desc"?"focused":""}`}>
                <label className="gf-label">Descripción</label>
                <textarea className="gf-textarea" value={descripcion} onChange={e=>setDescripcion(e.target.value)}
                  placeholder="Descripción de la actividad..." onFocus={()=>setFocused("desc")} onBlur={()=>setFocused(null)}/>
              </div>

              <div className="gf-section-label" style={{marginTop:6}}>Asignación</div>
              <div className="gf-field">
                <label className="gf-label">Técnico *</label>
                <div className="gf-select-wrap">
                  <select className="gf-select" value={tecnicoId} onChange={e=>setTecnicoId(e.target.value?Number(e.target.value):"")}>
                    <option value="">Selecciona un técnico</option>
                    {tecnicos.filter(t=>t.estatus==="activo").map(t=>(
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="gf-field">
                <label className="gf-label">Proyecto relacionado</label>
                <div className="gf-select-wrap">
                  <select className="gf-select" value={proyectoId} onChange={e=>setProyectoId(e.target.value?Number(e.target.value):"")}>
                    <option value="">Sin proyecto</option>
                    {proyectos.map(p=>(
                      <option key={p.id} value={p.id}>{p.nombre} — {p.cliente}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isEdit && (
                <div className="gf-field" style={{display:"flex",alignItems:"center",gap:10}}>
                  <input type="checkbox" id="completada" checked={completada} onChange={e=>setCompletada(e.target.checked)}
                    style={{accentColor:"#00ffa3",width:14,height:14}}/>
                  <label htmlFor="completada" style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,
                    letterSpacing:".2em",color:"var(--text2,#5c8fa8)",textTransform:"uppercase",cursor:"pointer"}}>
                    Marcar como completada
                  </label>
                </div>
              )}
            </div>

            {/* COL 2 */}
            <div>
              <div className="gf-section-label">Fecha y Hora</div>
              <FI id="fec" label="Fecha *" value={fecha} onChange={setFecha} type="date"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <FI id="hi" label="Hora inicio" value={horaInicio} onChange={setHoraInicio} type="time"/>
                <FI id="hf" label="Hora fin" value={horaFin} onChange={setHoraFin} type="time"/>
              </div>

              <div className="gf-section-label" style={{marginTop:6}}>Ubicación</div>
              <FI id="dir" label="Dirección" value={direccion} onChange={setDireccion}/>
              <FI id="cn" label="Cliente en sitio" value={clienteNombre} onChange={setClienteNombre}/>

              <div className="gf-section-label" style={{marginTop:6}}>Clasificación</div>
              <div className="gf-field">
                <label className="gf-label">Prioridad</label>
                <div style={{display:"flex",gap:6}}>
                  {([1,2,3] as (1|2|3)[]).map(p=>(
                    <button key={p} onClick={()=>setPrioridad(p)}
                      style={{flex:1,padding:"7px",borderRadius:3,border:`1px solid ${prioridad===p?PRIO_CFG[p].color:"rgba(0,200,255,.12)"}`,
                        background:prioridad===p?`rgba(${p===1?"255,59,92":p===2?"255,176,32":"0,255,163"},0.07)`:"transparent",
                        color:prioridad===p?PRIO_CFG[p].color:"var(--text2,#5c8fa8)",
                        fontFamily:"'Share Tech Mono',monospace",fontSize:8,letterSpacing:".2em",
                        textTransform:"uppercase",cursor:"pointer",transition:"all .18s"}}>
                      {PRIO_CFG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gf-field">
                <label className="gf-label">Tipo de actividad</label>
                <div className="gf-select-wrap">
                  <select className="gf-select" value={tipo} onChange={e=>setTipo(e.target.value)}>
                    {TIPO_OPTS.map(t=><option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>

              <div className={`gf-field ${focused==="notas"?"focused":""}`}>
                <label className="gf-label">Notas internas</label>
                <textarea className="gf-textarea" value={notas} onChange={e=>setNotas(e.target.value)}
                  placeholder="Instrucciones, observaciones..." rows={2}
                  onFocus={()=>setFocused("notas")} onBlur={()=>setFocused(null)}/>
              </div>
            </div>
          </div>

          {error && (
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#ff3b5c",
              letterSpacing:".15em",padding:"6px 10px",background:"rgba(255,59,92,0.06)",
              border:"1px solid rgba(255,59,92,0.2)",borderRadius:3,marginTop:6}}>
              ● {error}
            </div>
          )}
        </div>

        <div className="gf-footer">
          <button className="gf-btn gf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="gf-btn gf-btn-save" onClick={handleSave} disabled={saving}
            style={{borderColor:"rgba(255,176,32,.4)",color:"#ffb020"}}>
            {saving?<><div className="gf-spinner" style={{borderTopColor:"#ffb020"}}/>Guardando...</>:<>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isEdit?"Actualizar":"Crear Actividad"}
            </>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRM MODAL (soft delete)
// ═══════════════════════════════════════════════════════════════════════════════
function ConfirmModal({ message, onConfirm, onCancel }:
  { message:string; onConfirm:()=>void; onCancel:()=>void }) {
  return createPortal(
    <div className="gf-backdrop" onClick={onCancel}>
      <div className="gf-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
        <div className="gf-corner tl"/><div className="gf-corner tr"/>
        <div className="gf-corner bl"/><div className="gf-corner br"/>
        <div className="gf-header" style={{borderBottom:"none"}}>
          <div>
            <div className="gf-eyebrow">Confirmar acción</div>
            <div className="gf-title">¿Estás seguro?</div>
          </div>
        </div>
        <div className="gf-body" style={{paddingTop:0}}>
          <div style={{fontFamily:"'Exo 2',sans-serif",fontSize:13,color:"var(--text2,#5c8fa8)",
            lineHeight:1.5,padding:"10px 12px",background:"rgba(255,59,92,0.04)",
            border:"1px solid rgba(255,59,92,0.15)",borderRadius:3}}>
            {message}
            <div style={{marginTop:8,fontFamily:"'Share Tech Mono',monospace",fontSize:8,
              letterSpacing:".2em",color:"rgba(255,59,92,0.6)"}}>
              EL REGISTRO NO SE ELIMINARÁ — SOLO SE MARCARÁ COMO INACTIVO
            </div>
          </div>
        </div>
        <div className="gf-footer">
          <button className="gf-btn gf-btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="gf-btn" onClick={onConfirm}
            style={{borderColor:"rgba(255,59,92,.4)",color:"#ff3b5c",background:"transparent",
              fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:13,letterSpacing:".2em",
              textTransform:"uppercase",cursor:"pointer",padding:"9px 20px",borderRadius:3,
              display:"flex",alignItems:"center",gap:7,transition:"all .18s"}}>
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
  const [tab,             setTab]             = useState<Tab>("tecnicos")
  const [tecnicos,        setTecnicos]        = useState<Tecnico[]>([])
  const [actividades,     setActividades]     = useState<Actividad[]>([])
  const [proyectos,       setProyectos]       = useState<Proyecto[]>([])
  const [search,          setSearch]          = useState("")
  const [actSearch,       setActSearch]       = useState("")
  const [actFiltroTec,    setActFiltroTec]    = useState<number|"todos">("todos")
  const [actFiltroPrio,   setActFiltroPrio]   = useState<1|2|3|"todos">("todos")
  const [loading,         setLoading]         = useState(true)
  const [showTecModal,    setShowTecModal]    = useState(false)
  const [showActModal,    setShowActModal]    = useState(false)
  const [editingTec,      setEditingTec]      = useState<Tecnico|null>(null)
  const [editingAct,      setEditingAct]      = useState<Actividad|null>(null)
  const [confirmDelete,   setConfirmDelete]   = useState<{type:"tec"|"act";id:number;msg:string}|null>(null)
  const [focused,         setFocused]         = useState(false)

  const loadTecnicos  = async () => {
    const r = await fetch("/api/tecnicos"); const d = await r.json()
    if (d.success) setTecnicos(d.data)
  }
  const loadActividades = async () => {
    const r = await fetch("/api/actividades-tecnicos"); const d = await r.json()
    if (d.success) setActividades(d.data)
  }
  const loadProyectos = async () => {
    const r = await fetch("/api/proyectos"); const d = await r.json()
    if (d.success && Array.isArray(d.data)) setProyectos(d.data)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTecnicos(), loadActividades(), loadProyectos()]).finally(()=>setLoading(false))
  }, [])

  const handleDeleteTec = async (id: number) => {
    await fetch(`/api/tecnicos/${id}`, { method:"DELETE" })
    loadTecnicos()
    setConfirmDelete(null)
  }
  const handleDeleteAct = async (id: number) => {
    await fetch(`/api/actividades-tecnicos/${id}`, { method:"DELETE" })
    loadActividades()
    setConfirmDelete(null)
  }

  const filteredTec = tecnicos.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  )
  const filteredAct = actividades.filter(a => {
    const q = actSearch.toLowerCase()
    const matchSearch = a.titulo.toLowerCase().includes(q) || (a.tecnico_nombre||"").toLowerCase().includes(q) || (a.proyecto_nombre||"").toLowerCase().includes(q)
    const matchTec  = actFiltroTec  ==="todos" || a.tecnico_id === actFiltroTec
    const matchPrio = actFiltroPrio ==="todos" || a.prioridad  === actFiltroPrio
    return matchSearch && matchTec && matchPrio
  })

  // Stats
  const tecActivos   = tecnicos.filter(t=>t.estatus==="activo").length
  const tecFace      = tecnicos.filter(t=>t.face_enrollado).length
  const actHoy       = actividades.filter(a=>a.fecha_programada===new Date().toISOString().split("T")[0]).length
  const actCompletas = actividades.filter(a=>a.completada).length

  return (
    <>
      <style>{`
        /* ── HEADER ── */
        .gt-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px}
        .gt-eyebrow{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.4em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px}
        .gt-eyebrow::before{content:'';display:block;width:20px;height:1px;background:#00ffa3}
        .gt-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:30px;letter-spacing:.18em;color:var(--text,#c8e8f5);text-transform:uppercase;line-height:1}
        .gt-title span{color:#00ffa3}
        .section-divider{height:1px;background:linear-gradient(90deg,#00ffa3,transparent 60%);margin-bottom:20px;opacity:.2}

        /* ── SUMMARY ── */
        .gt-summary{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
        .gt-sum-item{display:flex;align-items:center;gap:8px;padding:7px 14px;background:var(--surface,#0a1520);border:1px solid rgba(0,200,255,.1);border-radius:3px}
        .gt-sum-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .gt-sum-val{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;line-height:1}
        .gt-sum-label{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.2em;color:var(--text2,#5c8fa8);text-transform:uppercase}

        /* ── MAIN TABS ── */
        .gt-tabs{display:flex;border-bottom:1px solid rgba(0,200,255,.1);margin-bottom:20px}
        .gt-tab{padding:10px 20px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:var(--text2,#5c8fa8);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .18s;position:relative;top:1px}
        .gt-tab.active{color:#00ffa3;border-bottom-color:#00ffa3}

        /* ── TOOLBAR ── */
        .gt-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
        .gt-search-wrap{position:relative;flex:1;min-width:200px;max-width:360px}
        .gt-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text2,#5c8fa8);pointer-events:none;transition:color .2s}
        .gt-search-wrap.focused .gt-search-icon{color:#00ffa3}
        .gt-search-input{width:100%;background:rgba(0,200,255,.03);border:1px solid rgba(0,200,255,.15);border-radius:3px;padding:9px 12px 9px 36px;color:var(--text,#c8e8f5);font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:.06em;outline:none;transition:all .2s}
        .gt-search-input::placeholder{color:rgba(0,200,255,.18);font-size:11px}
        .gt-search-input:focus{border-color:rgba(0,255,163,.35);box-shadow:0 0 0 3px rgba(0,255,163,.04)}
        .gt-meta{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.2em;color:var(--text2,#5c8fa8);margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .gt-meta::before{content:'';display:block;width:1px;height:12px;background:#00ffa3;opacity:.4}

        /* ── ADD BUTTON ── */
        .btn-add-gt{display:flex;align-items:center;gap:8px;padding:9px 18px;background:transparent;border:1px solid rgba(0,255,163,.35);border-radius:3px;color:#00ffa3;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;overflow:hidden;position:relative;transition:all .2s;white-space:nowrap}
        .btn-add-gt::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(0,255,163,.07),transparent);transform:translateX(-100%);transition:transform .4s}
        .btn-add-gt:hover::before{transform:translateX(100%)}
        .btn-add-gt:hover{border-color:#00ffa3;box-shadow:0 0 18px rgba(0,255,163,.12)}
        .btn-add-act{border-color:rgba(255,176,32,.35)!important;color:#ffb020!important}
        .btn-add-act:hover{border-color:#ffb020!important;box-shadow:0 0 18px rgba(255,176,32,.12)!important}

        /* ── FILTER PILLS ── */
        .filter-pills{display:flex;gap:6px;flex-wrap:wrap}
        .filter-pill{display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:2px;border:1px solid transparent;background:transparent;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.18em;cursor:pointer;transition:all .18s;color:var(--text2,#5c8fa8)}
        .filter-pill:hover{border-color:rgba(0,200,255,.2);color:var(--text,#c8e8f5)}
        .filter-pill.active{border-color:currentColor;background:rgba(0,0,0,.2)}
        .fpill-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}

        /* ── GRID ── */
        .gt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:1100px){.gt-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:680px){.gt-grid{grid-template-columns:1fr}}

        /* ── TECNICO CARD ── */
        .tec-card{background:var(--surface,#0a1520);border:1px solid rgba(0,200,255,.1);border-radius:4px;padding:18px;display:flex;flex-direction:column;gap:11px;position:relative;overflow:hidden;transition:all .2s}
        .tec-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#00ffa3,transparent);opacity:.5;transition:opacity .2s}
        .tec-card:hover{border-color:rgba(0,255,163,.2);transform:translateY(-1px)}
        .tec-card:hover::before{opacity:1}
        .tec-card::after{content:'';position:absolute;bottom:0;right:0;width:10px;height:10px;border-right:1px solid rgba(0,255,163,.12);border-bottom:1px solid rgba(0,255,163,.12)}
        .tec-card-head{display:flex;align-items:flex-start;gap:10px}
        .tec-card-info{flex:1;min-width:0}
        .tec-card-name{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:15px;letter-spacing:.06em;color:var(--text,#c8e8f5);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .tec-card-email{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.1em;color:var(--text2,#5c8fa8);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tec-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:2px;border:1px solid currentColor;font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.15em;white-space:nowrap;flex-shrink:0}
        .tec-badge-dot{width:4px;height:4px;border-radius:50%;background:currentColor}
        .tec-field{display:flex;align-items:center;gap:8px}
        .tec-field-key{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.25em;color:var(--text2,#5c8fa8);text-transform:uppercase;flex-shrink:0;min-width:52px}
        .tec-field-val{font-family:'Exo 2',sans-serif;font-size:11px;color:var(--text,#c8e8f5);opacity:.8}
        .face-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.15em}
        .tec-card-footer{display:flex;gap:6px;padding-top:10px;border-top:1px solid rgba(0,200,255,.06)}
        .btn-action{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:3px;border:1px solid transparent;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:10px;letter-spacing:.15em;text-transform:uppercase;cursor:pointer;background:transparent;transition:all .18s}
        .btn-edit{border-color:rgba(0,200,255,.2);color:var(--accent,#00c8ff)}
        .btn-edit:hover{border-color:var(--accent,#00c8ff);background:rgba(0,200,255,.07)}
        .btn-del{border-color:rgba(255,59,92,.15);color:rgba(255,59,92,.6)}
        .btn-del:hover{border-color:#ff3b5c;color:#ff3b5c;background:rgba(255,59,92,.06)}

        /* ── ACTIVIDAD CARD ── */
        .act-card{background:var(--surface,#0a1520);border:1px solid rgba(0,200,255,.1);border-radius:4px;padding:16px;position:relative;overflow:hidden;transition:all .2s}
        .act-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--pcolor,#00c8ff)}
        .act-card:hover{border-color:rgba(0,200,255,.22);transform:translateY(-1px)}
        .act-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}
        .act-card-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;letter-spacing:.06em;color:var(--text,#c8e8f5)}
        .act-prio-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:2px;border:1px solid currentColor;font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.15em;white-space:nowrap;flex-shrink:0}
        .act-fields{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
        .act-field-row{display:flex;gap:8px;align-items:baseline}
        .act-field-key{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.22em;color:var(--text2,#5c8fa8);text-transform:uppercase;flex-shrink:0;min-width:56px}
        .act-field-val{font-family:'Exo 2',sans-serif;font-size:11px;color:var(--text,#c8e8f5);opacity:.8}
        .act-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}
        .act-tag{display:inline-flex;padding:2px 7px;border-radius:2px;border:1px solid rgba(0,200,255,.12);font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.15em;color:var(--text2,#5c8fa8)}
        .act-done-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.12em}
        .act-card-footer{display:flex;gap:6px;padding-top:8px;border-top:1px solid rgba(0,200,255,.05)}

        /* ── EMPTY ── */
        .gt-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;gap:12px;border:1px dashed rgba(0,200,255,.1);border-radius:4px}
        .gt-empty span{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.3em;color:var(--text2,#5c8fa8);text-transform:uppercase}

        /* ── LOADING ── */
        .gt-loading{display:flex;align-items:center;justify-content:center;padding:60px;gap:10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.3em;color:var(--text2,#5c8fa8);text-transform:uppercase}
        @keyframes spin{to{transform:rotate(360deg)}}
        .gt-spinner-sm{width:14px;height:14px;border:1px solid rgba(0,255,163,.2);border-top-color:#00ffa3;border-radius:50%;animation:spin .7s linear infinite}

        /* ── MODAL SHARED ── */
        .gf-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
        .gf-modal{width:100%;max-height:92vh;overflow-y:auto;background:linear-gradient(160deg,#060e18 0%,#030508 100%);border:1px solid rgba(0,200,255,.2);border-radius:4px;position:relative;animation:pf-appear .22s ease;scrollbar-width:thin;scrollbar-color:rgba(0,200,255,.12) transparent}
        @keyframes pf-appear{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .gf-modal::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,#00ffa3,transparent 60%)}
        .gf-corner{position:absolute;width:10px;height:10px;border-color:rgba(0,200,255,.3);border-style:solid;pointer-events:none}
        .gf-corner.tl{top:6px;left:6px;border-width:1px 0 0 1px}
        .gf-corner.tr{top:6px;right:6px;border-width:1px 1px 0 0}
        .gf-corner.bl{bottom:6px;left:6px;border-width:0 0 1px 1px}
        .gf-corner.br{bottom:6px;right:6px;border-width:0 1px 1px 0}
        .gf-header{padding:22px 26px 16px;border-bottom:1px solid rgba(0,200,255,.08);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .gf-eyebrow{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.4em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-bottom:4px}
        .gf-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:20px;letter-spacing:.15em;color:var(--text,#c8e8f5);text-transform:uppercase}
        .gf-close{background:none;border:1px solid rgba(0,200,255,.15);border-radius:3px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:var(--text2,#5c8fa8);cursor:pointer;transition:all .18s;flex-shrink:0}
        .gf-close:hover{border-color:#ff3b5c;color:#ff3b5c}
        .gf-body{padding:20px 26px 18px;display:flex;flex-direction:column;gap:0}
        .gf-cols{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
        @media(max-width:580px){.gf-cols{grid-template-columns:1fr}}
        .gf-section-label{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.4em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-bottom:9px;display:flex;align-items:center;gap:8px;opacity:.7}
        .gf-section-label::after{content:'';flex:1;height:1px;background:rgba(0,200,255,.08)}
        .gf-field{margin-bottom:11px}
        .gf-field.focused .gf-label{color:#00ffa3}
        .gf-label{display:block;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.3em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-bottom:4px;transition:color .18s}
        .gf-req{color:#00ffa3;margin-left:2px}
        .gf-input,.gf-select,.gf-textarea{width:100%;background:rgba(0,200,255,.03);border:1px solid rgba(0,200,255,.15);border-radius:3px;padding:9px 13px;color:var(--text,#c8e8f5);font-family:'Exo 2',sans-serif;font-size:13px;outline:none;transition:all .18s;appearance:none}
        .gf-input::placeholder,.gf-textarea::placeholder{color:rgba(0,200,255,.18);font-size:12px}
        .gf-input:focus,.gf-select:focus,.gf-textarea:focus{border-color:rgba(0,255,163,.35);background:rgba(0,255,163,.03);box-shadow:0 0 0 3px rgba(0,255,163,.04)}
        .gf-textarea{resize:vertical;min-height:64px;line-height:1.5}
        .gf-select-wrap{position:relative}
        .gf-select-wrap::after{content:'▾';position:absolute;right:11px;top:50%;transform:translateY(-50%);color:var(--text2,#5c8fa8);pointer-events:none;font-size:11px}
        .gf-select option{background:#060e18;color:var(--text,#c8e8f5)}
        .gf-footer{padding:14px 26px 20px;border-top:1px solid rgba(0,200,255,.08);display:flex;justify-content:flex-end;gap:10px}
        .gf-btn{display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:3px;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:all .18s;border:1px solid transparent;background:transparent}
        .gf-btn-cancel{border-color:rgba(0,200,255,.15);color:var(--text2,#5c8fa8)}
        .gf-btn-cancel:hover{border-color:rgba(0,200,255,.3);color:var(--text,#c8e8f5)}
        .gf-btn-save{border-color:rgba(0,255,163,.4);color:#00ffa3;position:relative;overflow:hidden}
        .gf-btn-save::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(0,255,163,.07),transparent);transform:translateX(-100%);transition:transform .35s}
        .gf-btn-save:hover::before{transform:translateX(100%)}
        .gf-btn-save:hover{border-color:#00ffa3;box-shadow:0 0 16px rgba(0,255,163,.12)}
        .gf-btn-save:disabled{opacity:.5;cursor:not-allowed}
        .gf-spinner{width:12px;height:12px;border:1px solid rgba(0,255,163,.2);border-top-color:#00ffa3;border-radius:50%;animation:spin .7s linear infinite}
      `}</style>

      <div>
        {/* HEADER */}
        <div className="gt-header">
          <div>
            <div className="gt-eyebrow">Panel Administrativo</div>
            <div className="gt-title">GESTIÓN DE <span>TÉCNICOS</span></div>
          </div>
        </div>
        <div className="section-divider"/>

        {/* SUMMARY */}
        <div className="gt-summary">
          {[
            { label:"Técnicos Total",  value: tecnicos.length,  color:"#00c8ff" },
            { label:"Activos",         value: tecActivos,        color:"#00ffa3" },
            { label:"Face ID Reg.",    value: tecFace,           color:"#ffb020" },
            { label:"Actividades hoy", value: actHoy,            color:"#ff6b2b" },
            { label:"Completadas",     value: actCompletas,      color:"#00ffa3" },
            { label:"Total activ.",    value: actividades.length, color:"#00c8ff" },
          ].map(s=>(
            <div key={s.label} className="gt-sum-item">
              <div className="gt-sum-dot" style={{background:s.color,boxShadow:`0 0 5px ${s.color}`}}/>
              <div className="gt-sum-val" style={{color:s.color}}>{s.value}</div>
              <div className="gt-sum-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* MAIN TABS */}
        <div className="gt-tabs">
          <button className={`gt-tab ${tab==="tecnicos"?"active":""}`} onClick={()=>setTab("tecnicos")}>
            Técnicos ({tecnicos.length})
          </button>
          <button className={`gt-tab ${tab==="actividades"?"active":""}`}
            style={tab==="actividades"?{color:"#ffb020",borderBottomColor:"#ffb020"}:{}}
            onClick={()=>setTab("actividades")}>
            Actividades ({actividades.length})
          </button>
        </div>

        {/* ══════════ TAB: TÉCNICOS ══════════ */}
        {tab==="tecnicos" && (
          <>
            <div className="gt-toolbar">
              <div className={`gt-search-wrap ${focused?"focused":""}`}>
                <span className="gt-search-icon">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input className="gt-search-input" placeholder="Buscar técnico..." value={search}
                  onChange={e=>setSearch(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
              </div>
              <button className="btn-add-gt" onClick={()=>{setEditingTec(null);setShowTecModal(true)}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Nuevo Técnico
              </button>
            </div>
            <div className="gt-meta">{filteredTec.length} TÉCNICO{filteredTec.length!==1?"S":""}</div>

            {loading ? (
              <div className="gt-loading"><div className="gt-spinner-sm"/>CARGANDO...</div>
            ) : (
              <div className="gt-grid">
                {filteredTec.length===0 ? (
                  <div className="gt-empty">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.2">
                      <circle cx="20" cy="14" r="8" stroke="#00ffa3" strokeWidth="1.5"/>
                      <path d="M5 38c0-8.28 6.72-15 15-15s15 6.72 15 15" stroke="#00ffa3" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Sin técnicos registrados</span>
                  </div>
                ) : filteredTec.map(t=>{
                  const estCfg = ESTATUS_CFG[t.estatus]
                  return (
                    <div key={t.id} className="tec-card">
                      <div className="tec-card-head">
                        <Avatar name={t.nombre}/>
                        <div className="tec-card-info">
                          <div className="tec-card-name">{t.nombre}</div>
                          <div className="tec-card-email">{t.email}</div>
                        </div>
                        <span className="tec-badge" style={{color:estCfg.color,background:estCfg.bg}}>
                          <span className="tec-badge-dot"/>{t.estatus.toUpperCase()}
                        </span>
                      </div>

                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {t.telefono&&<div className="tec-field"><span className="tec-field-key">Teléfono</span><span className="tec-field-val">{t.telefono}</span></div>}
                        <div className="tec-field">
                          <span className="tec-field-key">Último login</span>
                          <span className="tec-field-val">
                            {t.ultimo_login ? new Date(t.ultimo_login).toLocaleDateString("es-MX") : "Nunca"}
                          </span>
                        </div>
                      </div>

                      {/* Face ID tag */}
                      <span className="face-tag" style={t.face_enrollado
                        ?{color:"#00ffa3",background:"rgba(0,255,163,.07)",border:"1px solid rgba(0,255,163,.2)"}
                        :{color:"#ffb020",background:"rgba(255,176,32,.07)",border:"1px solid rgba(255,176,32,.2)"}}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1"/>
                          <circle cx="3.5" cy="4.5" r=".7" fill="currentColor"/>
                          <circle cx="7.5" cy="4.5" r=".7" fill="currentColor"/>
                          <path d="M3.5 7.5c.5.7 3.5.7 4 0" stroke="currentColor" strokeWidth=".9" strokeLinecap="round"/>
                        </svg>
                        {t.face_enrollado ? "Face ID Registrado" : "Face ID Pendiente"}
                      </span>

                      <div className="tec-card-footer">
                        <button className="btn-action btn-edit" onClick={()=>{setEditingTec(t);setShowTecModal(true)}}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M6.5 1.5l2 2L2 10H0V8L6.5 1.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                          </svg>
                          Editar
                        </button>
                        <button className="btn-action btn-del" onClick={()=>setConfirmDelete({type:"tec",id:t.id,msg:`¿Desactivar al técnico "${t.nombre}"?`})}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 2.5h8M3.5 2.5V1.5h3v1M4 4.5v3M6 4.5v3M2 2.5l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
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

        {/* ══════════ TAB: ACTIVIDADES ══════════ */}
        {tab==="actividades" && (
          <>
            <div className="gt-toolbar">
              <div className={`gt-search-wrap ${focused?"focused":""}`}
                style={focused?{["--icon-color" as any]:"#ffb020"}:{}}>
                <span className="gt-search-icon">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input className="gt-search-input" placeholder="Buscar actividad..." value={actSearch}
                  onChange={e=>setActSearch(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                  style={{["--accent-focus" as any]:"rgba(255,176,32,.35)"}}/>
              </div>

              {/* Filtro por técnico */}
              <div style={{position:"relative"}}>
                <select style={{background:"rgba(0,200,255,.03)",border:"1px solid rgba(0,200,255,.15)",borderRadius:3,
                  padding:"9px 28px 9px 12px",color:"var(--text,#c8e8f5)",fontFamily:"'Share Tech Mono',monospace",
                  fontSize:10,letterSpacing:".1em",outline:"none",appearance:"none",cursor:"pointer"}}
                  value={actFiltroTec} onChange={e=>setActFiltroTec(e.target.value==="todos"?"todos":Number(e.target.value))}>
                  <option value="todos">Todos los técnicos</option>
                  {tecnicos.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <span style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",color:"var(--text2,#5c8fa8)",pointerEvents:"none",fontSize:11}}>▾</span>
              </div>

              {/* Filtro prioridad */}
              <div className="filter-pills">
                {([{k:"todos",l:"TODAS",c:"#5c8fa8"},{k:1,l:"ALTA",c:"#ff3b5c"},{k:2,l:"MEDIA",c:"#ffb020"},{k:3,l:"BAJA",c:"#00ffa3"}] as any[]).map(f=>(
                  <button key={f.k} className={`filter-pill ${actFiltroPrio===f.k?"active":""}`}
                    style={{color:actFiltroPrio===f.k?f.c:undefined}} onClick={()=>setActFiltroPrio(f.k)}>
                    <div className="fpill-dot" style={{background:f.c}}/>
                    {f.l}
                  </button>
                ))}
              </div>

              <button className="btn-add-gt btn-add-act" onClick={()=>{setEditingAct(null);setShowActModal(true)}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Nueva Actividad
              </button>
            </div>
            <div className="gt-meta">{filteredAct.length} ACTIVIDAD{filteredAct.length!==1?"ES":""}</div>

            {loading ? (
              <div className="gt-loading"><div className="gt-spinner-sm"/>CARGANDO...</div>
            ) : (
              <div className="gt-grid">
                {filteredAct.length===0 ? (
                  <div className="gt-empty">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.2">
                      <rect x="6" y="4" width="28" height="32" rx="2" stroke="#ffb020" strokeWidth="1.5"/>
                      <path d="M12 13h16M12 19h16M12 25h10" stroke="#ffb020" strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
                    </svg>
                    <span>Sin actividades registradas</span>
                  </div>
                ) : filteredAct.map(a=>{
                  const pc = PRIO_CFG[a.prioridad]
                  return (
                    <div key={a.id} className="act-card" style={{"--pcolor":pc.color}as React.CSSProperties}>
                      <div className="act-card-head">
                        <div className="act-card-title">{a.titulo}</div>
                        <span className="act-prio-badge" style={{color:pc.color}}>{pc.label}</span>
                      </div>

                      <div className="act-fields">
                        <div className="act-field-row"><span className="act-field-key">Técnico</span><span className="act-field-val">{a.tecnico_nombre||"—"}</span></div>
                        {a.proyecto_nombre&&<div className="act-field-row"><span className="act-field-key">Proyecto</span><span className="act-field-val">{a.proyecto_nombre}</span></div>}
                        {a.cliente_nombre&&<div className="act-field-row"><span className="act-field-key">Cliente</span><span className="act-field-val">{a.cliente_nombre}</span></div>}
                        <div className="act-field-row">
                          <span className="act-field-key">Fecha</span>
                          <span className="act-field-val">
                            {new Date(a.fecha_programada+"T12:00:00").toLocaleDateString("es-MX",{weekday:"short",day:"2-digit",month:"short"})}
                            {a.hora_inicio&&` · ${a.hora_inicio}`}
                            {a.hora_fin&&` – ${a.hora_fin}`}
                          </span>
                        </div>
                        {a.direccion&&<div className="act-field-row"><span className="act-field-key">Lugar</span><span className="act-field-val">{a.direccion}</span></div>}
                      </div>

                      <div className="act-tags">
                        <span className="act-tag">{TIPO_LABELS[a.tipo]||a.tipo}</span>
                        <span className="act-done-badge" style={a.completada
                          ?{color:"#00ffa3",background:"rgba(0,255,163,.07)",border:"1px solid rgba(0,255,163,.18)"}
                          :{color:"#5c8fa8",background:"rgba(0,0,0,.2)",border:"1px solid rgba(0,200,255,.07)"}}>
                          {a.completada?"✓ COMPLETADA":"○ PENDIENTE"}
                        </span>
                      </div>

                      <div className="act-card-footer">
                        <button className="btn-action btn-edit" onClick={()=>{setEditingAct(a);setShowActModal(true)}}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M6.5 1.5l2 2L2 10H0V8L6.5 1.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                          </svg>
                          Editar
                        </button>
                        <button className="btn-action btn-del" onClick={()=>setConfirmDelete({type:"act",id:a.id,msg:`¿Eliminar la actividad "${a.titulo}"?`})}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 2.5h8M3.5 2.5V1.5h3v1M4 4.5v3M6 4.5v3M2 2.5l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* MODALS */}
      {showTecModal && (
        <TecnicoModal tecnico={editingTec} onClose={()=>setShowTecModal(false)} onSaved={()=>{loadTecnicos();loadActividades()}}/>
      )}
      {showActModal && (
        <ActividadModal actividad={editingAct} tecnicos={tecnicos} proyectos={proyectos}
          onClose={()=>setShowActModal(false)} onSaved={()=>loadActividades()}/>
      )}
      {confirmDelete && (
        <ConfirmModal message={confirmDelete.msg}
          onConfirm={()=>confirmDelete.type==="tec"?handleDeleteTec(confirmDelete.id):handleDeleteAct(confirmDelete.id)}
          onCancel={()=>setConfirmDelete(null)}/>
      )}
    </>
  )
}