'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProveedores, Proveedor, ServicioProveedor } from '@/app/dashboard/contexts/ProveedoresContext'
import '../../css/proveedores/proveedoresForm.css'

interface ProveedorFormProps {
  onClose: () => void
}

export default function ProveedorForm({ onClose }: ProveedorFormProps) {
  const { addProveedor } = useProveedores()

  const [razonSocial,    setRazonSocial]    = useState('')
  const [nombreContacto, setNombreContacto] = useState('')
  const [direccion,      setDireccion]      = useState('')
  const [telefono,       setTelefono]       = useState('')
  const [email,          setEmail]          = useState('')
  const [rfc,            setRfc]            = useState('')
  const [tipoProveedor,  setTipoProveedor]  = useState<ServicioProveedor | ''>('')
  const [banco,          setBanco]          = useState('')
  const [cuentaBancaria, setCuentaBancaria] = useState('')
  const [clabe,          setClabe]          = useState('')
  const [notas,          setNotas]          = useState('')
  const [focused,        setFocused]        = useState<string | null>(null)
  const [saving,         setSaving]         = useState(false)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const handleSave = async () => {
    if (!razonSocial) { alert('La razón social es obligatoria'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razon_social: razonSocial, nombre_contacto: nombreContacto || null,
          direccion: direccion || null, telefono: telefono || null,
          email: email || null, rfc: rfc || null,
          tipo_proveedor: tipoProveedor || null, banco: banco || null,
          cuenta_bancaria: cuentaBancaria || null, clabe: clabe || null,
          notas: notas || null,
        }),
      })
      const data = await res.json()
      if (!data.success) { alert('Error al guardar: ' + (data.error || 'desconocido')); setSaving(false); return }
      addProveedor({
        id: data.id, razon_social: razonSocial, nombre_contacto: nombreContacto,
        direccion, telefono, email, rfc, tipo_proveedor: tipoProveedor || undefined,
        banco, cuenta_bancaria: cuentaBancaria, clabe, notas,
        estatus: 'activo', created_by: 0, created_at: new Date().toISOString(),
      } as Proveedor)
      onClose()
    } catch (e: unknown) {
      alert('Error: ' + (e instanceof Error ? e.message : 'desconocido'))
    }
    setSaving(false)
  }

  const F = ({ id, label, value, onChange, placeholder, type = 'text' }: {
    id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
  }) => (
    <div className={`pvf-field ${focused === id ? 'focused' : ''}`}>
      <label className="pvf-label">{label}</label>
      <input
        className="pvf-input" type={type} placeholder={placeholder || label}
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(id)} onBlur={() => setFocused(null)}
      />
    </div>
  )

  return createPortal(
    <>
      <div className="pvf-backdrop" onClick={onClose}>
        <div className="pvf-modal" onClick={e => e.stopPropagation()}>
          <div className="pvf-corner tl"/><div className="pvf-corner tr"/>
          <div className="pvf-corner bl"/><div className="pvf-corner br"/>

          <div className="pvf-header">
            <div>
              <div className="pvf-eyebrow">Nuevo registro</div>
              <div className="pvf-title">Agregar <span>Proveedor</span></div>
            </div>
            <button className="pvf-close" onClick={onClose}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="pvf-body">
            <div className="pvf-cols">
              {/* COL 1 */}
              <div>
                <div className="pvf-section">
                  <div className="pvf-section-label">Identificación</div>
                  <div className={`pvf-field ${focused === 'rs' ? 'focused' : ''}`}>
                    <label className="pvf-label">Razón Social <span className="req">*</span></label>
                    <input className="pvf-input" placeholder="Nombre de la empresa" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} onFocus={() => setFocused('rs')} onBlur={() => setFocused(null)}/>
                  </div>
                  <F id="rfc" label="RFC" value={rfc} onChange={setRfc} />
                  <div className="pvf-field">
                    <label className="pvf-label">Tipo de Proveedor</label>
                    <div className="pvf-tipo-row">
                      {(['Instalación','Ajuste'] as ServicioProveedor[]).map(t => (
                        <button key={t} className={`pvf-tipo-btn ${tipoProveedor === t ? 'active' : ''}`} onClick={() => setTipoProveedor(prev => prev === t ? '' : t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pvf-section">
                  <div className="pvf-section-label">Dirección y Notas</div>
                  <F id="dir" label="Dirección" value={direccion} onChange={setDireccion} />
                  <div className={`pvf-field ${focused === 'notas' ? 'focused' : ''}`}>
                    <label className="pvf-label">Notas</label>
                    <textarea className="pvf-textarea" placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} onFocus={() => setFocused('notas')} onBlur={() => setFocused(null)}/>
                  </div>
                </div>
              </div>

              {/* COL 2 */}
              <div>
                <div className="pvf-section">
                  <div className="pvf-section-label">Contacto</div>
                  <F id="nc" label="Nombre Contacto" value={nombreContacto} onChange={setNombreContacto} />
                  <F id="tel" label="Teléfono" value={telefono} onChange={setTelefono} type="tel" />
                  <F id="em" label="Correo" value={email} onChange={setEmail} type="email" />
                </div>
                <div className="pvf-section">
                  <div className="pvf-section-label">Datos Bancarios</div>
                  <F id="banco" label="Banco" value={banco} onChange={setBanco} />
                  <F id="cta" label="Cuenta Bancaria" value={cuentaBancaria} onChange={setCuentaBancaria} />
                  <F id="clabe" label="CLABE" value={clabe} onChange={setClabe} />
                </div>
              </div>
            </div>
          </div>

          <div className="pvf-footer">
            <button className="pvf-btn pvf-btn-cancel" onClick={onClose}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Cancelar
            </button>
            <button className="pvf-btn pvf-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="pvf-spinner"/>Guardando...</> : <>
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