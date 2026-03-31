'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ProyectosProvider }  from './contexts/ProyectosContext'
import { ProveedoresProvider } from './contexts/ProveedoresContext'
import { ClientesProvider }   from './contexts/ClientesContext'

import '../globals.css'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type DoorState = 'close' | 'open' | 'idle'

interface NavItem {
  label: string
  href: string
  icon: string
  group: string
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: 'Principal',      href: '/dashboard/principal',            icon: '⬡', group: 'CORE' },
  { label: 'Proyectos',      href: '/dashboard/proyectos',            icon: '◧', group: 'CORE' },
  { label: 'Calendario',     href: '/dashboard/proyectos/calendario', icon: '▦', group: 'CORE' },
  { label: 'Cotizaciones',   href: '/dashboard/cotizaciones',         icon: '◈', group: 'COMERCIAL' },
  { label: 'Contratos',      href: '/dashboard/contratos',            icon: '◫', group: 'COMERCIAL' },
  { label: 'Clientes',       href: '/dashboard/clientes',             icon: '◉', group: 'COMERCIAL' },
  { label: 'Proveedores',    href: '/dashboard/proveedores',          icon: '⬡', group: 'OPERACIONES' },
  { label: 'Elevadores',     href: '/dashboard/elevadores',           icon: '▲', group: 'OPERACIONES' },
  { label: 'Mantenimientos', href: '/dashboard/mantenimientos',       icon: '⚙', group: 'OPERACIONES' },
  { label: 'Técnicos',       href: '/dashboard/tecnico',              icon: '◎', group: 'PERSONAL' },
  { label: 'Gestion Técnicos',       href: '/dashboard/tecnico/gestor',       icon: '◎', group: 'PERSONAL' },
  { label: 'Monitoreo',      href: '/dashboard/monitoreo',            icon: '◈', group: 'SISTEMA' },
]

const NAV_GROUPS = ['CORE', 'COMERCIAL', 'OPERACIONES', 'PERSONAL', 'SISTEMA']

// ─── LOGO SVG ─────────────────────────────────────────────────────────────────
function ElevatorLogo() {
  return (
    <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="38" rx="2" stroke="rgba(0,200,255,0.4)" strokeWidth="1" />
      <line x1="18" y1="1" x2="18" y2="39" stroke="rgba(0,200,255,0.15)" strokeWidth="1" />
      <rect x="6" y="14" width="24" height="12" rx="1" fill="rgba(0,200,255,0.12)" stroke="#00c8ff" strokeWidth="1.2" />
      <line x1="18" y1="14" x2="18" y2="26" stroke="#00c8ff" strokeWidth="0.8" opacity="0.6" />
      <polyline points="13,8 18,3 23,8"    stroke="#00ffa3"               strokeWidth="1.5" fill="none" />
      <polyline points="13,32 18,37 23,32" stroke="rgba(0,200,255,0.4)"  strokeWidth="1.2" fill="none" />
    </svg>
  )
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [doorState,   setDoorState]   = useState<DoorState>('close')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeHref,  setActiveHref]  = useState('')
  const [floor,       setFloor]       = useState(1)

  // Detect current route for active nav highlight
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveHref(window.location.pathname)
    }
  }, [])

  // Open doors on first mount, then remove them from DOM after animation
  useEffect(() => {
    const t1 = setTimeout(() => setDoorState('open'), 200)
    const t2 = setTimeout(() => setDoorState('idle'), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Navigate without door animation
  const navigate = (href: string) => {
    setActiveHref(href)
    setSidebarOpen(false)
    setFloor(f => (f % 30) + 1)
    router.push(href)
  }

  // Logout with closing door animation
  const handleLogout = () => {
    setDoorState('close')
    setTimeout(() => router.push('/'), 1200)
  }

  const formattedDate = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()

  return (
    <ProyectosProvider>
      <ProveedoresProvider>
        <ClientesProvider>

          <div className="dashboard-wrapper bg-grid">

            {/* ── Shaft Lines (decorative) ── */}
            {/* <div className="shaft-line" />
            <div className="shaft-line" />
            <div className="shaft-line" />
            <div className="shaft-line" /> */}

            {/* ── Elevator Doors ── */}
            {doorState !== 'idle' && (
              <>
                <div className={`door left ${doorState}`}>
                  <span className="door-content">ELEVATE SOFT</span>
                </div>
                <div className={`door right ${doorState}`}>
                  <span className="door-content">ELEVATE SOFT</span>
                </div>
              </>
            )}

            {/* ── Mobile Overlay ── */}
            {sidebarOpen && (
              <div className="overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ════════════════════════════════ SIDEBAR ════════════════════════════════ */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

              {/* Logo */}
              <div className="logo-block">
                <div className="corner-deco tl" />
                <div className="corner-deco tr" />
                <div className="logo-inner">
                  <ElevatorLogo />
                  <div>
                    <div className="logo-name">ELEVATE SOFT</div>
                    <div className="logo-sub">Elevator Management System</div>
                  </div>
                </div>
              </div>

              {/* System status */}
              <div className="status-badge">
                <div className="status-dot" />
                SYS ONLINE — v3.2.1
              </div>

              {/* Navigation */}
              <nav className="nav-scroll">
                {NAV_GROUPS.map(group => {
                  const items = NAV_ITEMS.filter(n => n.group === group)
                  if (!items.length) return null
                  return (
                    <div key={group} className="nav-group">
                      <div className="nav-group-label">{group}</div>
                      {items.map(item => (
                        <button
                          key={item.href}
                          className={`nav-item ${activeHref === item.href ? 'active' : ''}`}
                          onClick={() => navigate(item.href)}
                        >
                          <span className="nav-icon">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </nav>

              {/* Logout */}
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M5 1H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3M9 9l3-3-3-3M12 6.5H5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Cerrar Sesión
              </button>
            </aside>

            {/* ════════════════════════════════ MAIN ════════════════════════════════ */}
            <div className="main-content">

              {/* Topbar */}
              <header className="topbar">
                <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>

                <span className="topbar-title">ELEVATE SOFT</span>

                <div className="topbar-spacer" />

                {/* Floor indicator */}
                <div className="floor-display">
                  <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                    <rect x="1" y="1" width="12" height="16" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    <rect x="4" y="6" width="6"  height="6"  rx="0.5" stroke="#00c8ff" strokeWidth="1" />
                  </svg>
                  PISO
                  <span key={floor} className="floor-num">
                    {String(floor).padStart(2, '0')}
                  </span>
                </div>

                {/* Date */}
                <span className="topbar-date">{formattedDate}</span>

                {/* Notifications */}
                <div className="notif-wrap">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2a6 6 0 0 1 6 6c0 3.5 1.5 5 1.5 5H2.5S4 11.5 4 8a6 6 0 0 1 6-6ZM8.5 15a1.5 1.5 0 0 0 3 0"
                      stroke="rgba(0,200,255,0.45)"
                      strokeWidth="1.2"
                    />
                  </svg>
                  <span className="notif-dot" />
                </div>
              </header>

              {/* Page Content */}
              <div className="content-area">
                <div className="corner-deco tl" />
                <div className="corner-deco tr" />
                <div className="corner-deco bl" />
                <div className="corner-deco br" />
                {children}
              </div>

            </div>
          </div>

        </ClientesProvider>
      </ProveedoresProvider>
    </ProyectosProvider>
  )
}