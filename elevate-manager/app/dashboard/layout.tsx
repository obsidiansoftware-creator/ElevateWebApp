'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// ✅ CONTEXT PROVIDERS
import { ProyectosProvider } from './contexts/ProyectosContext'
import { ProveedoresProvider } from './contexts/ProveedoresContext'
import { ClientesProvider } from './contexts/ClientesContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const [doorsClosed, setDoorsClosed] = useState(true)
  const [shouldAnimateDoors, setShouldAnimateDoors] = useState(true)

  // 🔹 ABRIR PUERTAS SOLO CUANDO SE PIDA (login / logout)
  useEffect(() => {
    if (!shouldAnimateDoors) return

    const timer = setTimeout(() => {
      setDoorsClosed(false)
      setShouldAnimateDoors(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [shouldAnimateDoors])

  // 🔹 NAVEGACIÓN NORMAL (SIN PUERTAS)
  const navigate = (href: string) => {
    router.push(href)
  }

  // 🔹 LOGOUT (CON PUERTAS)
  const handleLogout = () => {
    setDoorsClosed(true)

    setTimeout(() => {
      router.push('/')
      setShouldAnimateDoors(true)
    }, 1200)
  }

  return (
    <ProyectosProvider>
      <ProveedoresProvider>
         <ClientesProvider>
        <div className="relative flex min-h-screen bg-tech text-cyan-100 overflow-hidden">

          {/* PUERTAS */}
          <div className={`door left ${doorsClosed ? 'close' : ''}`} />
          <div className={`door right ${doorsClosed ? 'close' : ''}`} />

          {/* SIDEBAR */}
          <aside className="w-64 bg-black/80 border-r border-cyan-500/30 p-6 backdrop-blur-xl z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-widest text-cyan-400">
                ELEVATOR
                <span className="block text-xs tracking-[0.3em] text-cyan-300">
                  MANAGER
                </span>
              </h2>

              <button
                onClick={handleLogout}
                className="text-cyan-400 hover:text-red-400 transition text-lg"
                title="Cerrar sesión"
              >
                ⎋
              </button>
            </div>

            <nav className="space-y-3 text-sm">
              <button
                onClick={() => navigate('/dashboard/proyectos')}
                className="nav-btn"
              >
                ▸ Proyectos
              </button>

              <button
                onClick={() => navigate('/dashboard/proyectos/calendario')}
                className="nav-btn"
              >
                ▸ Calendario
              </button>

              <button
                onClick={() => navigate('/dashboard/proveedores')}
                className="nav-btn"
              >
                ▸ Provedores
              </button>

              <button
                onClick={() => navigate('/dashboard/clientes')}
                className="nav-btn"
              >
                ▸ Clientes
              </button>

              <button
                onClick={() => navigate('/dashboard/elevadores')}
                className="nav-btn"
              >
                ▸ Elevadores
              </button>

              <button
                onClick={() => navigate('/dashboard/mantenimientos')}
                className="nav-btn"
              >
                ▸ Mantenimientos
              </button>
            </nav>
          </aside>

          {/* CONTENIDO */}
          <main className="flex-1 p-8 relative z-10">
            <h1 className="text-3xl font-bold mb-6 tracking-widest text-cyan-400">
              PANEL DE ADMINISTRACIÓN
            </h1>

            <section className="bg-black/70 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-xl">
              {children}
            </section>
          </main>
        </div>
        </ClientesProvider>
      </ProveedoresProvider>
    </ProyectosProvider>
  )
}
