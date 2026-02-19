'use client'

import { createContext, useContext, useEffect, useState } from 'react'


export interface Proyecto {
  id: number
  nombre: string
  ubicacion: string
  cliente: string
  contacto: string
  fechaInicio: string
  fechaEntrega: string
  descripcion: string
  tipo: 'Instalación' | 'Ajuste' | 'Otro'
  proveedorId?: number
  clienteId?: number
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


const ProyectosContext = createContext<ProyectosContextType | null>(null)

export function ProyectosProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])

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
          tipo: 'Instalación', // Ajusta si luego agregas campo tipo en DB
          proveedorId: p.proveedor_id ?? undefined,
          clienteId: p.cliente_final_id ?? undefined
        }))

        setProyectos(formatted)
      } catch (error) {
        console.error('Error cargando proyectos:', error)
      }
    }

    fetchProyectos()
  }, [])


  const addProyecto = (p: Proyecto) => {
    setProyectos((prev) => [...prev, p])
  }

  const updateProyecto = (p: Proyecto) => {
    setProyectos((prev) =>
      prev.map((x) => (x.id === p.id ? p : x))
    )
  }

  const deleteProyecto = (id: number) => {
    setProyectos((prev) =>
      prev.filter((p) => p.id !== id)
    )
  }

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


export const useProyectos = () => {
  const ctx = useContext(ProyectosContext)
  if (!ctx) {
    throw new Error(
      'useProyectos debe usarse dentro del ProyectosProvider'
    )
  }
  return ctx
}
