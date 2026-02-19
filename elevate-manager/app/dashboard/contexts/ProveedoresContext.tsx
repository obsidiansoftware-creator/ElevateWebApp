'use client'

import { createContext, useContext,  useEffect, useState } from 'react'

export type ServicioProveedor = 'Instalación' | 'Ajuste'

export interface Proveedor {
  id: number
  razon_social: string
  nombre_contacto?: string
  telefono?: string
  telefono_secundario?: string
  email?: string
  email_facturacion?: string
  direccion?: string
  rfc?: string
  tipo_proveedor?: ServicioProveedor[]
  banco?: string
  cuenta_bancaria?: string
  clabe?: string
  estatus: 'activo' | 'inactivo' | 'suspendido'
  notas?: string
  created_by: number
  updated_by?: number
  created_at: string
  updated_at?: string
  deleted_at?: string | null
}

interface ProveedoresContextType {
  proveedores: Proveedor[]
  addProveedor: (p: Proveedor) => void
  updateProveedor: (id: number, data: Partial<Proveedor>) => void
}

const ProveedoresContext = createContext<ProveedoresContextType | null>(null)

export function ProveedoresProvider({ children }: { children: React.ReactNode }) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  useEffect(() => {
    const fetchProveedores = async () => {
      const res = await fetch('/api/proveedores')
      const data = await res.json()

      if (data.success) {
        setProveedores(data.data)
      }
    }

    fetchProveedores()
  }, [])


  const addProveedor = (proveedor: Proveedor) => {
    setProveedores(prev => [...prev, proveedor])
  }

  const updateProveedor = (id: number, data: Partial<Proveedor>) => {
    setProveedores(prev =>
      prev.map(p => (p.id === id ? { ...p, ...data } : p))
    )
  }

  return (
    <ProveedoresContext.Provider value={{ proveedores, addProveedor, updateProveedor }}>
      {children}
    </ProveedoresContext.Provider>
  )
}

export function useProveedores() {
  const ctx = useContext(ProveedoresContext)
  if (!ctx) {
    throw new Error('useProveedores debe usarse dentro de ProveedoresProvider')
  }
  return ctx
}
