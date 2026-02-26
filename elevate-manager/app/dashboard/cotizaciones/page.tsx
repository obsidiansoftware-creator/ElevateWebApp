"use client"

import { useState } from "react"

type FormCotizacion = {
  cliente_id: string
  capacidad: number
  paradas: number
  velocidad: number
  tipo: string
  acabados: string
  margen: number
}

type ResultadoCotizacion = {
  numero: string
  precioFinal: number
}

export default function CotizacionesPage() {

  const [form, setForm] = useState<FormCotizacion>({
    cliente_id: "",
    capacidad: 630,
    paradas: 5,
    velocidad: 1,
    tipo: "HIDRAULICO",
    acabados: "ESTANDAR",
    margen: 25,
  })

  const [resultado, setResultado] = useState<ResultadoCotizacion | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (["capacidad", "paradas", "velocidad", "margen"].includes(name)) {
      setForm({
        ...form,
        [name]: Number(value),
      })
    } else {
      setForm({
        ...form,
        [name]: value,
      })
    }
  }

  const generarCotizacion = async () => {
    const res = await fetch("/api/cotizaciones/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data: ResultadoCotizacion = await res.json()
    setResultado(data)
  }

  const convertirContrato = async (numeroCotizacion: string) => {
    await fetch("/api/contratos/crear-desde-cotizacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: numeroCotizacion }),
    })

    alert("Contrato generado")
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">
            Generar Cotización
          </h1>
          <p className="text-gray-400 mt-1">
            Configura elevador y calcula costos automáticamente
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-lg">

        <input
          name="cliente_id"
          placeholder="ID Cliente"
          onChange={handleChange}
          className="bg-zinc-800 border border-zinc-700 p-3 rounded text-white"
        />

        <input
          name="capacidad"
          type="number"
          placeholder="Capacidad (kg)"
          onChange={handleChange}
          className="bg-zinc-800 border border-zinc-700 p-3 rounded text-white"
        />

        <input
          name="paradas"
          type="number"
          placeholder="Número de paradas"
          onChange={handleChange}
          className="bg-zinc-800 border border-zinc-700 p-3 rounded text-white"
        />

        <input
          name="velocidad"
          type="number"
          step="0.1"
          placeholder="Velocidad m/s"
          onChange={handleChange}
          className="bg-zinc-800 border border-zinc-700 p-3 rounded text-white"
        />

        <select
          name="tipo"
          onChange={handleChange}
          className="bg-zinc-800 border border-zinc-700 p-3 rounded text-white"
        >
          <option value="HIDRAULICO">Hidráulico</option>
          <option value="TRACCION">Tracción</option>
          <option value="PANORAMICO">Panorámico</option>
          <option value="MONTACARGAS">Montacargas</option>
        </select>

        <select
          name="acabados"
          onChange={handleChange}
          className="bg-zinc-800 border border-zinc-700 p-3 rounded text-white"
        >
          <option value="ESTANDAR">Estándar</option>
          <option value="LUJO">Lujo</option>
          <option value="PREMIUM">Premium</option>
        </select>

        <input
          name="margen"
          type="number"
          placeholder="Margen (%)"
          onChange={handleChange}
          className="bg-zinc-800 border border-zinc-700 p-3 rounded text-white"
        />

      </div>

      {/* BUTTON */}
      <button
        onClick={generarCotizacion}
        className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 mt-6 rounded-lg font-semibold transition"
      >
        Calcular y Guardar
      </button>

      {/* RESULTADO */}
      {resultado && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">
            Resultado
          </h2>

          <p className="text-gray-300">
            <strong>Número:</strong> {resultado.numero}
          </p>

          <p className="text-gray-300 mt-2">
            <strong>Precio Final:</strong>{" "}
            ${resultado.precioFinal.toLocaleString()}
          </p>

          <button
            onClick={() => convertirContrato(resultado.numero)}
            className="bg-green-600 hover:bg-green-500 px-5 py-2 mt-4 rounded-lg transition"
          >
            Convertir a Contrato
          </button>
        </div>
      )}

    </div>
  )
}