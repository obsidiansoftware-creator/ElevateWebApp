'use client'

import { useState } from 'react'
import { useProyectos, Proyecto } from '@/app/dashboard/contexts/ProyectosContext'
import ProyectoForm from '@/app/dashboard/proyectos/proyectos/ProyectForm'
import '../../css/proyectos/proyectos.css'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type StatusLabel = 'ACTIVO' | 'POR INICIAR' | 'FINALIZADO'

interface ProyectoStatus {
  label: StatusLabel
  color: string
  dotColor: string
  priority: number
}

type ProyectoWithStatus = Proyecto & { status: ProyectoStatus }

type FilterOption = 'TODOS' | StatusLabel

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getProyectoStatus(fechaInicio: string, fechaEntrega: string): ProyectoStatus {
  const hoy   = new Date(); hoy.setHours(0,0,0,0)
  const inicio = new Date(fechaInicio); inicio.setHours(0,0,0,0)
  const fin    = new Date(fechaEntrega); fin.setHours(0,0,0,0)

  if (hoy < inicio) return { label: 'POR INICIAR', color: 'rgba(255,176,32,0.15)',  dotColor: '#ffb020', priority: 2 }
  if (hoy > fin)    return { label: 'FINALIZADO',  color: 'rgba(255,59,92,0.12)',   dotColor: '#ff3b5c', priority: 3 }
  return               { label: 'ACTIVO',       color: 'rgba(0,255,163,0.1)',    dotColor: '#00ffa3', priority: 1 }
}

function getTipoTag(tipo?: string | null): { label: string; color: string; bg: string } {
  if (!tipo) return { label: 'OTRO', color: '#5c8fa8', bg: 'rgba(92,143,168,0.12)' }
  const t = tipo.toLowerCase().trim()
  if (t.includes('instal')) return { label: tipo.toUpperCase(), color: '#ff6b2b', bg: 'rgba(255,107,43,0.12)' }
  if (t.includes('ajust'))  return { label: tipo.toUpperCase(), color: '#00c8ff', bg: 'rgba(0,200,255,0.1)' }
  return { label: tipo.toUpperCase(), color: '#00ffa3', bg: 'rgba(0,255,163,0.1)' }
}

const STATUS_FILTERS: FilterOption[] = ['TODOS', 'ACTIVO', 'POR INICIAR', 'FINALIZADO']

