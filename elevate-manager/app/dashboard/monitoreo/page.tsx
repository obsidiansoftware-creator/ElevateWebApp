"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!

export default function MonitoreoPage() {

  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const markersRef = useRef<{[key:number]: mapboxgl.Marker}>({})

  useEffect(() => {

    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-103.2899, 20.5769],
      zoom: 13
    })

    mapRef.current = map

    map.on("load", () => {

      cargarUbicaciones()

      setInterval(() => {
        cargarUbicaciones()
      }, 5000)

    })

  }, [])

  async function cargarUbicaciones() {

    const res = await fetch("/api/monitoreo/tecnicos")
    const tecnicos = await res.json()

    const map = mapRef.current

    if (!map) return

    tecnicos.forEach((t:any) => {

      const lngLat:[number,number] = [
        Number(t.lng),
        Number(t.lat)
      ]

      if (markersRef.current[t.tecnico_id]) {

        markersRef.current[t.tecnico_id].setLngLat(lngLat)

      } else {

        const el = document.createElement("div")

        el.style.width = "30px"
        el.style.height = "30px"
        el.style.borderRadius = "50%"
        el.style.background = "#2563eb"
        el.style.border = "3px solid white"
        el.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)"

        const marker = new mapboxgl.Marker(el)
          .setLngLat(lngLat)
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div style="color:black;">
                    <b>Técnico ${t.tecnico_id}</b><br/>
                    Ubicación en tiempo real
                </div>
            `)
          )
          .addTo(map)

        markersRef.current[t.tecnico_id] = marker
      }

    })

  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Monitoreo de Técnicos
      </h1>

      <div
        ref={mapContainer}
        className="w-full h-[650px] rounded-lg"
      />

    </div>
  )
}