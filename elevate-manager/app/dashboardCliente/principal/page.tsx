"use client"

import { useMemo, useState } from "react"
import MexicoMap from "@/app/components/MexicoMap"


type EstadoEquipo = "Operativo" | "Revisión" | "Fuera de servicio"

interface Elevador {
  id: number
  nombre: string
  cliente: string
  estado: EstadoEquipo
  proximoMantenimiento: string
  incidenciaActiva: boolean
}

type ClienteFiltro = "Todos" | "Corporativo Alpha" | "Grupo Delta"

type KPIColor = "cyan" | "green" | "red" | "yellow"

interface KPIProps {
  titulo: string
  valor: number
  color: KPIColor
}


export default function PrincipalPage() {

  const [clienteFiltro, setClienteFiltro] =
    useState<ClienteFiltro>("Todos")

  const elevadores: Elevador[] = [
    {
      id: 1,
      nombre: "Torre A - Cabina 1",
      cliente: "Corporativo Alpha",
      estado: "Operativo",
      proximoMantenimiento: "2026-02-25",
      incidenciaActiva: false,
    },
    {
      id: 2,
      nombre: "Plaza Norte - Cabina 2",
      cliente: "Grupo Delta",
      estado: "Revisión",
      proximoMantenimiento: "2026-02-21",
      incidenciaActiva: true,
    },
    {
      id: 3,
      nombre: "Hospital Central",
      cliente: "Corporativo Alpha",
      estado: "Fuera de servicio",
      proximoMantenimiento: "2026-02-20",
      incidenciaActiva: true,
    },
  ]

  const filtrados = useMemo(() => {
    if (clienteFiltro === "Todos") return elevadores
    return elevadores.filter(e => e.cliente === clienteFiltro)
  }, [clienteFiltro, elevadores])

  const total = elevadores.length
  const operativos = elevadores.filter(e => e.estado === "Operativo").length
  const incidencias = elevadores.filter(e => e.incidenciaActiva).length

  const proximos = elevadores.filter(e => {
    const hoy = new Date()
    const fecha = new Date(e.proximoMantenimiento)
    const diff =
      (fecha.getTime() - hoy.getTime()) / (1000 * 3600 * 24)
    return diff <= 7
  }).length


  return (
    <div className="min-h-screen bg-black text-white p-4">

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">
            Panel Principal Elevate
          </h1>
          <p className="text-gray-400 mt-2">
            Monitoreo operativo en tiempo real
          </p>
        </div>

        <select
          value={clienteFiltro}
          onChange={(e) =>
            setClienteFiltro(e.target.value as ClienteFiltro)
          }
          className="bg-black/50 border border-cyan-500/30 rounded px-4 py-2 text-sm focus:outline-none focus:border-cyan-400"
        >
          <option value="Todos">Todos</option>
          <option value="Corporativo Alpha">
            Corporativo Alpha
          </option>
          <option value="Grupo Delta">Grupo Delta</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPI titulo="Elevadores Totales" valor={total} color="cyan" />
        <KPI titulo="Operativos" valor={operativos} color="green" />
        <KPI titulo="Incidencias Activas" valor={incidencias} color="red" />
        <KPI titulo="Mantenimientos <7 días" valor={proximos} color="yellow" />
      </div>

      {/* MAPA + INCIDENCIAS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* MAPA (conservado) */}
        <div className="xl:col-span-2 bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-4 shadow-lg shadow-cyan-500/10">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4 tracking-wide">
            Mapa de Operación
          </h2>
          <div className="h-96 bg-black/50 border border-cyan-500/20 rounded overflow-hidden">
            <MexicoMap />
          </div>
        </div>

        {/* INCIDENCIAS */}
        <div className="bg-black/70 border border-red-500/30 backdrop-blur-xl rounded-xl p-4 shadow-lg shadow-red-500/10">
          <h2 className="text-lg font-semibold text-red-300 mb-4 tracking-wide">
            Incidencias Activas
          </h2>

          {filtrados.filter(e => e.incidenciaActiva).length === 0 ? (
            <p className="text-gray-400 text-sm">
              No hay incidencias activas.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              {filtrados
                .filter(e => e.incidenciaActiva)
                .map(e => (
                  <div
                    key={e.id}
                    className="bg-black/50 border border-red-500/20 rounded p-3"
                  >
                    <div className="font-semibold text-white">
                      {e.nombre}
                    </div>
                    <div className="text-red-400 text-xs mt-1">
                      Cliente: {e.cliente}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* TABLA OPERATIVA */}
      <div className="bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-4 shadow-lg shadow-cyan-500/10 overflow-x-auto">
        <h2 className="text-lg font-semibold text-cyan-300 mb-6 tracking-wide">
          Estado General de Equipos
        </h2>

        <table className="w-full text-sm">
          <thead className="border-b border-cyan-500/30 text-cyan-300">
            <tr>
              <th className="py-3 text-left">Elevador</th>
              <th className="py-3 text-left">Cliente</th>
              <th className="py-3 text-left">Estado</th>
              <th className="py-3 text-left">Próx. Mantenimiento</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(e => (
              <tr key={e.id} className="border-b border-gray-800">
                <td className="py-3">{e.nombre}</td>
                <td>{e.cliente}</td>
                <td>
                  <EstadoBadge estado={e.estado} />
                </td>
                <td>{e.proximoMantenimiento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}


function KPI({ titulo, valor, color }: KPIProps) {

  const colores: Record<KPIColor, string> = {
    cyan: "border-cyan-500/30 shadow-cyan-500/10 text-cyan-400",
    green: "border-green-500/30 shadow-green-500/10 text-green-400",
    red: "border-red-500/30 shadow-red-500/10 text-red-400",
    yellow: "border-yellow-500/30 shadow-yellow-500/10 text-yellow-400",
  }

  return (
    <div
      className={`bg-black/70 border ${colores[color]} backdrop-blur-xl rounded-xl p-4 shadow-lg`}
    >
      <h3 className="text-sm text-gray-400 mb-2">
        {titulo}
      </h3>
      <div className="text-3xl font-bold">
        {valor}
      </div>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: EstadoEquipo }) {
  const estilos: Record<EstadoEquipo, string> = {
    Operativo: "bg-green-500/20 text-green-400",
    Revisión: "bg-yellow-500/20 text-yellow-400",
    "Fuera de servicio": "bg-red-500/20 text-red-400",
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${estilos[estado]}`}>
      {estado}
    </span>
  )
}