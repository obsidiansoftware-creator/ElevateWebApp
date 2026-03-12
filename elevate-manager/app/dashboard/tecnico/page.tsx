"use client"

import { useEffect, useState, useRef } from "react"

export default function TecnicoPage() {
  const [activo, setActivo] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const iniciar = async () => {
    const res = await fetch("/api/tecnico/iniciar-jornada", {
      method: "POST"
    })

    if (!res.ok) {
      alert("Error iniciando jornada")
      return
    }

    const data = await res.json()

    if (data.ok) {
      setActivo(true)
    }
  }

  const finalizar = async () => {
    await fetch("/api/tecnico/finalizar-jornada", {
      method: "POST"
    })

    setActivo(false)

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }

  useEffect(() => {
    if (!activo) return

    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización")
      return
    }

    navigator.geolocation.watchPosition(
    async (position) => {
        await fetch("/api/tecnico/ubicacion", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude
        })
    })
        },
        (error) => {
        console.error("Error GPS:", error)
        },
        {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000
        }
        )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [activo])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Panel Técnico</h1>

      {!activo ? (
        <button
          onClick={iniciar}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Iniciar Jornada
        </button>
      ) : (
        <button
          onClick={finalizar}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Finalizar Jornada
        </button>
      )}
    </div>
  )
}