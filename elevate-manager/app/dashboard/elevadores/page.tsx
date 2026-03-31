"use client"

import { useState } from "react"
import '../../css/elevadores/elevadores.css'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type EstadoElevador = "Activo" | "Mantenimiento" | "Fuera de servicio" | "Instalación"
type TipoElevador   = "Hidráulico" | "Tracción" | "Panorámico" | "Montacargas"

interface Elevador {
  id: number
  nombre: string
  cliente: string
  ubicacion: string
  tipo: TipoElevador
  estado: EstadoElevador
  capacidad: number
  paradas: number
  ultimoMantenimiento: string
  proximoMantenimiento: string
  tecnicoAsignado?: string
  notas?: string
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK: Elevador[] = [
  { id:1, nombre:"Torre Reforma — Cabina 1", cliente:"Corporativo Alpha", ubicacion:"CDMX", tipo:"Tracción",    estado:"Activo",              capacidad:1000, paradas:22, ultimoMantenimiento:"2026-01-15", proximoMantenimiento:"2026-04-15", tecnicoAsignado:"Ing. Martínez" },
  { id:2, nombre:"Plaza Norte — Cabina 2",   cliente:"Grupo Delta",       ubicacion:"MTY",  tipo:"Hidráulico",  estado:"Mantenimiento",        capacidad:630,  paradas:8,  ultimoMantenimiento:"2026-02-01", proximoMantenimiento:"2026-03-28", tecnicoAsignado:"Ing. López", notas:"Revisión de guías y contrapeso" },
  { id:3, nombre:"Hospital Central",          cliente:"Corporativo Alpha", ubicacion:"GDL",  tipo:"Hidráulico",  estado:"Fuera de servicio",    capacidad:800,  paradas:6,  ultimoMantenimiento:"2025-12-10", proximoMantenimiento:"2026-03-20", notas:"Falla en sistema hidráulico principal" },
  { id:4, nombre:"Centro Comercial Sur",      cliente:"Grupo Delta",       ubicacion:"PUE",  tipo:"Panorámico",  estado:"Activo",              capacidad:500,  paradas:5,  ultimoMantenimiento:"2026-02-20", proximoMantenimiento:"2026-05-20" },
  { id:5, nombre:"Edificio Nexus",            cliente:"Inmobiliaria Z",    ubicacion:"CDMX", tipo:"Tracción",    estado:"Instalación",          capacidad:1000, paradas:18, ultimoMantenimiento:"—",          proximoMantenimiento:"2026-04-01", tecnicoAsignado:"Ing. García" },
  { id:6, nombre:"Bodega Industrial Norte",   cliente:"Logística MX",      ubicacion:"MTY",  tipo:"Montacargas", estado:"Activo",              capacidad:3000, paradas:3,  ultimoMantenimiento:"2026-01-30", proximoMantenimiento:"2026-04-30" },
]

const ESTADO_CFG: Record<EstadoElevador, { color:string; bg:string }> = {
  "Activo":            { color:"#00ffa3", bg:"rgba(0,255,163,0.08)"  },
  "Mantenimiento":     { color:"#ffb020", bg:"rgba(255,176,32,0.08)" },
  "Fuera de servicio": { color:"#ff3b5c", bg:"rgba(255,59,92,0.08)"  },
  "Instalación":       { color:"#00c8ff", bg:"rgba(0,200,255,0.08)"  },
}

const TIPO_CFG: Record<TipoElevador, { color:string; icon:string }> = {
  "Hidráulico":  { color:"#00c8ff", icon:"▲" },
  "Tracción":    { color:"#00ffa3", icon:"⬡" },
  "Panorámico":  { color:"#ff6b2b", icon:"◈" },
  "Montacargas": { color:"#ffb020", icon:"◧" },
}

type ViewMode = "grid" | "table"

export default function ElevadoresPage() {
  const [elevadores]   = useState<Elevador[]>(MOCK)
  const [search,        setSearch]        = useState("")
  const [estadoFilter,  setEstadoFilter]  = useState<EstadoElevador | "TODOS">("TODOS")
  const [viewMode,      setViewMode]      = useState<ViewMode>("grid")
  const [selected,      setSelected]      = useState<Elevador | null>(null)
  const [focused,       setFocused]       = useState(false)

  const filtered = elevadores.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = e.nombre.toLowerCase().includes(q) || e.cliente.toLowerCase().includes(q) || e.ubicacion.toLowerCase().includes(q)
    const matchEstado = estadoFilter === "TODOS" || e.estado === estadoFilter
    return matchSearch && matchEstado
  })

  const counts = {
    TODOS: elevadores.length,
    "Activo":            elevadores.filter(e => e.estado === "Activo").length,
    "Mantenimiento":     elevadores.filter(e => e.estado === "Mantenimiento").length,
    "Fuera de servicio": elevadores.filter(e => e.estado === "Fuera de servicio").length,
    "Instalación":       elevadores.filter(e => e.estado === "Instalación").length,
  }

  return (
    <>
      <div>
        <div className="elv-header">
          <div>
            <div className="elv-eyebrow">Inventario Operativo</div>
            <div className="elv-title">GESTIÓN DE <span>ELEVADORES</span></div>
          </div>
        </div>
        <div className="section-divider" />

        {/* SUMMARY */}
        <div className="elv-summary">
          {([
            { key:"TODOS",             label:"Total",         value: counts["TODOS"],             color:"#00c8ff" },
            { key:"Activo",            label:"Activos",       value: counts["Activo"],            color:"#00ffa3" },
            { key:"Mantenimiento",     label:"Mantenimiento", value: counts["Mantenimiento"],     color:"#ffb020" },
            { key:"Fuera de servicio", label:"Fuera servicio",value: counts["Fuera de servicio"], color:"#ff3b5c" },
            { key:"Instalación",       label:"Instalación",   value: counts["Instalación"],       color:"#00c8ff" },
          ] as {key:string;label:string;value:number;color:string}[]).map(s => (
            <div key={s.key} className={`elv-sum-item ${estadoFilter === s.key ? 'active' : ''}`}
              style={{ color: estadoFilter === s.key ? s.color : undefined }}
              onClick={() => setEstadoFilter(s.key as any)}>
              <div className="elv-sum-dot" style={{ background:s.color, boxShadow:`0 0 5px ${s.color}` }}/>
              <div className="elv-sum-val" style={{ color:s.color }}>{s.value}</div>
              <div className="elv-sum-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="elv-toolbar">
          <div className={`elv-search-wrap ${focused ? 'focused' : ''}`}>
            <span className="elv-search-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </span>
            <input className="elv-search-input" placeholder="Buscar por nombre, cliente o ubicación..." value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}/>
          </div>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1"/></svg>
            </button>
            <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
        <div className="elv-meta">{filtered.length} ELEVADOR{filtered.length !== 1 ? 'ES' : ''}</div>

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="elv-grid">
            {filtered.length === 0 ? (
              <div className="elv-empty" style={{ gridColumn:'1/-1' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.2"><rect x="4" y="2" width="32" height="36" rx="2" stroke="#00c8ff" strokeWidth="1.5"/><line x1="20" y1="2" x2="20" y2="38" stroke="#00c8ff" strokeWidth="1" opacity=".4"/><rect x="9" y="13" width="22" height="14" rx="1" stroke="#00c8ff" strokeWidth="1.2"/></svg>
                <span>Sin elevadores para mostrar</span>
              </div>
            ) : filtered.map(e => {
              const estCfg  = ESTADO_CFG[e.estado]
              const tipoCfg = TIPO_CFG[e.tipo]
              const alerta  = (() => { const d = (new Date(e.proximoMantenimiento).getTime() - Date.now()) / 86400000; return d <= 7 && d > 0 })()
              return (
                <div key={e.id} className="elv-card" style={{ '--card-accent':tipoCfg.color } as React.CSSProperties} onClick={() => setSelected(e)}>
                  <div className="elv-card-head">
                    <div>
                      <div className="elv-tipo-tag" style={{ color:tipoCfg.color }}><span>{tipoCfg.icon}</span>{e.tipo.toUpperCase()}</div>
                      <div className="elv-card-name">{e.nombre}</div>
                    </div>
                    <span className="elv-badge" style={{ color:estCfg.color, background:estCfg.bg }}>
                      <span className="elv-badge-dot"/>{e.estado}
                    </span>
                  </div>
                  <div className="elv-specs">
                    <div className="elv-spec"><div className="elv-spec-key">Capacidad</div><div className="elv-spec-val">{e.capacidad} <span style={{ fontSize:10, fontFamily:"'Share Tech Mono',monospace", opacity:.5 }}>kg</span></div></div>
                    <div className="elv-spec"><div className="elv-spec-key">Paradas</div><div className="elv-spec-val">{e.paradas}</div></div>
                  </div>
                  <div className="elv-fields">
                    <div className="elv-field"><span className="elv-field-key">Cliente</span><span className="elv-field-val">{e.cliente}</span></div>
                    <div className="elv-field"><span className="elv-field-key">Ubicación</span><span className="elv-field-val">{e.ubicacion}</span></div>
                    {e.tecnicoAsignado && <div className="elv-field"><span className="elv-field-key">Técnico</span><span className="elv-field-val">{e.tecnicoAsignado}</span></div>}
                    <div className="elv-field"><span className="elv-field-key">Próx. Mant.</span><span className="elv-field-val">{e.proximoMantenimiento}</span></div>
                  </div>
                  {alerta && (
                    <div className="elv-warning">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L9.5 9H.5L5 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/><path d="M5 4.5v2M5 7.5v.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                      Mantenimiento en menos de 7 días
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="elv-table-panel">
            <div style={{ overflowX:'auto' }}>
              <table className="elv-table">
                <thead>
                  <tr><th>Elevador</th><th>Tipo</th><th>Cliente</th><th>Ubicación</th><th>Estado</th><th>Capacidad</th><th>Paradas</th><th>Próx. Mant.</th><th>Técnico</th></tr>
                </thead>
                <tbody>
                  {filtered.map(e => {
                    const estCfg  = ESTADO_CFG[e.estado]
                    const tipoCfg = TIPO_CFG[e.tipo]
                    return (
                      <tr key={e.id} onClick={() => setSelected(e)}>
                        <td style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:14 }}>{e.nombre}</td>
                        <td><span style={{ color:tipoCfg.color, fontFamily:"'Share Tech Mono',monospace", fontSize:9, letterSpacing:'.15em' }}>{tipoCfg.icon} {e.tipo.toUpperCase()}</span></td>
                        <td style={{ color:'var(--text2,#5c8fa8)' }}>{e.cliente}</td>
                        <td style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'var(--text2,#5c8fa8)', letterSpacing:'.1em' }}>{e.ubicacion}</td>
                        <td><span className="elv-badge" style={{ color:estCfg.color, background:estCfg.bg }}><span className="elv-badge-dot"/>{e.estado}</span></td>
                        <td style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>{e.capacidad} kg</td>
                        <td style={{ textAlign:'center' }}>{e.paradas}</td>
                        <td style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'var(--text2,#5c8fa8)' }}>{e.proximoMantenimiento}</td>
                        <td style={{ fontSize:11, color:'var(--text2,#5c8fa8)' }}>{e.tecnicoAsignado || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DETAIL MODAL */}
        {selected && (
          <div className="elv-modal-backdrop" onClick={() => setSelected(null)}>
            <div className="elv-modal" onClick={e => e.stopPropagation()}>
              <div className="elv-modal-corner tl"/><div className="elv-modal-corner tr"/>
              <div className="elv-modal-corner bl"/><div className="elv-modal-corner br"/>
              <div className="elv-modal-header">
                <div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:'.35em', color:'var(--text2,#5c8fa8)', marginBottom:4 }}>Ficha técnica</div>
                  <div className="elv-modal-title">{selected.nombre}</div>
                  {(() => { const t=TIPO_CFG[selected.tipo]; return <span style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:6, fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:'.2em', color:t.color }}>{t.icon} {selected.tipo.toUpperCase()}</span> })()}
                </div>
                <button className="elv-modal-close" onClick={() => setSelected(null)}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="elv-modal-body">
                {(() => { const c=ESTADO_CFG[selected.estado]; return <span className="elv-badge" style={{ color:c.color, background:c.bg, alignSelf:'flex-start' }}><span className="elv-badge-dot"/>{selected.estado}</span> })()}
                <div className="elv-modal-specs">
                  <div className="elv-modal-spec"><div className="elv-modal-spec-key">Capacidad</div><div className="elv-modal-spec-val">{selected.capacidad} kg</div></div>
                  <div className="elv-modal-spec"><div className="elv-modal-spec-key">Paradas</div><div className="elv-modal-spec-val">{selected.paradas}</div></div>
                  <div className="elv-modal-spec"><div className="elv-modal-spec-key">Último Mant.</div><div className="elv-modal-spec-val" style={{ fontSize:13 }}>{selected.ultimoMantenimiento}</div></div>
                  <div className="elv-modal-spec"><div className="elv-modal-spec-key">Próx. Mant.</div><div className="elv-modal-spec-val" style={{ fontSize:13 }}>{selected.proximoMantenimiento}</div></div>
                </div>
                {[
                  { k:'Cliente',  v:selected.cliente },
                  { k:'Ubicación',v:selected.ubicacion },
                  ...(selected.tecnicoAsignado ? [{ k:'Técnico', v:selected.tecnicoAsignado }] : []),
                  ...(selected.notas ? [{ k:'Notas', v:selected.notas }] : []),
                ].map(f => (
                  <div key={f.k} style={{ display:'flex', gap:10, alignItems:'baseline' }}>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:'.25em', color:'var(--text2,#5c8fa8)', textTransform:'uppercase', minWidth:68, flexShrink:0 }}>{f.k}</span>
                    <span style={{ fontFamily:"'Exo 2',sans-serif", fontSize:13, color:'var(--text,#c8e8f5)' }}>{f.v}</span>
                  </div>
                ))}
              </div>
              <div className="elv-modal-footer">
                <button className="elv-modal-btn" onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}