"use client"

import { useMemo, useState } from "react"
import MexicoMap from "@/app/components/MexicoMap"
import '../../css/principal/principal.css'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type EstadoEquipo   = "Operativo" | "Revisión" | "Fuera de servicio"
type ClienteFiltro  = "Todos" | "Corporativo Alpha" | "Grupo Delta"

interface Elevador {
  id: number
  nombre: string
  cliente: string
  estado: EstadoEquipo
  proximoMantenimiento: string
  incidenciaActiva: boolean
  ubicacion?: string
  ultimoServicio?: string
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const ELEVADORES: Elevador[] = [
  { id:1, nombre:"Torre A — Cabina 1",     cliente:"Corporativo Alpha", estado:"Operativo",         proximoMantenimiento:"2026-04-10", incidenciaActiva:false, ubicacion:"CDMX", ultimoServicio:"2026-01-15" },
  { id:2, nombre:"Plaza Norte — Cabina 2", cliente:"Grupo Delta",       estado:"Revisión",           proximoMantenimiento:"2026-03-28", incidenciaActiva:true,  ubicacion:"MTY",  ultimoServicio:"2026-02-01" },
  { id:3, nombre:"Hospital Central",       cliente:"Corporativo Alpha", estado:"Fuera de servicio",  proximoMantenimiento:"2026-03-20", incidenciaActiva:true,  ubicacion:"GDL",  ultimoServicio:"2025-12-10" },
  { id:4, nombre:"Centro Comercial Sur",   cliente:"Grupo Delta",       estado:"Operativo",          proximoMantenimiento:"2026-05-01", incidenciaActiva:false, ubicacion:"PUE",  ultimoServicio:"2026-02-20" },
]

const ESTADO_CONFIG: Record<EstadoEquipo, { color: string; bg: string; dot: string }> = {
  "Operativo":        { color:"#00ffa3", bg:"rgba(0,255,163,0.08)",  dot:"#00ffa3"  },
  "Revisión":         { color:"#ffb020", bg:"rgba(255,176,32,0.08)", dot:"#ffb020"  },
  "Fuera de servicio":{ color:"#ff3b5c", bg:"rgba(255,59,92,0.08)",  dot:"#ff3b5c"  },
}

// ─── MINI SPARKLINE (SVG) ─────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const w = 80, h = 28
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <polyline points={`0,${h} ${pts} ${w},${h}`} stroke={color} strokeWidth="0" fill={color} opacity="0.07"/>
    </svg>
  )
}

// ─── STAT CARD (large) ────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  delta?: string
  up?: boolean
  icon: React.ReactNode
  accent: string
  sparkline?: number[]
}

function StatCard({ label, value, sub, delta, up, icon, accent, sparkline }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--card-accent': accent } as React.CSSProperties}>
      <div className="stat-card-top">
        <div className="stat-icon" style={{ color: accent }}>{icon}</div>
        {delta && (
          <span className="stat-delta" style={{
            color: up ? '#00ffa3' : '#ff3b5c',
            background: up ? 'rgba(0,255,163,0.08)' : 'rgba(255,59,92,0.08)',
            border: `1px solid ${up ? 'rgba(0,255,163,0.2)' : 'rgba(255,59,92,0.2)'}`,
          }}>
            {delta}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {sparkline && (
        <div style={{ marginTop: 10 }}>
          <Sparkline values={sparkline} color={accent} />
        </div>
      )}
    </div>
  )
}

// ─── ACTIVITY ROW ─────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { time: '08:42', msg: 'Mantenimiento completado — Torre A Cab.1',      type: 'ok'   },
  { time: '10:15', msg: 'Incidencia registrada — Hospital Central',       type: 'warn' },
  { time: '11:30', msg: 'Técnico asignado — Ing. Martínez a Plaza Norte', type: 'info' },
  { time: '13:00', msg: 'Cotización aprobada — Grupo Delta #COT-0047',    type: 'ok'   },
  { time: '14:22', msg: 'Elevador fuera de servicio — Cab.3 Hospital',    type: 'err'  },
]

