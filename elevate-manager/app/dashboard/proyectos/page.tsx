'use client'

import { useState } from 'react'
import { useProyectos, Proyecto } from '@/app/dashboard/contexts/ProyectosContext'
import { useProveedores } from '@/app/dashboard/contexts/ProveedoresContext'
import { useCliente } from '@/app/dashboard/contexts/ClientesContext'
import ProyectoForm from '@/app/dashboard/proyectos/proyectos/ProyectForm'
import ProveedorForm from '@/app/dashboard/proveedores/ProveedorForm'
import ClienteForm from '@/app/dashboard/clientes/ClienteForm'

export default function ProyectosPage() {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } =
    useProyectos()

  const { proveedores } = useProveedores()
  const { clientes } = useCliente()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Proyecto | null>(null)
  const [search, setSearch] = useState('')
  const [showProveedorForm, setShowProveedorForm] = useState(false)
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState('')

  const filtered = proyectos.filter(
    p =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este proyecto?')) return
    deleteProyecto(id)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-3xl font-bold text-cyan-400">
          GESTOR DE PROYECTOS
        </h1>

        <div className="flex flex-col gap-2">
          <button
            className="bg-cyan-500 text-gray-900 px-4 py-2 rounded hover:bg-cyan-600"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            ▸ Agregar Proyecto
          </button>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por nombre o cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full md:w-1/3 px-3 py-2 rounded-lg border border-cyan-500 bg-gray-900 text-cyan-100"
      />

      {/* Lista */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div
            key={p.id}
            className="bg-gray-800 p-4 rounded-xl border border-cyan-500 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-cyan-200 font-semibold text-lg">
                {p.nombre}
              </h2>
              <p className="text-cyan-400 text-sm">
                {p.cliente} - {p.contacto}
              </p>
              <p className="text-cyan-400 text-sm">{p.ubicacion}</p>
              <p className="text-cyan-500 text-xs">
                {p.fechaInicio} → {p.fechaEntrega}
              </p>
              <p className="text-cyan-400 mt-1">{p.descripcion}</p>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="bg-yellow-500 px-3 py-1 rounded"
                onClick={() => {
                  setEditing(p)
                  setShowForm(true)
                }}
              >
                Editar
              </button>

              <button
                className="bg-red-500 px-3 py-1 rounded"
                onClick={() => handleDelete(p.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {showForm && (
        <ProyectoForm
          proyecto={editing}
          onClose={() => setShowForm(false)}
          onSave={proyectoGuardado => {
            if (editing) {
              updateProyecto(proyectoGuardado)
            } else {
              addProyecto({
                ...proyectoGuardado,
                cliente: selectedCliente,
                id: Date.now()
              })
            }
            setShowForm(false)
          }}
        />
      )}

      {showProveedorForm && (
        <ProveedorForm onClose={() => setShowProveedorForm(false)} />
      )}

      {showClienteForm && (
        <ClienteForm onClose={() => setShowClienteForm(false)} />
      )}
    </div>
  )
}
