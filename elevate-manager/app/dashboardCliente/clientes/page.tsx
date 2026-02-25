'use client'

import { useState } from 'react'
import { useCliente, Cliente } from '@/app/dashboardCliente/contexts/ClientesContext'
import ClienteForm from '@/app/dashboardCliente/clientes/ClienteForm'

export default function ClientesPage() {
  const { clientes } = useCliente()

  const [search, setSearch] = useState('')
  const [showClienteForm, setShowClienteForm] = useState(false)

  const filtered = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    c.nombre_contacto?.toLowerCase().includes(search.toLowerCase()) ||
    c.rfc?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-3xl font-bold text-cyan-400">
          GESTOR DE CLIENTES
        </h1>

        <button
          className="bg-emerald-500 text-gray-900 px-4 py-2 rounded hover:bg-emerald-600"
          onClick={() => setShowClienteForm(true)}
        >
          ▸ Agregar Cliente
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

      {/* Lista */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div
            key={c.id}
            className="bg-gray-800 p-4 rounded-xl border border-cyan-500 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-cyan-200 font-semibold text-lg">
                {c.razon_social}
              </h2>

              <p className="text-cyan-400 text-sm">
                {c.nombre_contacto}
              </p>
          
              <p className="text-cyan-400 text-sm">
                {c.telefono}
              </p>

              <p className="text-cyan-400 text-sm">
                {c.email}
              </p>

              <p className="text-cyan-500 text-xs">
                RFC: {c.rfc}
              </p>

              <p className="text-cyan-400 mt-1">
                {c.direccion}
              </p>

              <p className="text-cyan-500 text-xs mt-2">
                Estatus: {c.estatus}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cliente */}
      {showClienteForm && (
        <ClienteForm onClose={() => setShowClienteForm(false)} />
      )}
    </div>
  )
}
