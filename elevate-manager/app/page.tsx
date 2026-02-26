'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [doorsClosed, setDoorsClosed] = useState(true)
  const [moving, setMoving] = useState(false)
  const [floor, setFloor] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDoorsClosed(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async () => {
    if (moving) return
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Error de autenticación')
      return
    }

    setMoving(true)
    setDoorsClosed(true)

    let current = 1
    const interval = setInterval(() => {
      current++
      setFloor(current)
      if (current === 3) clearInterval(interval)
    }, 300)

    setTimeout(() => {
      router.push('/dashboard')
    }, 900)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-tech flex items-center justify-center">
      {/* PUERTAS */}
      <div className={`door left ${doorsClosed ? 'close' : ''}`} />
      <div className={`door right ${doorsClosed ? 'close' : ''}`} />

      {/* PANEL LOGIN */}
      <div
        className={`relative z-10 w-full max-w-md p-8 rounded-2xl
          bg-black/80 border border-cyan-500/30
          shadow-[0_0_40px_rgba(34,211,238,0.25)]
          backdrop-blur-xl transition-all duration-700
          ${moving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {/* INDICADOR DE PISO */}
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 border border-cyan-400 text-cyan-300 font-mono tracking-widest rounded">
            FLOOR {floor}
          </span>
        </div>

        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-widest">
            ELEVATOR
          </h1>
          <p className="text-xs text-cyan-300 tracking-[0.3em]">
            MANAGEMENT SYSTEM
          </p>
        </div>

        {/* INPUTS */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="USER ID (EMAIL)"
            className="tech-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="ACCESS CODE"
            className="tech-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 text-xs text-red-400">
            ● {error}
          </div>
        )}

        {/* STATUS */}
        {!error && (
          <div className="mt-4 text-xs text-cyan-400 animate-pulse">
            ● SYSTEM READY
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={moving}
          className="mt-6 w-full py-2 rounded-md font-semibold tracking-widest
          bg-cyan-500/10 border border-cyan-500 text-cyan-300
          hover:bg-cyan-500/20 transition disabled:opacity-50"
        >
          {moving ? 'ASCENDING...' : 'ENGAGE'}
        </button>
      </div>
    </main>
  )
}




