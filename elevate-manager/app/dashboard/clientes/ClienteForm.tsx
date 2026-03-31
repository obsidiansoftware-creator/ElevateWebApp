'use client'

import "leaflet/dist/leaflet.css"
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCliente } from '@/app/dashboard/contexts/ClientesContext'
import '../../css/cliente/clienteForm.css'

type TipoCliente = 'Empresa' | 'Fisica'

export default function ClienteForm({ onClose }: { onClose: () => void }) {
  const { addCliente } = useCliente()

  const [nombre,        setNombre]        = useState('')
  const [representante, setRepresentante] = useState('')
  const [ubicacion,     setUbicacion]     = useState('')
  const [telefono,      setTelefono]      = useState('')
  const [correo,        setCorreo]        = useState('')
  const [rfc,           setRfc]           = useState('')
  const [tipoCliente,   setTipoCliente]   = useState<TipoCliente | null>(null)
  const [focused,       setFocused]       = useState<string | null>(null)
  const [saving,        setSaving]        = useState(false)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const handleSave = async () => {
    if (!nombre || !tipoCliente) { alert('Nombre y tipo de cliente son obligatorios'); return }
    setSaving(true)
    const tipo = tipoCliente === 'Empresa' ? 'empresa' : 'persona_fisica'
    try {
      const res  = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contacto: representante, tipo, telefono, correo, ubicacion, rfc }),
      })
      const data = await res.json()
      if (!data.success) { alert('Error: ' + (data.error || 'desconocido')); setSaving(false); return }
      addCliente({ id:data.id, razon_social:nombre, nombre_contacto:representante, direccion:ubicacion, telefono, email:correo, rfc, tipo_cliente:tipo, estatus:'activo', notas:'' })
      onClose()
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : 'desconocido'))
    }
    setSaving(false)
  }

  const Field = ({ id, label, value, onChange, placeholder, type='text' }: {
    id: string; label: string; value: string; onChange:(v:string)=>void; placeholder?:string; type?:string
  }) => (
    <div className={`clf-field ${focused === id ? 'focused' : ''}`}>
      <label className="clf-label">{label}</label>
      <input className="clf-input" type={type} placeholder={placeholder || label} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(id)} onBlur={() => setFocused(null)}/>
    </div>
  )

  return createPortal(
    <>

      <div className="clf-backdrop" onClick={onClose}>
        <div className="clf-modal" onClick={e => e.stopPropagation()}>
          <div className="clf-corner tl"/><div className="clf-corner tr"/>
          <div className="clf-corner bl"/><div className="clf-corner br"/>

          <div className="clf-header">
            <div>
              <div className="clf-eyebrow">Nuevo registro</div>
              <div className="clf-title">Agregar <span>Cliente</span></div>
            </div>
            <button className="clf-close" onClick={onClose}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="clf-body">
            {/* Tipo */}
            <div style={{ marginBottom:16 }}>
              <div className="clf-section-label">Tipo de Cliente <span className="req">*</span></div>
              <div className="clf-tipo-row">
                {([
                  { key:'Empresa', icon:'🏢', sub:'Persona Moral' },
                  { key:'Fisica',  icon:'👤', sub:'Persona Física' },
                ] as {key:TipoCliente; icon:string; sub:string}[]).map(t => (
                  <button key={t.key} className={`clf-tipo-btn ${tipoCliente === t.key ? 'active' : ''}`} onClick={() => setTipoCliente(t.key)}>
                    <span className="clf-tipo-icon">{t.icon}</span>
                    {t.key}
                    <span className="clf-tipo-sub">{t.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Datos */}
            <div className="clf-section-label">Datos Generales</div>
            <div className={`clf-field ${focused === 'nom' ? 'focused' : ''}`}>
              <label className="clf-label">Nombre / Razón Social <span className="req">*</span></label>
              <input className="clf-input" placeholder="Nombre completo o razón social" value={nombre} onChange={e => setNombre(e.target.value)} onFocus={() => setFocused('nom')} onBlur={() => setFocused(null)}/>
            </div>
            <Field id="rep" label="Representante / Contacto" value={representante} onChange={setRepresentante} />
            <Field id="rfc" label="RFC" value={rfc} onChange={setRfc} />

            <div className="clf-section-label" style={{ marginTop:6 }}>Datos de Contacto</div>
            <Field id="tel" label="Teléfono" value={telefono} onChange={setTelefono} type="tel" />
            <Field id="em"  label="Correo"   value={correo}   onChange={setCorreo}   type="email" />
            <Field id="ub"  label="Ubicación" value={ubicacion} onChange={setUbicacion} />
          </div>

          <div className="clf-footer">
            <button className="clf-btn clf-btn-cancel" onClick={onClose}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Cancelar
            </button>
            <button className="clf-btn clf-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="clf-spinner"/>Guardando...</> : <>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Guardar
              </>}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}