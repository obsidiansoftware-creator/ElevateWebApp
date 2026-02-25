'use client'

import "leaflet/dist/leaflet.css";
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCliente } from '@/app/dashboardCliente/contexts/ClientesContext'
import type { Cliente } from '@/app/dashboardCliente/contexts/ClientesContext'

type opcionCliente = 'Empresa' | 'Fisica'

interface ClienteFormProps {
  onClose: () => void
}

export default function ClienteForm({ onClose }: { onClose: () => void }) {
  const { addCliente } = useCliente()

  // Estados del formulario
  const [nombre, setNombre] = useState('')
  const [representante, setRepresentante] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [rfc, setRfc] = useState('')
  const [tipoCliente, setTipoCliente] = useState<opcionCliente | null>(null)

  const seleccionarTipoCliente = (tipo: opcionCliente) => setTipoCliente(tipo)

  // Cerrar con ESC
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  // Función para guardar
  const handleSave = async () => {
  if (!nombre || !tipoCliente) {
    alert('Nombre y tipo de cliente son obligatorios')
    return
  }

  const tipo = tipoCliente.toLowerCase() === 'empresa' ? 'empresa' : 'persona_fisica'

  try {
    const res = await fetch('/apiCliente/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        contacto: representante,
        tipo,
        telefono,
        correo,
        ubicacion,
        rfc
      })
    })

    const data = await res.json()
    if (!data.success) {
      alert('Error al guardar cliente: ' + (data.error || 'desconocido'))
      return
    }

    addCliente({
      id: data.id,
      razon_social: nombre,
      nombre_contacto: representante,
      direccion: ubicacion,
      telefono,
      email: correo,
      rfc,
      tipo_cliente: tipo,
      estatus: 'activo',
      notas: ''
    })

    onClose()
  } catch (error) {
    alert('Error al guardar cliente: ' + (error instanceof Error ? error.message : 'desconocido'))
  }
}


  // JSX
  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-lg border border-indigo-500" onClick={e => e.stopPropagation()}>
        <h2 className="text-indigo-400 font-bold text-xl mb-4">Agregar Cliente</h2>

        <input className="form-input" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <input className="form-input" placeholder="Representante" value={representante} onChange={e => setRepresentante(e.target.value)} />
        <input className="form-input" placeholder="Ubicación" value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
        <input className="form-input" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
        <input className="form-input" placeholder="Correo" value={correo} onChange={e => setCorreo(e.target.value)} />
        <input className="form-input" placeholder="RFC" value={rfc} onChange={e => setRfc(e.target.value)} />

        <div className="flex gap-4 my-3">
          {(['Empresa', 'Fisica'] as opcionCliente[]).map(s => (
            <label key={s} className="flex items-center gap-2 text-cyan-300">
              <input type="radio" name="tipoCliente" checked={tipoCliente === s} onChange={() => seleccionarTipoCliente(s)} />
              {s}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-gray-700 px-4 py-2 rounded">Cancelar</button>
          <button onClick={handleSave} className="bg-emerald-500 px-4 py-2 rounded text-gray-900">Guardar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
