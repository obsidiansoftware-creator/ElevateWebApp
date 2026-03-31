"use client"

import { useEffect, useState } from "react"
import FirmaContrato from "@/app/components/FirmaContrato"
import '../../css/contratos/contratos.css'

type EstadoContrato = "PENDIENTE" | "FIRMADO" | "ACTIVO" | "CANCELADO"

type Contrato = {
  id: number
  numero: string
  cliente_nombre: string
  total: number
  estado: EstadoContrato
  firma_cliente?: string | null
}

const ESTADO_CONFIG: Record<EstadoContrato, { color: string; bg: string }> = {
  PENDIENTE:  { color: '#ffb020', bg: 'rgba(255,176,32,0.08)'  },
  FIRMADO:    { color: '#00c8ff', bg: 'rgba(0,200,255,0.08)'   },
  ACTIVO:     { color: '#00ffa3', bg: 'rgba(0,255,163,0.08)'   },
  CANCELADO:  { color: '#ff3b5c', bg: 'rgba(255,59,92,0.08)'   },
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [selected,  setSelected]  = useState<Contrato | null>(null)
  const [loading,   setLoading]   = useState(true)

  const fetchContratos = async () => {
    try {
      const res  = await fetch("/api/contratos")
      const data = await res.json()
      setContratos(Array.isArray(data) ? data : [])
    } catch { setContratos([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchContratos() }, [])

  const cambiarEstado = async (id: number, estado: EstadoContrato) => {
    await fetch("/api/contratos/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    })
    fetchContratos()
  }

  // counts
  const counts = {
    TODOS:     contratos.length,
    PENDIENTE: contratos.filter(c => c.estado === "PENDIENTE").length,
    FIRMADO:   contratos.filter(c => c.estado === "FIRMADO").length,
    ACTIVO:    contratos.filter(c => c.estado === "ACTIVO").length,
    CANCELADO: contratos.filter(c => c.estado === "CANCELADO").length,
  }

  const totalValor = contratos.reduce((s, c) => s + Number(c.total || 0), 0)

  return (
    <>
      <div>
        {/* HEADER */}
        <div className="ct-header">
          <div>
            <div className="ct-eyebrow">Gestión Comercial</div>
            <div className="ct-title">GESTIÓN DE <span>CONTRATOS</span></div>
          </div>
        </div>
        <div className="section-divider" />

        {/* SUMMARY */}
        <div className="ct-summary">
          {([
            { label:'Total',     value: counts.TODOS,     color:'#00c8ff' },
            { label:'Pendientes',value: counts.PENDIENTE,  color:'#ffb020' },
            { label:'Firmados',  value: counts.FIRMADO,    color:'#00c8ff' },
            { label:'Activos',   value: counts.ACTIVO,     color:'#00ffa3' },
            { label:'Cancelados',value: counts.CANCELADO,  color:'#ff3b5c' },
            { label:'Valor Total',value:`$${totalValor.toLocaleString()}`, color:'#00ffa3' },
          ] as {label:string;value:string|number;color:string}[]).map(s => (
            <div key={s.label} className="ct-sum-item">
              <div className="ct-sum-dot" style={{ background:s.color, boxShadow:`0 0 5px ${s.color}` }} />
              <div className="ct-sum-val" style={{ color:s.color }}>{s.value}</div>
              <div className="ct-sum-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="ct-panel">
          {loading ? (
            <div className="ct-loading"><div className="ct-spinner" />CARGANDO CONTRATOS...</div>
          ) : contratos.length === 0 ? (
            <div className="ct-empty">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="8" y="4" width="24" height="32" rx="2" stroke="#ffb020" strokeWidth="1.5"/>
                <path d="M14 13h12M14 19h12M14 25h8" stroke="#ffb020" strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
              </svg>
              <span>Sin contratos registrados</span>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Número</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map(c => {
                    const cfg = ESTADO_CONFIG[c.estado]
                    return (
                      <tr key={c.id}>
                        <td className="num">{c.numero}</td>
                        <td className="bold">{c.cliente_nombre}</td>
                        <td className="money">${Number(c.total||0).toLocaleString()}</td>
                        <td>
                          <span className="ct-badge" style={{ color:cfg.color, background:cfg.bg }}>
                            <span className="ct-badge-dot" />{c.estado}
                          </span>
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <button className="ct-btn ct-btn-view" onClick={() => setSelected(c)}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.1"/><circle cx="5" cy="5" r="1" fill="currentColor"/></svg>
                              Ver
                            </button>
                            {c.estado === "FIRMADO" && (
                              <button className="ct-btn ct-btn-activate" onClick={() => cambiarEstado(c.id, "ACTIVO")}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Activar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL */}
        {selected && (
          <div className="ct-modal-backdrop" onClick={() => setSelected(null)}>
            <div className="ct-modal" onClick={e => e.stopPropagation()}>
              <div className="ct-modal-corner tl"/><div className="ct-modal-corner tr"/>
              <div className="ct-modal-corner bl"/><div className="ct-modal-corner br"/>
              <div className="ct-modal-header">
                <div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:'.35em', color:'var(--text2,#5c8fa8)', marginBottom:4, textTransform:'uppercase' }}>Detalle del contrato</div>
                  <div className="ct-modal-title">Contrato {selected.numero}</div>
                  {(() => { const cfg=ESTADO_CONFIG[selected.estado]; return (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:6, padding:'2px 8px', border:`1px solid ${cfg.color}`, borderRadius:2, fontFamily:"'Share Tech Mono',monospace", fontSize:8, letterSpacing:'.2em', color:cfg.color, background:cfg.bg }}>
                      <span style={{ width:4, height:4, borderRadius:'50%', background:cfg.color, display:'inline-block' }}/>{selected.estado}
                    </span>
                  )})()}
                </div>
                <button className="ct-modal-close" onClick={() => setSelected(null)}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="ct-modal-body">
                <div className="ct-modal-field"><span className="ct-modal-key">Cliente</span><span className="ct-modal-val">{selected.cliente_nombre}</span></div>
                <div className="ct-modal-field"><span className="ct-modal-key">Total</span><span className="ct-modal-val" style={{ color:'#00ffa3', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:20 }}>${Number(selected.total).toLocaleString()}</span></div>
                {selected.estado === "PENDIENTE" && (
                  <div className="firma-section">
                    <div className="firma-label">Firma del cliente</div>
                    <FirmaContrato contratoId={selected.id} onFirmado={() => { setSelected(null); fetchContratos() }} />
                  </div>
                )}
                {selected.firma_cliente && (
                  <div className="firma-section">
                    <div className="firma-label">Firma registrada</div>
                    <img src={selected.firma_cliente} alt="Firma" className="firma-img" />
                  </div>
                )}
              </div>
              <div className="ct-modal-footer">
                <button className="ct-modal-btn" onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}