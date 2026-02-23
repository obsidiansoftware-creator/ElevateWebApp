'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ServicioCliente = 'Instalación' | 'Ajuste'

export interface Cliente {
  id: number
  razon_social: string
  nombre_contacto?: string
  tipo_cliente?: 'empresa' | 'persona_fisica'
  telefono?: string
  telefono_secundario?: string
  email?: string
  email_facturacion?: string
  direccion?: string
  rfc?: string
  estatus?: 'activo' | 'inactivo' | 'suspendido'
  notas?: string
}

interface ClientesContextType {
  clientes: Cliente[]
  addCliente: (c: Cliente) => void
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>
}

const ClientesContext = createContext<ClientesContextType | null>(null)

export function ClientesProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([])

  // 🔹 Cargar clientes del usuario logueado
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch('/api/clientes')
        const data = await res.json()

        if (data.success) {
          setClientes(data.data)
        }
      } catch (error) {
        console.error('Error cargando clientes:', error)
      }
    }

    fetchClientes()
  }, [])

  const addCliente = (cliente: Cliente) => {
    setClientes(prev => [...prev, cliente])
  }

  return (
    <ClientesContext.Provider value={{ clientes, addCliente, setClientes }}>
      {children}
    </ClientesContext.Provider>
  )
}

export function useCliente() {
  const ctx = useContext(ClientesContext)
  if (!ctx) {
    throw new Error('useCliente debe usarse dentro de ClientesProvider')
  }
  return ctx
}
