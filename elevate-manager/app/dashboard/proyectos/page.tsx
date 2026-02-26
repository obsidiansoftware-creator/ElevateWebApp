'use client'

import { useState } from 'react'
import { useProyectos, Proyecto } from '@/app/dashboard/contexts/ProyectosContext'
import ProyectoForm from '@/app/dashboard/proyectos/proyectos/ProyectForm'

export default function ProyectosPage() {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useProyectos()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Proyecto | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
  'TODOS' | 'ACTIVO' | 'POR INICIAR' | 'FINALIZADO'
>('TODOS')

    type ProyectoWithStatus = Proyecto & {
      status: {
        label: 'ACTIVO' | 'POR INICIAR' | 'FINALIZADO'
        color: string
        border: string
        priority: number
      }
    }
      const processedProyectos: ProyectoWithStatus[] = proyectos
      .map((p) => {
        const status = getProyectoStatus(p.fechaInicio, p.fechaEntrega)
        return { ...p, status }
      })
      .filter((p) => {
        const matchesSearch =
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.cliente.toLowerCase().includes(search.toLowerCase()) ||
          p.ubicacion.toLowerCase().includes(search.toLowerCase())

        const matchesStatus =
          statusFilter === 'TODOS' || p.status.label === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => a.status.priority - b.status.priority)

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este proyecto?')) return

    const res = await fetch('/api/proyectos', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    const data = await res.json()

    if (data.success) {
      deleteProyecto(id)
    } else {
      alert('Error al eliminar')
    }
  }

    function getProyectoStatus(
        fechaInicio: string,
        fechaEntrega: string
      ): {
        label: 'ACTIVO' | 'POR INICIAR' | 'FINALIZADO'
        color: string
        border: string
        priority: number
      } { 
        const hoy = new Date()
        const inicio = new Date(fechaInicio)
        const fin = new Date(fechaEntrega)

        hoy.setHours(0, 0, 0, 0)
        inicio.setHours(0, 0, 0, 0)
        fin.setHours(0, 0, 0, 0)

        if (hoy < inicio) {
          return {
            label: 'POR INICIAR',
            color: 'bg-yellow-500',
            border: 'border-yellow-500',
            priority: 2
          }
        }

        if (hoy > fin) {
          return {
            label: 'FINALIZADO',
            color: 'bg-red-600',
            border: 'border-red-600',
            priority: 3
          }
        }

        return {
          label: 'ACTIVO',
          color: 'bg-green-600',
          border: 'border-green-600',
          priority: 1
        }
      }

  const getTipoColor = (tipo?: string | null) => {
    if (!tipo) return 'bg-gray-300'

    const t = tipo.toLowerCase().trim()

    if (t.includes('instal')) return 'bg-red-400'
    if (t.includes('ajust')) return 'bg-blue-400'

    return 'bg-green-400'
  }
    
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-3xl font-bold text-cyan-400">
          GESTOR DE PROYECTOS
        </h1>

        <button
          className="bg-cyan-500 text-gray-900 px-4 py-2 rounded hover:bg-cyan-600 transition"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
        >
          ▸ Agregar Proyecto
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, cliente o ubicación..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/3 px-3 py-2 rounded-lg border border-cyan-500 bg-gray-900 text-cyan-100"
      />
      <div className="flex gap-2 flex-wrap">
      {['TODOS', 'ACTIVO', 'POR INICIAR', 'FINALIZADO'].map((option) => (
        <button
          key={option}
          onClick={() => setStatusFilter(option as any)}
          className={`px-3 py-1 rounded text-sm transition ${
            statusFilter === option
              ? 'bg-cyan-500 text-gray-900'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {processedProyectos.map((p) => {
        console.log("TIPO PROVEEDOR:", p.tipo_proveedor)
        const status = p.status
        return (
          <div
            key={p.id}
            className={`relative bg-gray-800 p-4 rounded-xl border ${status.border} flex flex-col justify-between shadow-lg transition`}
          >
            {/* Badge Status */}
            <span
              className={`absolute top-3 right-3 text-xs px-2 py-1 rounded text-white font-semibold shadow ${status.color}`}
            >
              {status.label}
            </span>

            <div className="space-y-1">
              <h2 className="text-cyan-200 font-semibold text-lg">
                {p.nombre}
              </h2>

              <p className="text-cyan-400 text-sm">
                Cliente: {p.cliente}
              </p>

              <p className="text-cyan-400 text-sm">
                Ubicación: {p.ubicacion}
              </p>

              <p className="text-cyan-400 text-sm">
                Contacto: {p.contacto}
              </p>

              <p className="text-cyan-500 text-xs">
                {p.fechaInicio} → {p.fechaEntrega}
              </p>

              <p className="text-cyan-400 mt-2 text-sm">
                {p.descripcion}
              </p>

              <span
              className={`
                inline-block mt-2 text-xs px-2 py-1 rounded text-gray-900 font-medium
                ${getTipoColor(p.tipo_proveedor)}
              `}
            >
              {p.tipo_proveedor ?? 'Otro'}
            </span>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="bg-yellow-500 px-3 py-1 rounded hover:bg-yellow-600 transition"
                  onClick={() => {
                    setEditing(p)
                    setShowForm(true)
                  }}
                >
                  Editar
                </button>

                <button
                  className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
                  onClick={() => handleDelete(p.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {showForm && (
        <ProyectoForm
          proyecto={editing}
          onClose={() => setShowForm(false)}
          onSave={async (proyectoGuardado: Proyecto) => {
            if (editing) {
              const res = await fetch('/api/proyectos', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editing, ...proyectoGuardado })
              })

              const data = await res.json()

              if (data.success) {
                // 🔹 Merge completo de campos para que no se pierda nada
                const proyectoActualizado: Proyecto = {
                  ...editing,
                  ...proyectoGuardado,
                  id: editing.id,           // asegura que el id sea el mismo
                  cliente: proyectoGuardado.cliente ?? editing.cliente,
                  contacto: proyectoGuardado.contacto ?? editing.contacto,
                  tipo_proveedor: proyectoGuardado.tipo_proveedor ?? editing.tipo_proveedor
                }

                updateProyecto(proyectoActualizado)
              }

            } else {
              const res = await fetch('/api/proyectos', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proyectoGuardado)
              })

              const data = await res.json()

              if (data.success) {
                addProyecto({
                  ...proyectoGuardado,
                  id: Number(data.id)
                })
              }
            }

            setShowForm(false)
          }}

        />
      )}
    </div>
  )
}
