'use client'

import { createContext, useContext, useState } from 'react'

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


interface ProyectosContextType {
  proyectos: Proyecto[]
  addProyecto: (p: Proyecto) => void
  updateProyecto: (p: Proyecto) => void
  deleteProyecto: (id: number) => void
}

const ProyectosContext = createContext<ProyectosContextType | null>(null)

export function ProyectosProvider({ children }: { children: React.ReactNode }) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])

  const addProyecto = (p: Proyecto) =>
    setProyectos(prev => [...prev, p])

  const updateProyecto = (p: Proyecto) =>
    setProyectos(prev => prev.map(x => x.id === p.id ? p : x))

  const deleteProyecto = (id: number) =>
    setProyectos(prev => prev.filter(p => p.id !== id))

  return (
    <ProyectosContext.Provider value={{ proyectos, addProyecto, updateProyecto, deleteProyecto }}>
      {children}
    </ProyectosContext.Provider>
  )
}

export const useProyectos = () => {
  const ctx = useContext(ProyectosContext)
  if (!ctx) throw new Error('useProyectos debe usarse dentro del ProyectosProvider')
  return ctx
}
