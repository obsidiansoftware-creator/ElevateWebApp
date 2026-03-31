'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { useCliente } from '@/app/dashboard/contexts/ClientesContext'
import { useProveedores } from '@/app/dashboard/contexts/ProveedoresContext'
import type { Proyecto } from '@/app/dashboard/contexts/ProyectosContext'
import '../../../css/proyectos/proyectosForm.css'

interface ProyectoFormProps {
  proyecto: Proyecto | null
  onClose: () => void
  onSave: (proyecto: Proyecto) => void
}

export default function ProyectoForm({ proyecto, onClose, onSave }: ProyectoFormProps) {
  const { proveedores } = useProveedores()
  const { clientes }    = useCliente()

  const [nombre,       setNombre]       = useState(proyecto?.nombre       || '')
  const [ubicacion,    setUbicacion]    = useState(proyecto?.ubicacion    || '')
  const [contacto,     setContacto]     = useState(proyecto?.contacto     || '')
  const [fechaInicio,  setFechaInicio]  = useState(proyecto?.fechaInicio  || '')
  const [fechaEntrega, setFechaEntrega] = useState(proyecto?.fechaEntrega || '')
  const [descripcion,  setDescripcion]  = useState(proyecto?.descripcion  || '')
  const [tipo,         setTipo]         = useState<Proyecto['tipo']>(proyecto?.tipo || 'Instalación')
  const [clienteId,    setClienteId]    = useState<number | undefined>(proyecto?.clienteId)
  const [proveedorId,  setProveedorId]  = useState<number | undefined>(proyecto?.proveedorId)
  const [lat,          setLat]          = useState<number | null>(proyecto?.lat || null)
  const [lng,          setLng]          = useState<number | null>(proyecto?.lng || null)
  const [focused,      setFocused]      = useState<string | null>(null)

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  })

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const handleSubmit = () => {
    if (!nombre || !ubicacion || !fechaInicio || !fechaEntrega) {
      alert('Completa los campos obligatorios')
      return
    }
    onSave({
      id:           proyecto?.id ?? Date.now(),
      nombre,
      ubicacion,
      cliente:      clientes.find(c => c.id === clienteId)?.razon_social || '',
      contacto,
      fechaInicio,
      fechaEntrega,
      descripcion,
      tipo,
      proveedorId,
      clienteId,
      lat,
      lng,
    })
    onClose()
  }

  const isEdit = !!proyecto

  return createPortal(
    <>
      <div className="pf-backdrop" onClick={onClose}>
        <div className="pf-modal" onClick={e => e.stopPropagation()}>
          <div className="pf-corner tl" />
          <div className="pf-corner tr" />
          <div className="pf-corner bl" />
          <div className="pf-corner br" />

          {/* ── Header ── */}
          <div className="pf-header">
            <div>
              <div className="pf-title-eyebrow">
                {isEdit ? 'Modificar registro' : 'Nuevo registro'}
              </div>
              <div className="pf-title">
                {isEdit ? 'Editar' : 'Agregar'} <span>Proyecto</span>
              </div>
            </div>
            <button className="pf-close" onClick={onClose}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* ── Body ── */}
          <div className="pf-body">

            {/* SECCIÓN: IDENTIFICACIÓN */}
            <div className="pf-section">
              <div className="pf-section-label">Identificación</div>

              <div className={`pf-field ${focused === 'nombre' ? 'focused' : ''}`}>
                <label className="pf-field-label">Nombre del proyecto <span className="req">*</span></label>
                <input
                  className="pf-input"
                  placeholder="Ej. Instalación Torre Reforma"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onFocus={() => setFocused('nombre')}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div className={`pf-field ${focused === 'ubicacion' ? 'focused' : ''}`}>
                <label className="pf-field-label">Ubicación <span className="req">*</span></label>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={a => (autocompleteRef.current = a)}
                    onPlaceChanged={() => {
                      const place = autocompleteRef.current?.getPlace()
                      if (place?.formatted_address) setUbicacion(place.formatted_address)
                      if (place?.geometry?.location) {
                        setLat(place.geometry.location.lat())
                        setLng(place.geometry.location.lng())
                      }
                    }}
                  >
                    <input
                      className="pf-input"
                      placeholder="Buscar dirección..."
                      value={ubicacion}
                      onChange={e => setUbicacion(e.target.value)}
                      onFocus={() => setFocused('ubicacion')}
                      onBlur={() => setFocused(null)}
                    />
                  </Autocomplete>
                ) : (
                  <input
                    className="pf-input"
                    placeholder="Buscar dirección..."
                    value={ubicacion}
                    onChange={e => setUbicacion(e.target.value)}
                    onFocus={() => setFocused('ubicacion')}
                    onBlur={() => setFocused(null)}
                  />
                )}
              </div>
            </div>

            {/* SECCIÓN: CLIENTE & CONTACTO */}
            <div className="pf-section">
              <div className="pf-section-label">Cliente & Contacto</div>

              <div className={`pf-field ${focused === 'cliente' ? 'focused' : ''}`}>
                <label className="pf-field-label">Cliente</label>
                <div className="pf-select-wrap">
                  <select
                    className="pf-select"
                    value={clienteId || ''}
                    onChange={e => setClienteId(e.target.value ? Number(e.target.value) : undefined)}
                    onFocus={() => setFocused('cliente')}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.razon_social}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`pf-field ${focused === 'contacto' ? 'focused' : ''}`}>
                <label className="pf-field-label">Contacto</label>
                <input
                  className="pf-input"
                  placeholder="Nombre del contacto"
                  value={contacto}
                  onChange={e => setContacto(e.target.value)}
                  onFocus={() => setFocused('contacto')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* SECCIÓN: FECHAS */}
            <div className="pf-section">
              <div className="pf-section-label">Fechas</div>
              <div className="pf-row">
                <div className={`pf-field ${focused === 'inicio' ? 'focused' : ''}`}>
                  <label className="pf-field-label">Inicio <span className="req">*</span></label>
                  <input
                    type="date"
                    className="pf-input"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    onFocus={() => setFocused('inicio')}
                    onBlur={() => setFocused(null)}
                  />
                </div>
                <div className={`pf-field ${focused === 'entrega' ? 'focused' : ''}`}>
                  <label className="pf-field-label">Entrega <span className="req">*</span></label>
                  <input
                    type="date"
                    className="pf-input"
                    value={fechaEntrega}
                    onChange={e => setFechaEntrega(e.target.value)}
                    onFocus={() => setFocused('entrega')}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN: DETALLES */}
            <div className="pf-section">
              <div className="pf-section-label">Detalles</div>

              <div className={`pf-field ${focused === 'desc' ? 'focused' : ''}`}>
                <label className="pf-field-label">Descripción</label>
                <textarea
                  className="pf-textarea"
                  placeholder="Descripción del alcance del proyecto..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  onFocus={() => setFocused('desc')}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div className="pf-row">
                <div className={`pf-field ${focused === 'tipo' ? 'focused' : ''}`}>
                  <label className="pf-field-label">Tipo de trabajo</label>
                  <div className="pf-select-wrap">
                    <select
                      className="pf-select"
                      value={tipo || ''}
                      onChange={e => setTipo(e.target.value as Proyecto['tipo'])}
                      onFocus={() => setFocused('tipo')}
                      onBlur={() => setFocused(null)}
                    >
                      <option value="Instalación">Instalación</option>
                      <option value="Ajuste">Ajuste</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                </div>

                <div className={`pf-field ${focused === 'prov' ? 'focused' : ''}`}>
                  <label className="pf-field-label">Proveedor</label>
                  <div className="pf-select-wrap">
                    <select
                      className="pf-select"
                      value={proveedorId || ''}
                      onChange={e => setProveedorId(e.target.value ? Number(e.target.value) : undefined)}
                      onFocus={() => setFocused('prov')}
                      onBlur={() => setFocused(null)}
                    >
                      <option value="">Sin proveedor</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.razon_social}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="pf-footer">
            <button className="pf-btn pf-btn-cancel" onClick={onClose}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Cancelar
            </button>
            <button className="pf-btn pf-btn-save" onClick={handleSubmit}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isEdit ? 'Actualizar' : 'Guardar'}
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}