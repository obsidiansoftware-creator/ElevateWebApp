'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useProveedores, Proveedor, ServicioProveedor } from '@/app/dashboard/contexts/ProveedoresContext'

interface ProveedorFormProps {
  onClose: () => void
}

export default function ProveedorForm({ onClose }: ProveedorFormProps) {
  const { addProveedor } = useProveedores()

  const [razonSocial, setRazonSocial] = useState('')
  const [nombreContacto, setNombreContacto] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [rfc, setRfc] = useState('')
  const [tipoProveedor, setTipoProveedor] = useState<ServicioProveedor | ''>('')
  const [banco, setBanco] = useState('')
  const [cuentaBancaria, setCuentaBancaria] = useState('')
  const [clabe, setClabe] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const handleSave = async () => {
    if (!razonSocial) {
      alert('La razón social es obligatoria')
      return
    }

    try {
      const res = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razon_social: razonSocial,
          nombre_contacto: nombreContacto || null,
          direccion: direccion || null,
          telefono: telefono || null,
          email: email || null,
          rfc: rfc || null,
          tipo_proveedor: tipoProveedor || null,
          banco: banco || null,
          cuenta_bancaria: cuentaBancaria || null,
          clabe: clabe || null,
          notas: notas || null,
        })
      })

      const data = await res.json()

      if (!data.success) {
        alert('Error al guardar proveedor: ' + (data.error || 'desconocido'))
        return
      }

      addProveedor({
        id: data.id,
        razon_social: razonSocial,
        nombre_contacto: nombreContacto,
        direccion,
        telefono,
        email,
        rfc,
        tipo_proveedor: tipoProveedor || undefined,
        banco,
        cuenta_bancaria: cuentaBancaria,
        clabe,
        notas,
        estatus: 'activo',
        created_by: 0,
        created_at: new Date().toISOString()
      } as Proveedor)

      onClose()

    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Error al guardar proveedor: ' + error.message)
      } else {
        alert('Error al guardar proveedor: desconocido')
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-4xl border border-emerald-500">
        <h2 className="text-emerald-400 font-bold text-xl mb-4">
          Agregar Proveedor
        </h2>

        {/* GRID DOS COLUMNAS */}
        <div className="grid grid-cols-2 gap-4">

          {/* Columna 1 */}
          <div className="flex flex-col gap-2">
            <input
              className="form-input"
              placeholder="Razón Social"
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
            />

            <input
              className="form-input"
              placeholder="Nombre Contacto"
              value={nombreContacto}
              onChange={e => setNombreContacto(e.target.value)}
            />

            <input
              className="form-input"
              placeholder="Dirección"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
            />

            <textarea
              className="form-input"
              placeholder="Notas"
              value={notas}
              onChange={e => setNotas(e.target.value)}
            />
          </div>

          {/* Columna 2 */}
          <div className="flex flex-col gap-2">

            <input
              className="form-input"
              placeholder="Teléfono"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />

            <input
              className="form-input"
              placeholder="Correo"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <input
              className="form-input"
              placeholder="RFC"
              value={rfc}
              onChange={e => setRfc(e.target.value)}
            />

            {/* SELECT TIPO PROVEEDOR */}
            <select
              className="form-input"
              value={tipoProveedor}
              onChange={e =>
                setTipoProveedor(e.target.value as ServicioProveedor)
              }
            >
              <option value="">Selecciona tipo proveedor</option>
              <option value="Instalación">Instalación</option>
              <option value="Ajuste">Ajuste</option>
            </select>

            <input
              className="form-input"
              placeholder="Banco"
              value={banco}
              onChange={e => setBanco(e.target.value)}
            />

            <input
              className="form-input"
              placeholder="Cuenta Bancaria"
              value={cuentaBancaria}
              onChange={e => setCuentaBancaria(e.target.value)}
            />

            <input
              className="form-input"
              placeholder="CLABE"
              value={clabe}
              onChange={e => setClabe(e.target.value)}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-700 px-4 py-2 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="bg-emerald-500 px-4 py-2 rounded text-gray-900"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
