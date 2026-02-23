'use client'

import { useState } from 'react'

type TipoMantenimiento = 'Preventivo' | 'Correctivo' | 'Predictivo'

interface Mantenimiento {
  id: number
  elevador: string
  tipo: TipoMantenimiento
  fecha: string
  tecnico: string
  estado: 'Pendiente' | 'En proceso' | 'Finalizado'
}

export default function MantenimientosPage() {
  const [tipoActivo, setTipoActivo] = useState<TipoMantenimiento>('Preventivo')
  const [mostrarModal, setMostrarModal] = useState(false)

  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([
    {
      id: 1,
      elevador: 'Elevador Torre A',
      tipo: 'Preventivo',
      fecha: '2026-02-15',
      tecnico: 'Juan Pérez',
      estado: 'Finalizado',
    },
    {
      id: 2,
      elevador: 'Elevador Plaza Norte',
      tipo: 'Correctivo',
      fecha: '2026-02-18',
      tecnico: 'Carlos Ruiz',
      estado: 'En proceso',
    },
  ])

  const filtrados = mantenimientos.filter(m => m.tipo === tipoActivo)

  return (
    <div className="min-h-screen bg-black text-white p-4">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">
            Gestión de Mantenimientos
          </h1>
          <p className="text-gray-400 mt-2">
            Control de servicios preventivos, correctivos y predictivos.
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg font-semibold transition"
        >
          + Nuevo Mantenimiento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {['Preventivo', 'Correctivo', 'Predictivo'].map(tipo => (
          <button
            key={tipo}
            onClick={() => setTipoActivo(tipo as TipoMantenimiento)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              tipoActivo === tipo
                ? 'bg-cyan-500 text-black'
                : 'bg-black/70 border border-cyan-500/30'
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-4 shadow-lg shadow-cyan-500/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-cyan-300 border-b border-cyan-500/30">
            <tr>
              <th className="py-3 text-left">Elevador</th>
              <th className="py-3 text-left">Fecha</th>
              <th className="py-3 text-left">Técnico</th>
              <th className="py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map(m => (
                <tr key={m.id} className="border-b border-gray-800">
                  <td className="py-3">{m.elevador}</td>
                  <td className="py-3">{m.fecha}</td>
                  <td className="py-3">{m.tecnico}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        m.estado === 'Finalizado'
                          ? 'bg-green-500/20 text-green-400'
                          : m.estado === 'En proceso'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  No hay mantenimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-black border border-cyan-500/30 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">
              Nuevo Mantenimiento
            </h2>

            <form
              onSubmit={e => {
                e.preventDefault()
                setMostrarModal(false)
              }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Nombre del elevador"
                className="w-full bg-black border border-gray-700 rounded-lg p-2"
                required
              />

              <select className="w-full bg-black border border-gray-700 rounded-lg p-2">
                <option>Preventivo</option>
                <option>Correctivo</option>
                <option>Predictivo</option>
              </select>

              <input
                type="date"
                className="w-full bg-black border border-gray-700 rounded-lg p-2"
                required
              />

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg font-semibold transition"
              >
                Guardar
              </button>
            </form>

            <button
              onClick={() => setMostrarModal(false)}
              className="mt-4 text-sm text-gray-500 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
