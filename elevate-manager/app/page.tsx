'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import '../app/css/login/login.css'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [moving, setMoving]     = useState(false)
  const [floor, setFloor]       = useState(1)
  const [doorState, setDoorState] = useState<'close' | 'open' | 'idle'>('close')
  const [panelVisible, setPanelVisible] = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Entry: open doors, then reveal panel
  useEffect(() => {
    const t1 = setTimeout(() => setDoorState('open'), 300)
    const t2 = setTimeout(() => { setDoorState('idle'); setPanelVisible(true) }, 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleLogin = async () => {
    if (moving) return
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Error de autenticación')
      return
    }

    setMoving(true)
    let current = 1
    intervalRef.current = setInterval(() => {
      current++
      setFloor(current)
      if (current >= 8) {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, 120)

    setTimeout(() => setDoorState('close'), 800)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <>
      <main className="login-page">

        {/* ── ELEVATOR DOORS ── */}
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

        {/* ══════════════════ SHAFT COLUMN ══════════════════ */}
        <div className="shaft-column">
          <div className="shaft-rail r1" />
          <div className="shaft-rail r2" />
          <div className="shaft-rail r3" />
          <div className="shaft-rail r4" />

          <div className="shaft-beam" />

          {/* Top branding */}
          <div className="shaft-top">
            <svg width="32" height="36" viewBox="0 0 36 40" fill="none">
              <rect x="1" y="1" width="34" height="38" rx="2" stroke="rgba(0,200,255,0.35)" strokeWidth="1"/>
              <line x1="18" y1="1" x2="18" y2="39" stroke="rgba(0,200,255,0.12)" strokeWidth="1"/>
              <rect x="6" y="14" width="24" height="12" rx="1" fill="rgba(0,200,255,0.08)" stroke="#00c8ff" strokeWidth="1.2"/>
              <line x1="18" y1="14" x2="18" y2="26" stroke="#00c8ff" strokeWidth="0.8" opacity="0.5"/>
              <polyline points="13,8 18,3 23,8"    stroke="#00ffa3"             strokeWidth="1.5" fill="none"/>
              <polyline points="13,32 18,37 23,32" stroke="rgba(0,200,255,0.4)" strokeWidth="1.2" fill="none"/>
            </svg>
            <span className="shaft-top-label">Shaft Monitor</span>
          </div>

          {/* Moving cabin */}
          <div className="shaft-cabin">
            <div className="cabin-cable" />
            <div className="cabin-body">
              <div className="cabin-glow" />
            </div>
          </div>

          {/* Floor markers */}
          <div className="floor-markers">
            {[8,7,6,5,4,3,2,1].map(f => (
              <div key={f} className={`floor-marker ${floor === f ? 'active' : ''}`}>
                <div className="floor-marker-line" />
                {String(f).padStart(2,'0')}
              </div>
            ))}
          </div>

          {/* Bottom brand */}
          <div className="shaft-brand">
            <div className="shaft-brand-name">Elevate Soft</div>
            <div className="shaft-brand-sub">v3.2.1 — 2025</div>
          </div>
        </div>

        {/* ══════════════════ LOGIN SIDE ══════════════════ */}
        <div className="login-side">
          <div className={`login-panel ${panelVisible ? 'visible' : 'hidden'}`}>
            <div className="panel-inner">
              <div className="panel-corner tl" />
              <div className="panel-corner tr" />
              <div className="panel-corner bl" />
              <div className="panel-corner br" />

              {moving && <div className="panel-moving-overlay" />}

              {/* Floor indicator */}
              <div className="floor-indicator">
                <div className="floor-indicator-line" />
                <div className="floor-badge">
                  <span className="floor-badge-label">Piso</span>
                  <span className={`floor-badge-num ${moving ? 'changing' : ''}`}>
                    {String(floor).padStart(2, '0')}
                  </span>
                </div>
                <div className="floor-indicator-line right" />
              </div>

              {/* Header */}
              <div className="login-header">
                <div className="login-eyebrow">Sistema de Acceso</div>
                <div className="login-title">
                  ELEVATE<span>.</span>
                </div>
                <div className="login-subtitle">Elevator Management System</div>
              </div>

              {/* Form */}
              <div className="login-form">
                {/* Email */}
                <div className={`field-wrap ${focused === 'email' ? 'focused' : ''}`}>
                  <label className="field-label">Identificador de usuario</label>
                  <span className="field-icon">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com"
                    className="field-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                  />
                  <div className="field-border-bottom" />
                </div>

                {/* Password */}
                <div className={`field-wrap ${focused === 'password' ? 'focused' : ''}`}>
                  <label className="field-label">Código de acceso</label>
                  <span className="field-icon">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2.5" y="6" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="field-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    onKeyDown={handleKeyDown}
                    autoComplete="current-password"
                  />
                  <div className="field-border-bottom" />
                </div>
              </div>

              {/* Status line */}
              <div className={`status-line ${error ? 'error' : moving ? 'moving' : 'ready'}`}>
                <div className="status-dot" />
                {error
                  ? error
                  : moving
                  ? `ASCENDIENDO AL PISO ${String(floor).padStart(2,'0')}...`
                  : 'SISTEMA LISTO — AUTENTICACIÓN REQUERIDA'
                }
              </div>

              <div className="form-divider" />

              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={moving}
                className={`login-btn ${moving ? 'ascending' : ''}`}
              >
                {moving ? `ASCENDIENDO` : 'INICIAR SESIÓN'}
              </button>

              {/* Sys info footer */}
              <div className="sys-info">
                <span className="sys-info-item">ELV-SYS v3.2.1</span>
                <span className="sys-info-item">SECURE CHANNEL</span>
                <span className="sys-info-item">MX-NODE-01</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </>
  )
}