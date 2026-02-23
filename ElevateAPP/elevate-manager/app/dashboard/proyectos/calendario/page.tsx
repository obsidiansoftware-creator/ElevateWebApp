'use client'

import { useState, useEffect } from 'react'
import { useProyectos, Proyecto } from '../../contexts/ProyectosContext'

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const tipos = [
  { key: 'Instalación', color: 'bg-red-400' },
  { key: 'Ajuste', color: 'bg-blue-400' },
  { key: 'Otro', color: 'bg-green-400' },
]

export default function CalendarioPage() {
  const { proyectos } = useProyectos()

  /* =========================
     Estado de calendario
  ========================== */
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  /* =========================
     Filtros
  ========================== */
  const [filtros, setFiltros] = useState<Record<string, boolean>>({
    Instalación: true,
    Ajuste: true,
    Otro: true,
  })

  const toggleFiltro = (tipo: string) => {
    setFiltros(prev => ({ ...prev, [tipo]: !prev[tipo] }))
  }

  /* =========================
     Modal detalle
  ========================== */
  const [selected, setSelected] = useState<Proyecto | null>(null)

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])

  /* =========================
     Helpers
  ========================== */
  const getProjectsForDay = (day: number) =>
    proyectos.filter(p => {
      if (!filtros[p.tipo]) return false
      const start = new Date(p.fechaInicio)
      const end = new Date(p.fechaEntrega)
      const d = new Date(year, month, day)
      return d >= start && d <= end
    })

  const changeMonth = (dir: -1 | 1) => {
    setMonth(prev => {
      if (prev + dir < 0) {
        setYear(y => y - 1)
        return 11
      }
      if (prev + dir > 11) {
        setYear(y => y + 1)
        return 0
      }
      return prev + dir
    })
  }

  const monthName = new Date(year, month).toLocaleString('es-MX', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">
            Calendario de Proyectos
          </h1>
          <p className="text-cyan-600 text-sm capitalize">{monthName}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1 rounded bg-gray-800 text-cyan-300 hover:bg-gray-700"
          >
            ←
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1 rounded bg-gray-800 text-cyan-300 hover:bg-gray-700"
          >
            →
          </button>
        </div>
      </div>

      {/* ================= FILTROS ================= */}
      <div className="flex gap-3 flex-wrap">
        {tipos.map(t => (
          <button
            key={t.key}
            onClick={() => toggleFiltro(t.key)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium border transition
              ${
                filtros[t.key]
                  ? `${t.color} text-gray-900 border-transparent`
                  : 'bg-gray-800 text-gray-400 border-gray-600 line-through'
              }
            `}
          >
            {t.key}
          </button>
        ))}
      </div>

      {/* ================= DÍAS ================= */}
      <div className="grid grid-cols-7 gap-2 text-center text-cyan-300 text-sm font-semibold">
        {weekDays.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* ================= CALENDARIO ================= */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const projects = getProjectsForDay(day)

          return (
            <div
              key={day}
              className="
                bg-gray-900 border border-cyan-800 rounded-xl p-2 h-32
                overflow-y-auto no-scrollbar
                hover:border-cyan-500 transition
              "
            >
              <div className="text-xs text-cyan-400 font-semibold mb-1">
                {day}
              </div>

              {projects.length === 0 && (
                <p className="text-[10px] text-gray-600 italic">
                  Sin proyectos
                </p>
              )}

              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`
                    cursor-pointer text-[11px] px-2 py-0.5 rounded mb-1 truncate
                    ${
                      p.tipo === 'Instalación'
                        ? 'bg-red-400'
                        : p.tipo === 'Ajuste'
                        ? 'bg-blue-400'
                        : 'bg-green-400'
                    }
                    text-gray-900 font-medium
                  `}
                >
                  {p.nombre}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* ================= MODAL DETALLE ================= */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="
              bg-gray-900 border border-cyan-500 rounded-xl p-6 w-full max-w-md
              shadow-[0_0_40px_rgba(34,211,238,0.4)]
            "
          >
            <h2 className="text-xl font-bold text-cyan-300 mb-2">
              {selected.nombre}
            </h2>

            <p className="text-cyan-400 text-sm mb-1">
              Cliente: {selected.cliente}
            </p>
            <p className="text-cyan-400 text-sm mb-1">
              Ubicación: {selected.ubicacion}
            </p>
            <p className="text-cyan-500 text-xs mb-2">
              {selected.fechaInicio} → {selected.fechaEntrega}
            </p>
            <p className="text-cyan-300 text-sm">
              {selected.descripcion || 'Sin descripción'}
            </p>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded bg-gray-700 text-cyan-300 hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
  