'use client'

import { useState } from 'react'
import { useCliente, Cliente } from '@/app/dashboard/contexts/ClientesContext'
import ClienteForm from '@/app/dashboard/clientes/ClienteForm'
import '../../css/cliente/cliente.css'

// ─── ESTATUS CONFIG ───────────────────────────────────────────────────────────
const ESTATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  activo:    { color: '#00ffa3', bg: 'rgba(0,255,163,0.08)' },
  inactivo:  { color: '#ff3b5c', bg: 'rgba(255,59,92,0.08)' },
  prospecto: { color: '#ffb020', bg: 'rgba(255,176,32,0.08)' },
}

function getEstatusConfig(estatus?: string | null) {
  const key = (estatus || '').toLowerCase().trim()
  return ESTATUS_CONFIG[key] ?? { color: '#5c8fa8', bg: 'rgba(92,143,168,0.08)' }
}

// ─── AVATAR LETTERS ──────────────────────────────────────────────────────────
function AvatarLetters({ name }: { name: string }) {
  const parts  = name.trim().split(/\s+/)
  const letter = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 40, height: 40,
      borderRadius: 3,
      background: 'rgba(0,200,255,0.08)',
      border: '1px solid rgba(0,200,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif",
      fontWeight: 700,
      fontSize: 15,
      letterSpacing: '0.08em',
      color: 'var(--accent,#00c8ff)',
      flexShrink: 0,
    }}>
      {letter}
    </div>
  )
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const { clientes } = useCliente()

  const [search,          setSearch]          = useState('')
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [focused,         setFocused]         = useState(false)

  const filtered = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    c.nombre_contacto?.toLowerCase().includes(search.toLowerCase()) ||
    c.rfc?.toLowerCase().includes(search.toLowerCase())
  )

  // ── totals ──
  const totalActivos   = clientes.filter(c => (c.estatus || '').toLowerCase() === 'activo').length
  const totalInactivos = clientes.filter(c => (c.estatus || '').toLowerCase() === 'inactivo').length
  const totalProspectos = clientes.filter(c => (c.estatus || '').toLowerCase() === 'prospecto').length

  return (
    <>
      <div>

        {/* ── HEADER ── */}
        <div className="cli-header">
          <div>
            <div className="cli-eyebrow">Gestión Comercial</div>
            <div className="cli-title">GESTOR DE <span>CLIENTES</span></div>
          </div>
          <button className="btn-add-cli" onClick={() => setShowClienteForm(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nuevo Cliente
          </button>
        </div>

        <div className="section-divider" />

        {/* ── SUMMARY STRIP ── */}
        <div className="cli-summary">
          {[
            { label:'Total',      value: clientes.length,    color:'#00c8ff' },
            { label:'Activos',    value: totalActivos,       color:'#00ffa3' },
            { label:'Inactivos',  value: totalInactivos,     color:'#ff3b5c' },
            { label:'Prospectos', value: totalProspectos,    color:'#ffb020' },
          ].map(s => (
            <div key={s.label} className="cli-summary-item">
              <div className="cli-summary-dot" style={{ background: s.color, boxShadow:`0 0 5px ${s.color}` }} />
              <div className="cli-summary-val" style={{ color: s.color }}>{s.value}</div>
              <div className="cli-summary-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="cli-toolbar">
          <div className={`cli-search-wrap ${focused ? 'focused' : ''}`}>
            <span className="cli-search-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por razón social, contacto o RFC..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="cli-search-input"
            />
          </div>
        </div>

        {/* ── RESULTS META ── */}
        <div className="cli-results-meta">
          {filtered.length} CLIENTE{filtered.length !== 1 ? 'S' : ''} ENCONTRADO{filtered.length !== 1 ? 'S' : ''}
        </div>

        {/* ── GRID ── */}
        <div className="cli-grid">
          {filtered.length === 0 ? (
            <div className="cli-empty">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.2">
                <circle cx="20" cy="14" r="7" stroke="#00ffa3" strokeWidth="1.5"/>
                <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" stroke="#00ffa3" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Sin clientes para mostrar</span>
            </div>
          ) : (
            filtered.map(c => {
              const est = getEstatusConfig(c.estatus)
              return (
                <div key={c.id} className="cli-card">

                  {/* header row */}
                  <div className="cli-card-header">
                    <AvatarLetters name={c.razon_social} />
                    <div className="cli-card-info">
                      <div className="cli-card-name">{c.razon_social}</div>
                      {c.rfc && <div className="cli-card-rfc">RFC: {c.rfc}</div>}
                    </div>
                    {c.estatus && (
                      <span
                        className="cli-status-badge"
                        style={{ color: est.color, background: est.bg }}
                      >
                        <span className="cli-status-dot" />
                        {c.estatus.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* contact fields */}
                  <div className="cli-fields">
                    {c.nombre_contacto && (
                      <div className="cli-field">
                        <span className="cli-field-key">Contacto</span>
                        <span className="cli-field-val">{c.nombre_contacto}</span>
                      </div>
                    )}
                    {c.telefono && (
                      <div className="cli-field">
                        <span className="cli-field-key">Teléfono</span>
                        <span className="cli-field-val">{c.telefono}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="cli-field">
                        <span className="cli-field-key">Email</span>
                        <span className="cli-field-val">{c.email}</span>
                      </div>
                    )}
                  </div>

                  {/* address */}
                  {c.direccion && (
                    <div className="cli-address">
                      <svg width="11" height="13" viewBox="0 0 11 13" fill="none" style={{ flexShrink:0, marginTop:1, opacity:0.4 }}>
                        <path d="M5.5 1C3.015 1 1 3.015 1 5.5c0 3.375 4.5 7.5 4.5 7.5S10 8.875 10 5.5C10 3.015 7.985 1 5.5 1z" stroke="currentColor" strokeWidth="1.1"/>
                        <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
                      </svg>
                      {c.direccion}
                    </div>
                  )}

                </div>
              )
            })
          )}
        </div>

        {/* ── FORM MODAL ── */}
        {showClienteForm && (
          <ClienteForm onClose={() => setShowClienteForm(false)} />
        )}

      </div>
    </>
  )
}