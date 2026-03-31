'use client'

import { useState, useEffect } from 'react'
import { useProyectos, Proyecto } from '../../contexts/ProyectosContext'
import '../../../css/proyectos/calendario/calendario.css'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const TIPO_CONFIG = {
  Instalación: { color: '#ff6b2b', bg: 'rgba(255,107,43,0.15)', border: 'rgba(255,107,43,0.4)' },
  Ajuste:      { color: '#00c8ff', bg: 'rgba(0,200,255,0.1)',   border: 'rgba(0,200,255,0.35)' },
  Otro:        { color: '#00ffa3', bg: 'rgba(0,255,163,0.1)',   border: 'rgba(0,255,163,0.35)' },
} as const

type TipoKey = keyof typeof TIPO_CONFIG

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function normalizeTipo(tipo?: string | null): TipoKey {
  if (!tipo) return 'Otro'
  const t = tipo.toLowerCase().trim()
  if (t.includes('instal')) return 'Instalación'
  if (t.includes('ajust'))  return 'Ajuste'
  return 'Otro'
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function CalendarioPage() {
  const { proyectos } = useProyectos()

  const today = new Date()
  const [month,    setMonth]    = useState(today.getMonth())
  const [year,     setYear]     = useState(today.getFullYear())
  const [selected, setSelected] = useState<Proyecto | null>(null)
  const [filtros,  setFiltros]  = useState<Record<TipoKey, boolean>>({
    Instalación: true,
    Ajuste:      true,
    Otro:        true,
  })

  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const firstWeekDay = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])

  const toggleFiltro = (tipo: TipoKey) =>
    setFiltros(prev => ({ ...prev, [tipo]: !prev[tipo] }))

  const getProjectsForDay = (day: number) =>
    proyectos.filter(p => {
      if (!filtros[normalizeTipo(p.tipo_proveedor)]) return false
      const d = new Date(year, month, day)
      return d >= new Date(p.fechaInicio) && d <= new Date(p.fechaEntrega)
    })

  const changeMonth = (dir: -1 | 1) => {
    setMonth(prev => {
      const next = prev + dir
      if (next < 0)  { setYear(y => y - 1); return 11 }
      if (next > 11) { setYear(y => y + 1); return 0  }
      return next
    })
  }

  const monthLabel = new Date(year, month).toLocaleString('es-MX', { month: 'long' })
  const isToday    = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  // total proyectos activos este mes
  const totalMes = proyectos.filter(p => {
    const s = new Date(p.fechaInicio), e = new Date(p.fechaEntrega)
    const ms = new Date(year, month, 1), me = new Date(year, month + 1, 0)
    return s <= me && e >= ms
  }).length

  return (
    <>
      <div>

        {/* ── HEADER ── */}
        <div className="cal-header">
          <div>
            <div className="cal-eyebrow">Planificación</div>
            <div className="cal-title">CALENDARIO <span>DE PROYECTOS</span></div>
            <div className="cal-month-label">{monthLabel} {year}</div>
          </div>

          <div className="cal-nav-row">
            <div className="cal-meta-badge">
              <strong>{totalMes}</strong> proyecto{totalMes !== 1 ? 's' : ''} este mes
            </div>
            <button className="cal-nav-btn" onClick={() => changeMonth(-1)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="cal-nav-btn" onClick={() => changeMonth(1)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="section-divider" />

        {/* ── FILTROS ── */}
        <div className="cal-filtros">
          {(Object.keys(TIPO_CONFIG) as TipoKey[]).map(tipo => {
            const cfg    = TIPO_CONFIG[tipo]
            const active = filtros[tipo]
            return (
              <button
                key={tipo}
                className={`filtro-pill ${active ? 'active' : 'inactive'}`}
                style={{ color: active ? cfg.color : undefined }}
                onClick={() => toggleFiltro(tipo)}
              >
                <span className="filtro-dot" style={{ background: cfg.color }} />
                {tipo}
              </button>
            )
          })}
        </div>

        {/* ── WEEKDAY HEADERS ── */}
        <div className="cal-weekdays">
          {WEEK_DAYS.map(d => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}
        </div>

        {/* ── CALENDAR GRID ── */}
        <div className="cal-grid">

          {/* empty offset cells */}
          {Array.from({ length: firstWeekDay }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-empty" />
          ))}

          {/* day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const projects = getProjectsForDay(day)
            const today_   = isToday(day)

            return (
              <div key={day} className={`cal-cell ${today_ ? 'today' : ''}`}>
                <div className="cal-day-num">{String(day).padStart(2,'0')}</div>

                {projects.length === 0 && (
                  <div className="cal-cell-empty-msg">—</div>
                )}

                {projects.map(p => {
                  const cfg = TIPO_CONFIG[normalizeTipo(p.tipo_proveedor)]
                  return (
                    <div
                      key={p.id}
                      className="cal-chip"
                      style={{
                        color:      cfg.color,
                        background: cfg.bg,
                        borderColor:cfg.border,
                      }}
                      onClick={() => setSelected(p)}
                    >
                      {p.nombre}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── MODAL ── */}
        {selected && (
          <div className="cal-modal-backdrop" onClick={() => setSelected(null)}>
            <div className="cal-modal" onClick={e => e.stopPropagation()}>
              <div className="cal-modal-corner tl" />
              <div className="cal-modal-corner tr" />
              <div className="cal-modal-corner bl" />
              <div className="cal-modal-corner br" />

              {/* header */}
              <div className="cal-modal-header">
                <div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:'0.35em', color:'var(--text2,#5c8fa8)', marginBottom:4, textTransform:'uppercase' }}>
                    Detalle del proyecto
                  </div>
                  <div className="cal-modal-title">{selected.nombre}</div>
                  {/* tipo tag */}
                  {(() => {
                    const cfg = TIPO_CONFIG[normalizeTipo(selected.tipo_proveedor)]
                    return (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:6, padding:'2px 8px', border:`1px solid ${cfg.color}`, borderRadius:2, fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:'0.2em', color:cfg.color, background:cfg.bg }}>
                        {normalizeTipo(selected.tipo_proveedor).toUpperCase()}
                      </span>
                    )
                  })()}
                </div>
                <button className="cal-modal-close" onClick={() => setSelected(null)}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* body */}
              <div className="cal-modal-body">
                <div className="cal-modal-field">
                  <span className="cal-modal-key">Cliente</span>
                  <span className="cal-modal-val">{selected.cliente}</span>
                </div>
                <div className="cal-modal-field">
                  <span className="cal-modal-key">Ubicación</span>
                  <span className="cal-modal-val">{selected.ubicacion}</span>
                </div>

                {/* date range */}
                <div className="cal-modal-dates">
                  <span className="cal-modal-date">{selected.fechaInicio}</span>
                  <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
                    <path d="M1 4h13M11 1l3 3-3 3" stroke="rgba(0,200,255,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="cal-modal-date">{selected.fechaEntrega}</span>
                </div>

                {selected.descripcion && (
                  <div className="cal-modal-desc">{selected.descripcion}</div>
                )}
              </div>

              {/* footer */}
              <div className="cal-modal-footer">
                <button className="cal-modal-btn" onClick={() => setSelected(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}