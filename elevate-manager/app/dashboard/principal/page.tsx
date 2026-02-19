"use client"

import MexicoMap from "@/app/components/MexicoMap"

export default function PrincipalPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">

      

      {/* Top Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* Venta Mensual */}
        <div className="bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4 tracking-wide">
            Venta Mensual
          </h2>

          <div className="text-3xl font-bold text-white mb-4">
            $58,592
          </div>

          <div className="h-3 bg-cyan-900/40 rounded-full mb-2">
            <div className="h-3 bg-cyan-400 rounded-full w-4/5 shadow-md shadow-cyan-400/40"></div>
          </div>

          <p className="text-xs text-cyan-300/70 mb-4">
            Meta: $68,371
          </p>

          <input
            placeholder="Elegir meta"
            className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Venta Promedio */}
        <div className="bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4 tracking-wide">
            Venta Promedio
          </h2>

          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-3xl font-bold text-white">$855</div>
              <p className="text-xs text-cyan-300/70">
                vs $564 Mes anterior
              </p>
            </div>

            <div className="text-cyan-400 font-semibold text-xl">
              ▲ 35%
              <p className="text-xs text-cyan-300/70">
                Tasa de cambio
              </p>
            </div>
          </div>

          {/* Mini gráfico */}
          <div className="flex items-end gap-2 h-16">
            <div className="bg-cyan-400/70 w-3 h-6 rounded"></div>
            <div className="bg-cyan-400/70 w-3 h-10 rounded"></div>
            <div className="bg-cyan-400/70 w-3 h-4 rounded"></div>
            <div className="bg-cyan-400/70 w-3 h-8 rounded"></div>
            <div className="bg-cyan-400/70 w-3 h-3 rounded"></div>
            <div className="bg-cyan-400/70 w-3 h-6 rounded"></div>
          </div>
        </div>

        {/* Mapa */}
        <div className="bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4 tracking-wide">
            Mapa de Ventas
          </h2>

          <div className="h-96 bg-black/50 border border-cyan-500/20 rounded overflow-hidden">
            <MexicoMap />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Indicadores */}
        <div className="xl:col-span-2 bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="text-xl font-semibold text-cyan-300 mb-6 tracking-wide">
            Indicadores de Crecimiento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-black/50 border border-cyan-500/20 rounded-lg p-6 text-center">
              <h3 className="text-cyan-300 mb-2 tracking-wide">
                Retención
              </h3>
              <div className="text-3xl font-bold text-cyan-400">
                99.28%
              </div>
              <p className="text-xs text-cyan-300/60 mt-2">
                Meta: 99.0%
              </p>
            </div>

            <div className="bg-black/50 border border-cyan-500/20 rounded-lg p-6 text-center">
              <h3 className="text-cyan-300 mb-2 tracking-wide">
                Expansión
              </h3>
              <div className="text-3xl font-bold text-cyan-400">
                2.86%
              </div>
              <p className="text-xs text-cyan-300/60 mt-2">
                Meta: 3.5%
              </p>
            </div>

          </div>
        </div>

        {/* Venta por Sucursal */}
        <div className="bg-black/70 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4 tracking-wide">
            Venta por Sucursal
          </h2>

          <select className="w-full mb-6 bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400">
            <option>Enero</option>
            <option>Febrero</option>
            <option>Marzo</option>
          </select>

          <div className="mb-6">
            <div className="text-2xl font-bold text-white">
              $5,632
            </div>
            <p className="text-xs text-cyan-300/70">
              Venta total
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-cyan-300">Sucursal 1</span>
                <span>$1,577</span>
              </div>
              <div className="h-2 bg-cyan-900/40 rounded">
                <div className="h-2 bg-cyan-400 w-4/5 rounded"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-cyan-300">Sucursal 2</span>
                <span>$886</span>
              </div>
              <div className="h-2 bg-cyan-900/40 rounded">
                <div className="h-2 bg-cyan-400 w-2/3 rounded"></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