const ACT_COLORS = { ok:'#00ffa3', warn:'#ffb020', err:'#ff3b5c', info:'#00c8ff' }

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, letterSpacing:'0.2em', color:'var(--text2,#5c8fa8)', textTransform:'uppercase' }}>{label}</span>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, color }}>{value}<span style={{ color:'var(--text2,#5c8fa8)', fontWeight:400, fontSize:10 }}>/{total}</span></span>
      </div>
      <div style={{ height:3, background:'rgba(0,200,255,0.08)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, boxShadow:`0 0 6px ${color}`, transition:'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PrincipalPage() {
  const [clienteFiltro, setClienteFiltro] = useState<ClienteFiltro>("Todos")

  const filtrados = useMemo(() =>
    clienteFiltro === "Todos" ? ELEVADORES : ELEVADORES.filter(e => e.cliente === clienteFiltro),
    [clienteFiltro]
  )

  const total      = ELEVADORES.length
  const operativos = ELEVADORES.filter(e => e.estado === "Operativo").length
  const revision   = ELEVADORES.filter(e => e.estado === "Revisión").length
  const fuera      = ELEVADORES.filter(e => e.estado === "Fuera de servicio").length
  const incidencias = ELEVADORES.filter(e => e.incidenciaActiva).length
  const proximos   = ELEVADORES.filter(e => {
    const diff = (new Date(e.proximoMantenimiento).getTime() - Date.now()) / 86400000
    return diff <= 7
  }).length

  return (
    <>
      <div>

        {/* ── HEADER ── */}
        <div className="prin-header">
          <div>
            <div className="prin-eyebrow">Monitoreo en Tiempo Real</div>
            <div className="prin-title">PANEL <span>PRINCIPAL</span></div>
            <div className="prin-subtitle">
              {new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' }).toUpperCase()}
            </div>
          </div>
          <div className="prin-filter-wrap">
            <select
              className="prin-filter"
              value={clienteFiltro}
              onChange={e => setClienteFiltro(e.target.value as ClienteFiltro)}
            >
              <option value="Todos">Todos los clientes</option>
              <option value="Corporativo Alpha">Corporativo Alpha</option>
              <option value="Grupo Delta">Grupo Delta</option>
            </select>
          </div>
        </div>

        <div className="section-divider" />

        {/* ── STAT CARDS ── */}
        <div className="stat-grid">
          <StatCard
            label="Elevadores Totales"
            value={total}
            sub="En cartera activa"
            delta="+2 este mes"
            up={true}
            accent="#00c8ff"
            sparkline={[3,5,4,6,5,7,8,total]}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/>
                <rect x="5" y="7" width="10" height="6" rx="0.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1"/>
                <polyline points="7,5 10,2 13,5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              </svg>
            }
          />
          <StatCard
            label="Operativos"
            value={operativos}
            sub={`${Math.round((operativos/total)*100)}% de la flota`}
            delta="+1"
            up={true}
            accent="#00ffa3"
            sparkline={[4,3,5,4,4,5,operativos,operativos]}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <StatCard
            label="Incidencias Activas"
            value={incidencias}
            sub="Requieren atención"
            delta={incidencias > 0 ? `+${incidencias}` : '—'}
            up={false}
            accent="#ff3b5c"
            sparkline={[1,0,2,1,3,2,incidencias,incidencias]}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3L18 17H2L10 3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M10 9v3M10 14.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            }
          />
          <StatCard
            label="Mant. Próximos"
            value={proximos}
            sub="En los próximos 7 días"
            delta="Esta semana"
            up={true}
            accent="#ffb020"
            sparkline={[2,3,1,4,2,3,proximos,proximos]}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
        </div>

        {/* ── MID SECTION: fleet breakdown + activity + quick metrics ── */}
        <div className="mid-grid">

          {/* Fleet status breakdown */}
          <div className="mini-card" style={{ '--card-accent':'#00c8ff' } as React.CSSProperties}>
            <div className="mini-card-title">
              <div className="mini-card-title-dot" />
              Estado de la Flota
            </div>
            <ProgressBar label="Operativos"         value={operativos} total={total} color="#00ffa3" />
            <ProgressBar label="En Revisión"        value={revision}   total={total} color="#ffb020" />
            <ProgressBar label="Fuera de Servicio"  value={fuera}      total={total} color="#ff3b5c" />
          </div>

          {/* Activity feed */}
          <div className="mini-card" style={{ '--card-accent':'#00ffa3' } as React.CSSProperties}>
            <div className="mini-card-title">
              <div className="mini-card-title-dot" style={{ background:'#00ffa3', boxShadow:'0 0 5px #00ffa3' }} />
              Actividad Reciente
            </div>
            {ACTIVITIES.slice(0,4).map((a, i) => (
              <div key={i} className="activity-item">
                <span className="activity-time">{a.time}</span>
                <div className="activity-dot" style={{ background: ACT_COLORS[a.type as keyof typeof ACT_COLORS] }} />
                <span className="activity-msg">{a.msg}</span>
              </div>
            ))}
          </div>

          {/* Quick metrics */}
          <div className="mini-card" style={{ '--card-accent':'#ffb020' } as React.CSSProperties}>
            <div className="mini-card-title">
              <div className="mini-card-title-dot" style={{ background:'#ffb020', boxShadow:'0 0 5px #ffb020' }} />
              Métricas del Período
            </div>
            {[
              { label:'Proyectos Activos',   value:'24',   color:'#00c8ff' },
              { label:'Ventas del Mes',       value:'$1.4M',color:'#00ffa3' },
              { label:'Técnicos en Campo',    value:'11',   color:'#ffb020' },
              { label:'Cotizaciones Abiertas',value:'8',    color:'#00c8ff' },
              { label:'Contratos en Curso',   value:'5',    color:'#00ffa3' },
            ].map(m => (
              <div key={m.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(0,200,255,0.05)' }}>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, letterSpacing:'0.15em', color:'var(--text2,#5c8fa8)', textTransform:'uppercase' }}>{m.label}</span>
                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:16, color:m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAP + INCIDENCIAS ── */}
        <div className="bottom-grid">
          <div className="panel">
            <div className="panel-title">
              <div className="panel-title-dot" />
              Mapa de Operación
            </div>
            <div className="map-container">
              <MexicoMap />
            </div>
          </div>

          <div className="panel" style={{ borderColor:'rgba(255,59,92,0.15)' }}>
            <div className="panel-title" style={{ color:'var(--text,#c8e8f5)' }}>
              <div className="panel-title-dot" style={{ background:'#ff3b5c', boxShadow:'0 0 6px #ff3b5c' }} />
              Incidencias Activas
              {incidencias > 0 && (
                <span style={{ marginLeft:'auto', fontFamily:"'Share Tech Mono',monospace", fontSize:9, padding:'2px 8px', border:'1px solid rgba(255,59,92,0.3)', color:'#ff3b5c', borderRadius:2 }}>
                  {incidencias} ACTIVA{incidencias > 1 ? 'S' : ''}
                </span>
              )}
            </div>

            {filtrados.filter(e => e.incidenciaActiva).length === 0 ? (
              <div className="empty-incidencias">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="12" stroke="#00ffa3" strokeWidth="1" opacity="0.4"/>
                  <path d="M11 16l3.5 3.5 6.5-6.5" stroke="#00ffa3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                </svg>
                <span>Sin incidencias activas</span>
              </div>
            ) : (
              filtrados.filter(e => e.incidenciaActiva).map(e => (
                <div key={e.id} className="incidencia-item">
                  <div className="incidencia-nombre">{e.nombre}</div>
                  <div className="incidencia-cliente">Cliente: {e.cliente}</div>
                  {e.ubicacion && (
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'rgba(255,59,92,0.4)', letterSpacing:'0.15em', marginTop:2 }}>
                      LOC: {e.ubicacion}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── EQUIPMENT TABLE ── */}
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-dot" />
            Estado General de Equipos
            <span style={{ marginLeft:'auto', fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'var(--text2,#5c8fa8)', letterSpacing:'0.15em' }}>
              {filtrados.length} REGISTRO{filtrados.length !== 1 ? 'S' : ''}
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="equip-table">
              <thead>
                <tr>
                  <th>Elevador</th>
                  <th>Cliente</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Último Servicio</th>
                  <th>Próx. Mantenimiento</th>
                  <th>Incidencia</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(e => {
                  const cfg = ESTADO_CONFIG[e.estado]
                  return (
                    <tr key={e.id}>
                      <td style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:14, letterSpacing:'0.04em' }}>{e.nombre}</td>
                      <td style={{ color:'var(--text2,#5c8fa8)', fontSize:12 }}>{e.cliente}</td>
                      <td style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'var(--text2,#5c8fa8)', letterSpacing:'0.1em' }}>{e.ubicacion || '—'}</td>
                      <td>
                        <span className="estado-badge" style={{ color: cfg.color, background: cfg.bg }}>
                          <span className="estado-dot" />
                          {e.estado}
                        </span>
                      </td>
                      <td style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'var(--text2,#5c8fa8)' }}>{e.ultimoServicio || '—'}</td>
                      <td style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'var(--text2,#5c8fa8)' }}>{e.proximoMantenimiento}</td>
                      <td>
                        {e.incidenciaActiva ? (
                          <span className="incid-pill" style={{ color:'#ff3b5c', background:'rgba(255,59,92,0.08)', border:'1px solid rgba(255,59,92,0.2)' }}>
                            ● ACTIVA
                          </span>
                        ) : (
                          <span className="incid-pill" style={{ color:'rgba(0,200,255,0.3)', background:'transparent' }}>
                            — NINGUNA
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}