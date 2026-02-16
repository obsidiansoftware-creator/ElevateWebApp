'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { useCliente } from '@/app/dashboard/contexts/ClientesContext'
import { useProveedores } from '@/app/dashboard/contexts/ProveedoresContext'
import type { Proyecto } from '@/app/dashboard/contexts/ProyectosContext'


/* ===================================================== */

interface ProyectoFormProps {
  proyecto: Proyecto | null
  onClose: () => void
  onSave: (proyecto: Proyecto) => void
}

/* ===================================================== */


export default function ProyectoForm({
  proyecto,
  onClose,
  onSave
}: ProyectoFormProps) {
  
  const [nombre, setNombre] = useState(proyecto?.nombre || '')
  const [ubicacion, setUbicacion] = useState(proyecto?.ubicacion || '')
  const [cliente, setCliente] = useState(proyecto?.cliente || '')
  const [contacto, setContacto] = useState(proyecto?.contacto || '')
  const [fechaInicio, setFechaInicio] = useState(proyecto?.fechaInicio || '')
  const [fechaEntrega, setFechaEntrega] = useState(proyecto?.fechaEntrega || '')
  const [descripcion, setDescripcion] = useState(proyecto?.descripcion || '')
  const { proveedores } = useProveedores()
  const { clientes } = useCliente() 
  const [tipo, setTipo] = useState<Proyecto['tipo']>(
  proyecto?.tipo || 'Instalación'
  )

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

 const [clienteId, setClienteId] = useState<number | undefined>(
  proyecto?.clienteId
)

const [proveedorId, setProveedorId] = useState<number | undefined>(
  proyecto?.proveedorId
)
  const autocompleteRef =
    useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places']
  })

  const handleSubmit = async () => {
  if (!nombre || !ubicacion || !fechaInicio || !fechaEntrega) return

  const res = await fetch('/api/proyectos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre,
      ubicacion,
      clienteId,
      contacto,
      fechaInicio,
      fechaEntrega,
      descripcion,
      tipo,
      proveedorId
    })
  })

  const data = await res.json()

  if (!data.success) {
    alert('Error al guardar proyecto')
    return
  }

  onSave({
    id: data.id,
    nombre,
    ubicacion,
    cliente: clientes.find(c => c.id === clienteId)?.razon_social || '',
    contacto,
    fechaInicio,
    fechaEntrega,
    descripcion,
    tipo,
    proveedorId,
    clienteId
  })
}



  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-gray-900 p-6 rounded-xl w-full max-w-lg border border-cyan-500"
      >
        <h2 className="text-cyan-300 font-bold text-xl mb-4">
          {proyecto ? 'Editar Proyecto' : 'Agregar Proyecto'}
        </h2>

        <input className="form-input" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />

        {isLoaded && (
          <Autocomplete
            onLoad={a => (autocompleteRef.current = a)}
            onPlaceChanged={() => {
              const place = autocompleteRef.current?.getPlace()
              if (place?.formatted_address) setUbicacion(place.formatted_address)
            }}
          >
            <input className="form-input" placeholder="Ubicación" value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
          </Autocomplete>
        )}

        <select
          className="form-input"
          value={clienteId || ''}
          onChange={e => setClienteId(Number(e.target.value))}
        >
          <option value="">Selecciona un cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.razon_social}
            </option>
          ))}
        </select>

        <input className="form-input" placeholder="Contacto" value={contacto} onChange={e => setContacto(e.target.value)} />

        <div className="flex gap-2">
          <input type="date" className="form-input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          <input type="date" className="form-input" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
        </div>

        <textarea className="form-input" rows={3} placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />

        <select
          className="form-input"
          value={proveedorId}
          onChange={e => setProveedorId(Number(e.target.value))}
        >
          <option value="">Selecciona un proveedor</option>
          {proveedores.map(p => (
            <option key={p.id} value={p.id}>
              {p.razon_social}
            </option>
          ))}

        </select>


        <div className="flex justify-end gap-2 mt-4">
          <button className="bg-gray-700 px-4 py-2 rounded" onClick={onClose}>
            Cancelar
          </button>
          <button className="bg-cyan-500 px-4 py-2 rounded text-gray-900" onClick={handleSubmit}>
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}