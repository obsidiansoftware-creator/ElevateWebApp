'use client'

import { useState } from 'react'
import { useProveedores, Proveedor } from '@/app/dashboardCliente/contexts/ProveedoresContext'
import ProveedorForm from '@/app/dashboardCliente/proveedores/ProveedorForm'

export default function ProveedoresPage() {
  const { proveedores } = useProveedores()

  const [search, setSearch] = useState('')
  const [showProveedorForm, setShowProveedorForm] = useState(false)

  const filtered = proveedores.filter(p =>
    p.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    p.nombre_contacto?.toLowerCase().includes(search.toLowerCase()) ||
    p.rfc?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-3xl font-bold text-cyan-400">
          GESTOR DE PROVEEDORES
        </h1>

        <button
          className="bg-emerald-500 text-gray-900 px-4 py-2 rounded hover:bg-emerald-600"
          onClick={() => setShowProveedorForm(true)}
        >
          ▸ Agregar Proveedor
        </button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por razón social, contacto o RFC..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full md:w-1/3 px-3 py-2 rounded-lg border border-cyan-500 bg-gray-900 text-cyan-100"
      />

      {/* Lista de proveedores */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div
            key={p.id}
            className="bg-gray-800 p-4 rounded-xl border border-cyan-500 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-cyan-200 font-semibold text-lg">
                {p.razon_social}
              </h2>

              <p className="text-cyan-400 text-sm">{p.nombre_contacto}</p>
              <p className="text-cyan-400 text-sm">{p.telefono}</p>
              <p className="text-cyan-400 text-sm">{p.email}</p>

              <p className="text-cyan-500 text-xs">RFC: {p.rfc}</p>
              <p className="text-cyan-400 mt-1">{p.direccion}</p>

              <p className="text-cyan-500 text-xs mt-2">Estatus: {p.estatus}</p>
              <p className="text-cyan-400 text-xs mt-1">
                Tipo: {p.tipo_proveedor || 'N/A'}
              </p>

              {p.banco && (
                <p className="text-cyan-400 text-xs">
                  Banco: {p.banco}, Cuenta: {p.cuenta_bancaria || 'N/A'}, CLABE: {p.clabe || 'N/A'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Proveedor */}
      {showProveedorForm && (
        <ProveedorForm onClose={() => setShowProveedorForm(false)} />
      )}
    </div>
  )
}
