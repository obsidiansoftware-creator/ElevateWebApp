"use client"

import { useEffect, useState } from "react"
import FirmaContrato from "@/app/components/FirmaContrato"

type Contrato = {
  id: number
  numero: string
  cliente_nombre: string
  total: number
  estado: "PENDIENTE" | "FIRMADO" | "ACTIVO" | "CANCELADO"
  firma_cliente?: string | null
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [selected, setSelected] = useState<Contrato | null>(null)

  const fetchContratos = async () => {
    const res = await fetch("/api/contratos")
    const data = await res.json()
    setContratos(data)
  }

  useEffect(() => {
    fetchContratos()
  }, [])

  const cambiarEstado = async (
    id: number,
    estado: "PENDIENTE" | "FIRMADO" | "ACTIVO" | "CANCELADO"
  ) => {
    await fetch("/api/contratos/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    })

    fetchContratos()
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">
            📄 Gestión de Contratos
          </h1>
          <p className="text-gray-400 mt-1">
            Administra y activa contratos firmados
          </p>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-zinc-900 rounded-xl shadow-lg overflow-hidden border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-cyan-400 uppercase text-xs">
            <tr>
              <th className="p-4 text-left">Número</th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Estado</th>
              <th className="p-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contratos.map((c) => (
              <tr
                key={c.id}
                className="border-t border-zinc-800 hover:bg-zinc-800 transition"
              >
                <td className="p-4 font-medium">{c.numero}</td>
                <td className="p-4">{c.cliente_nombre}</td>
                <td className="p-4">${c.total.toLocaleString()}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-700 text-cyan-300">
                    {c.estado}
                  </span>
                </td>
                <td className="p-4 space-x-2">

                  <button
                    onClick={() => setSelected(c)}
                    className="bg-cyan-600 hover:bg-cyan-500 px-3 py-1 rounded text-sm transition"
                  >
                    Ver
                  </button>

                  {c.estado === "FIRMADO" && (
                    <button
                      onClick={() => cambiarEstado(c.id, "ACTIVO")}
                      className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm transition"
                    >
                      Activar
                    </button>
                  )}

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-[600px] relative shadow-2xl">

            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✖
            </button>

            <h2 className="text-xl font-bold text-cyan-400 mb-4">
              Contrato {selected.numero}
            </h2>

            <div className="space-y-2 text-gray-300">
              <p><strong>Cliente:</strong> {selected.cliente_nombre}</p>
              <p><strong>Total:</strong> ${selected.total.toLocaleString()}</p>
              <p><strong>Estado:</strong> {selected.estado}</p>
            </div>

            {/* FIRMA */}
            {selected.estado === "PENDIENTE" && (
              <div className="mt-6">
                <FirmaContrato
                  contratoId={selected.id}
                  onFirmado={() => {
                    setSelected(null)
                    fetchContratos()
                  }}
                />
              </div>
            )}

            {/* IMAGEN FIRMA */}
            {selected.firma_cliente && (
              <div className="mt-6">
                <h3 className="font-bold text-cyan-400 mb-2">Firma:</h3>
                <img
                  src={selected.firma_cliente}
                  alt="Firma"
                  className="border border-zinc-700 rounded"
                />
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}