const STATUS_FILTER_COLORS: Record<FilterOption, string> = {
  'TODOS':      '#00c8ff',
  'ACTIVO':     '#00ffa3',
  'POR INICIAR':'#ffb020',
  'FINALIZADO': '#ff3b5c',
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ProyectosPage() {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useProyectos()

  const [showForm,     setShowForm]     = useState(false)
  const [editing,      setEditing]      = useState<Proyecto | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterOption>('TODOS')

  // ── process + filter ──
  const processed: ProyectoWithStatus[] = proyectos
    .map(p => ({ ...p, status: getProyectoStatus(p.fechaInicio, p.fechaEntrega) }))
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch =
        p.nombre.toLowerCase().includes(q) ||
        p.cliente.toLowerCase().includes(q) ||
        p.ubicacion.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'TODOS' || p.status.label === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => a.status.priority - b.status.priority)

  // ── counts ──
  const counts = {
    TODOS:       proyectos.length,
    ACTIVO:      proyectos.filter(p => getProyectoStatus(p.fechaInicio, p.fechaEntrega).label === 'ACTIVO').length,
    'POR INICIAR': proyectos.filter(p => getProyectoStatus(p.fechaInicio, p.fechaEntrega).label === 'POR INICIAR').length,
    FINALIZADO:  proyectos.filter(p => getProyectoStatus(p.fechaInicio, p.fechaEntrega).label === 'FINALIZADO').length,
  }

  // ── delete ──
  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este proyecto?')) return
    const res  = await fetch('/api/proyectos', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (data.success) deleteProyecto(id)
    else alert('Error al eliminar')
  }

  // ── save ──
  const handleSave = async (proyectoGuardado: Proyecto) => {
    if (editing) {
      const res  = await fetch('/api/proyectos', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editing, ...proyectoGuardado }),
      })
      const data = await res.json()
      if (data.success) {
        updateProyecto({
          ...editing, ...proyectoGuardado,
          id: editing.id,
          cliente:        proyectoGuardado.cliente        ?? editing.cliente,
          contacto:       proyectoGuardado.contacto       ?? editing.contacto,
          tipo_proveedor: proyectoGuardado.tipo_proveedor ?? editing.tipo_proveedor,
        })
      }
    } else {
      const res  = await fetch('/api/proyectos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proyectoGuardado),
      })
      const data = await res.json()
      if (data.success) addProyecto({ ...proyectoGuardado, id: Number(data.id) })
    }
    setShowForm(false)
  }

  return (
    <>
      <div>

        {/* ── HEADER ── */}
        <div className="proy-header">
          <div>
            <div className="proy-title-eyebrow">Gestión Operativa</div>
            <div className="proy-title">GESTOR DE <span>PROYECTOS</span></div>
          </div>

          <button
            className="btn-add"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nuevo Proyecto
          </button>
        </div>

        <div className="section-divider" />

        {/* ── TOOLBAR ── */}
        <div className="proy-toolbar">
          {/* Search */}
          <div className="search-wrap">
            <span className="search-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, cliente o ubicación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filter pills */}
          <div className="filter-pills">
            {STATUS_FILTERS.map(opt => {
              const col = STATUS_FILTER_COLORS[opt]
              const isActive = statusFilter === opt
              return (
                <button
                  key={opt}
                  className={`filter-pill ${isActive ? 'active' : ''}`}
                  style={{ color: isActive ? col : undefined }}
                  onClick={() => setStatusFilter(opt)}
                >
                  <div className="pill-dot" style={{ background: col }} />
                  {opt}
                  <span className="pill-count">{counts[opt]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── RESULTS META ── */}
        <div className="results-meta">
          {processed.length} PROYECTO{processed.length !== 1 ? 'S' : ''} —{' '}
          {statusFilter === 'TODOS' ? 'TODOS LOS ESTADOS' : statusFilter}
        </div>

        {/* ── GRID ── */}
        <div className="proyectos-grid">
          {processed.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="40" height="32" rx="3" stroke="#00c8ff" strokeWidth="1.5"/>
                <path d="M14 20h20M14 26h12" stroke="#00c8ff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="empty-label">Sin proyectos para mostrar</span>
            </div>
          ) : (
            processed.map(p => {
              const tag = getTipoTag(p.tipo_proveedor)
              const accentColor = p.status.dotColor
              return (
                <div
                  key={p.id}
                  className="proy-card"
                  style={{ '--card-accent': accentColor } as React.CSSProperties}
                >
                  {/* Header */}
                  <div className="card-header">
                    <div className="card-title">{p.nombre}</div>
                    <span
                      className="status-badge"
                      style={{ color: p.status.dotColor }}
                    >
                      <span className="status-badge-dot" />
                      {p.status.label}
                    </span>
                  </div>

                  {/* Fields */}
                  <div className="card-fields">
                    <div className="card-field">
                      <span className="card-field-key">Cliente</span>
                      <span className="card-field-val">{p.cliente}</span>
                    </div>
                    <div className="card-field">
                      <span className="card-field-key">Ubicación</span>
                      <span className="card-field-val">{p.ubicacion}</span>
                    </div>
                    <div className="card-field">
                      <span className="card-field-key">Contacto</span>
                      <span className="card-field-val">{p.contacto}</span>
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="date-range">
                    <span className="date-range-item">{p.fechaInicio}</span>
                    <span className="date-range-arrow">→</span>
                    <span className="date-range-item">{p.fechaEntrega}</span>
                  </div>

                  {/* Description */}
                  {p.descripcion && (
                    <p className="card-desc">{p.descripcion}</p>
                  )}

                  {/* Footer */}
                  <div className="card-footer">
                    <span
                      className="tipo-tag"
                      style={{ color: tag.color, background: tag.bg }}
                    >
                      {tag.label}
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-action btn-edit"
                        onClick={() => { setEditing(p); setShowForm(true) }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M7.5 1.5l2 2L3 10H1V8L7.5 1.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                        </svg>
                        Editar
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(p.id)}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 3h7M4 3V2h3v1M4.5 5v3M6.5 5v3M3 3l.5 6h4L8 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── FORM MODAL ── */}
        {showForm && (
          <ProyectoForm
            proyecto={editing}
            onClose={() => setShowForm(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </>
  )
}