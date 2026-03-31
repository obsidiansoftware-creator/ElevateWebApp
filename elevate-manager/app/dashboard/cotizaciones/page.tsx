"use client"

import { useState } from "react"
import '../../css/cotizaciones/cotizaciones.css'

type FormCotizacion = {
  cliente_id: number
  capacidad: number
  paradas: number
  velocidad: number
  tipo: "HIDRAULICO" | "TRACCION" | "PANORAMICO" | "MONTACARGAS"
  acabados: "ESTANDAR" | "LUJO" | "PREMIUM"
  margen: number
}

type ResultadoCotizacion = {
  id: number
  numero: string
  precioFinal: number
}

const TIPO_OPTS   = ["HIDRAULICO","TRACCION","PANORAMICO","MONTACARGAS"] as const
const ACABADO_OPTS = ["ESTANDAR","LUJO","PREMIUM"] as const

const TIPO_LABELS: Record<string, string> = {
  HIDRAULICO:"Hidráulico", TRACCION:"Tracción", PANORAMICO:"Panorámico", MONTACARGAS:"Montacargas"
}
const ACABADO_LABELS: Record<string, string> = {
  ESTANDAR:"Estándar", LUJO:"Lujo", PREMIUM:"Premium"
}

export default function CotizacionesPage() {
  const [form, setForm] = useState<FormCotizacion>({
    cliente_id:0, capacidad:630, paradas:5, velocidad:1,
    tipo:"HIDRAULICO", acabados:"ESTANDAR", margen:25,
  })
  const [resultado,  setResultado]  = useState<ResultadoCotizacion | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [converting, setConverting] = useState(false)
  const [converted,  setConverted]  = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: ["capacidad","paradas","velocidad","margen","cliente_id"].includes(name) ? Number(value) : value,
    }))
  }

  const generarCotizacion = async () => {
    setLoading(true)
    setResultado(null)
    setConverted(false)
    const res  = await fetch("/api/cotizaciones/crear", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form),
    })
    const data: ResultadoCotizacion = await res.json()
    setResultado(data)
    setLoading(false)
  }

  const convertirContrato = async (cotizacionId: number) => {
    setConverting(true)
    try {
      const res  = await fetch("/api/contratos/crear", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ cotizacionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al crear contrato")
      setConverted(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al generar contrato")
    }
    setConverting(false)
  }

  return (
    <>
      <div>
        <div className="cot-header">
          <div>
            <div className="cot-eyebrow">Generador automático</div>
            <div className="cot-title">GENERAR <span>COTIZACIÓN</span></div>
          </div>
        </div>
        <div className="section-divider" />

        <div className="cot-layout">
          {/* LEFT: config */}
          <div>
            <div className="cot-panel" style={{ marginBottom:14 }}>
              <div className="cot-panel-title"><div className="cot-panel-dot"/>Datos del Cliente</div>
              <div className="cot-field">
                <label className="cot-label">ID de Cliente</label>
                <input className="cot-input" name="cliente_id" type="number" placeholder="0" onChange={handleChange}/>
              </div>
            </div>

            <div className="cot-panel" style={{ marginBottom:14 }}>
              <div className="cot-panel-title"><div className="cot-panel-dot"/>Tipo de Elevador</div>
              <div className="cot-tipo-grid">
                {TIPO_OPTS.map(t => (
                  <button key={t} className={`cot-tipo-btn ${form.tipo === t ? 'active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, tipo:t }))}>
                    {TIPO_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="cot-panel">
              <div className="cot-panel-title"><div className="cot-panel-dot"/>Acabados</div>
              <div className="cot-tipo-grid" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
                {ACABADO_OPTS.map(a => (
                  <button key={a} className={`cot-tipo-btn ${form.acabados === a ? 'active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, acabados:a }))}>
                    {ACABADO_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: specs */}
          <div>
            <div className="cot-panel" style={{ marginBottom:14 }}>
              <div className="cot-panel-title"><div className="cot-panel-dot"/>Especificaciones Técnicas</div>
              <div className="cot-field">
                <label className="cot-label">Capacidad (kg)</label>
                <input className="cot-input" name="capacidad" type="number" defaultValue={630} onChange={handleChange}/>
              </div>
              <div className="cot-field">
                <label className="cot-label">Número de paradas</label>
                <input className="cot-input" name="paradas" type="number" defaultValue={5} onChange={handleChange}/>
              </div>
              <div className="cot-field">
                <label className="cot-label">Velocidad (m/s)</label>
                <input className="cot-input" name="velocidad" type="number" step="0.1" defaultValue={1} onChange={handleChange}/>
              </div>
            </div>

            <div className="cot-panel">
              <div className="cot-panel-title"><div className="cot-panel-dot"/>Margen de Ganancia</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:'.15em', color:'var(--text2,#5c8fa8)' }}>0%</span>
                <div className="cot-slider-val">{form.margen}%</div>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:'.15em', color:'var(--text2,#5c8fa8)' }}>100%</span>
              </div>
              <input className="cot-slider" type="range" name="margen" min={0} max={100} value={form.margen} onChange={handleChange}/>
            </div>
          </div>
        </div>

        {/* GENERATE */}
        <button className="cot-btn-generate" onClick={generarCotizacion} disabled={loading}>
          {loading ? <><div className="cot-spinner"/>CALCULANDO...</> : <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            CALCULAR Y GUARDAR
          </>}
        </button>

        {/* RESULTADO */}
        {resultado?.precioFinal !== undefined && (
          <div className="cot-result">
            <div className="cot-result-title"><div className="cot-result-dot"/>Resultado de Cotización</div>
            <div className="cot-result-num">#{resultado.numero}</div>
            <div className="cot-result-price-label">Precio Final</div>
            <div className="cot-result-price">${Number(resultado.precioFinal??0).toLocaleString()}</div>
            {converted ? (
              <div className="cot-converted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3 3 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                CONTRATO GENERADO CORRECTAMENTE
              </div>
            ) : (
              <button className="cot-btn-contract" onClick={() => convertirContrato(resultado.id)} disabled={converting}>
                {converting ? <><div className="cot-spinner" style={{ borderTopColor:'#00ffa3' }}/>GENERANDO...</> : <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M4 2V1M8 2V1M1 5h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  CONVERTIR A CONTRATO
                </>}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}