'use client'

import { useState } from 'react'
import { useProveedores, Proveedor, ServicioProveedor } from '@/app/dashboard/contexts/ProveedoresContext'
import ProveedorForm from '@/app/dashboard/proveedores/ProveedorForm'
import '../../css/proveedores/proveedores.css'

function formatTipo(tipo?: string | ServicioProveedor[] | null): string {
  if (!tipo) return ''
  if (Array.isArray(tipo)) {
    return tipo.map(t => String(t)).join(', ').toUpperCase()
  }
  return tipo.toUpperCase()
}

// ─── NORMALIZER ───────────────────────────────────────────────────────────────
function normalizeTipo(tipo?: string | ServicioProveedor[] | null): string {
  if (!tipo) return ''
  if (Array.isArray(tipo)) {
    return tipo.map(t => String(t)).join(' ').toLowerCase()
  }
  return tipo.toLowerCase()
}

// ─── TIPO CONFIG ──────────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { color: string; bg: string }> = {
  'instalación': { color: '#ff6b2b', bg: 'rgba(255,107,43,0.1)' },
  'ajuste':      { color: '#00c8ff', bg: 'rgba(0,200,255,0.1)'  },
}

function getTipoStyle(tipo?: string | ServicioProveedor[] | null) {
  const key = normalizeTipo(tipo).trim()
  return TIPO_CONFIG[key] ?? { color: '#5c8fa8', bg: 'rgba(92,143,168,0.08)' }
}

function EstatusStyle(estatus?: string | null) {
  const k = (estatus || '').toLowerCase()
  if (k === 'activo')   return { color:'#00ffa3', bg:'rgba(0,255,163,0.08)' }
  if (k === 'inactivo') return { color:'#ff3b5c', bg:'rgba(255,59,92,0.08)' }
  return { color:'#5c8fa8', bg:'rgba(92,143,168,0.08)' }
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const parts  = name.trim().split(/\s+/)
  const letter = parts.length >= 2 ? (parts[0][0]+parts[1][0]).toUpperCase() : name.slice(0,2).toUpperCase()
  return (
    <div style={{
      width:40, height:40, borderRadius:3, flexShrink:0,
      background:'rgba(255,107,43,0.08)', border:'1px solid rgba(255,107,43,0.2)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14,
      letterSpacing:'0.08em', color:'#ff6b2b',
    }}>
      {letter}
    </div>
  )
}

export default function ProveedoresPage() {
  const { proveedores } = useProveedores()
  const [search, setSearch] = useState('')
  const [showProveedorForm, setShowProveedorForm] = useState(false)
  const [focused, setFocused] = useState(false)

  const filtered = proveedores.filter(p =>
    p.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    p.nombre_contacto?.toLowerCase().includes(search.toLowerCase()) ||
    p.rfc?.toLowerCase().includes(search.toLowerCase())
  )

  const totalActivos   = proveedores.filter(p => (p.estatus||'').toLowerCase() === 'activo').length
  const totalInactivos = proveedores.filter(p => (p.estatus||'').toLowerCase() === 'inactivo').length

  const porTipo = (t: string) =>
    proveedores.filter(p => normalizeTipo(p.tipo_proveedor).includes(t)).length

  return (
    <>
      <div>
        <div className="pv-header">
          <div>
            <div className="pv-eyebrow">Cadena de suministro</div>
            <div className="pv-title">GESTOR DE <span>PROVEEDORES</span></div>
          </div>
          <button className="btn-add-pv" onClick={() => setShowProveedorForm(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nuevo Proveedor
          </button>
        </div>

        <div className="section-divider" />

        <div className="pv-summary">
          {([
            { label:'Total',        value: proveedores.length, color:'#00c8ff' },
            { label:'Activos',      value: totalActivos,       color:'#00ffa3' },
            { label:'Inactivos',    value: totalInactivos,     color:'#ff3b5c' },
            { label:'Instalación',  value: porTipo('instal'),  color:'#ff6b2b' },
            { label:'Ajuste',       value: porTipo('ajust'),   color:'#00c8ff' },
          ]).map(s => (
            <div key={s.label} className="pv-sum-item">
              <div className="pv-sum-dot" style={{ background:s.color, boxShadow:`0 0 5px ${s.color}` }}/>
              <div className="pv-sum-val" style={{ color:s.color }}>{s.value}</div>
              <div className="pv-sum-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:14 }}>
          <div className={`pv-search-wrap ${focused ? 'focused' : ''}`}>
            <span className="pv-search-icon">🔍</span>
            <input
              className="pv-search-input"
              type="text"
              placeholder="Buscar por razón social, contacto o RFC..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </div>
        </div>

        <div className="pv-meta">
          {filtered.length} PROVEEDOR{filtered.length !== 1 ? 'ES' : ''} ENCONTRADO{filtered.length !== 1 ? 'S' : ''}
        </div>

        <div className="pv-grid">
          {filtered.length === 0 ? (
            <div className="pv-empty">
              <span>Sin proveedores para mostrar</span>
            </div>
          ) : filtered.map(p => {
            const tipoStyle = getTipoStyle(p.tipo_proveedor)
            const estatusStyle = EstatusStyle(p.estatus)

            return (
              <div key={p.id} className="pv-card">
                <div className="pv-card-header">
                  <Avatar name={p.razon_social} />

                  <div className="pv-card-info">
                    <div className="pv-card-name">{p.razon_social}</div>
                    {p.rfc && <div className="pv-card-rfc">RFC: {p.rfc}</div>}
                  </div>

                  {p.estatus && (
                    <span className="pv-badge" style={{ color:estatusStyle.color, background:estatusStyle.bg }}>
                      <span className="pv-badge-dot"/>
                      {p.estatus.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="pv-fields">
                  {p.nombre_contacto && (
                    <div className="pv-field">
                      <span className="pv-field-key">Contacto</span>
                      <span className="pv-field-val">{p.nombre_contacto}</span>
                    </div>
                  )}
                </div>

                {p.tipo_proveedor && (
                  <span className="pv-badge" style={{ color:tipoStyle.color, background:tipoStyle.bg }}>
                    <span className="pv-badge-dot"/>
                    {formatTipo(p.tipo_proveedor)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {showProveedorForm && (
          <ProveedorForm onClose={() => setShowProveedorForm(false)} />
        )}
      </div>
    </>
  )
}