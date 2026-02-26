'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/* ========================= TYPES ========================= */

export interface Proyecto {
  id: number
  nombre: string
  ubicacion: string
  cliente: string
  contacto: string
  fechaInicio: string
  fechaEntrega: string
  descripcion: string
  proveedorId?: number
  clienteId?: number
  tipo?: string
  lat?: number | null
  lng?: number | null
  tipo_proveedor?: string | null
}

interface ProyectoDB {
  id: number
  nombre: string
  direccion_obra: string | null
  lat: number | null
  lng: number | null
  fecha_inicio: string | null
  fecha_fin_estimada: string | null
  notas: string | null
  cliente_final_id: number | null
  proveedor_id: number | null
  cliente_nombre: string | null
  tipo_proveedor?: string | null
}

interface GetProyectosResponse {
  success: boolean
  data: ProyectoDB[]
}

interface ProyectosContextType {
  proyectos: Proyecto[]
  addProyecto: (p: Proyecto) => void
  updateProyecto: (p: Proyecto) => void
  deleteProyecto: (id: number) => void
}

/* ========================= CONTEXT ========================= */

const ProyectosContext = createContext<ProyectosContextType | null>(null)

export function ProyectosProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])

  /* ========================= FETCH ========================= */

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const res = await fetch('/api/proyectos', {
          credentials: 'include'
        })

        const data: GetProyectosResponse = await res.json()

        if (!data.success) return

        const formatted: Proyecto[] = data.data.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          ubicacion: p.direccion_obra ?? '',
          cliente: p.cliente_nombre ?? '',
          contacto: '',
          fechaInicio: p.fecha_inicio ?? '',
          fechaEntrega: p.fecha_fin_estimada ?? '',
          descripcion: p.notas ?? '',
          tipo_proveedor: p.tipo_proveedor ?? null,
          proveedorId: p.proveedor_id ?? undefined,
          clienteId: p.cliente_final_id ?? undefined,
          lat: p.lat ?? null,
          lng: p.lng ?? null,
        }))

        setProyectos(formatted)

      } catch (error) {
        console.error('Error cargando proyectos:', error)
      }
    }

    fetchProyectos()
  }, [])

  /* ========================= ADD ========================= */

    const addProyecto = (p: Proyecto) => {
    const idNumerico = Number(p.id)

    setProyectos((prev) => {
      const exists = prev.some((x) => x.id === idNumerico)
      if (exists) return prev

      return [{ ...p, id: idNumerico }, ...prev]
    })
  }


  /* ========================= UPDATE ========================= */

  const updateProyecto = (p: Proyecto) => {
  const idNumerico = Number(p.id)

    setProyectos((prev) =>
      prev.map((x) =>
        x.id === idNumerico
          ? { ...x, ...p, id: idNumerico }
          : x
      )
    )
  }


  /* ========================= DELETE ========================= */

  const deleteProyecto = (id: number) => {
    setProyectos((prev) =>
      prev.filter((p) => p.id !== id)
    )
  }

  /* ========================= PROVIDER ========================= */

  return (
    <ProyectosContext.Provider
      value={{
        proyectos,
        addProyecto,
        updateProyecto,
        deleteProyecto
      }}
    >
      {children}
    </ProyectosContext.Provider>
  )
}

/* ========================= HOOK ========================= */

export const useProyectos = () => {
  const ctx = useContext(ProyectosContext)
  if (!ctx) {
    throw new Error(
      'useProyectos debe usarse dentro del ProyectosProvider'
    )
  }
  return ctx
}
