"use client"

import { useEffect } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// ⚠️ Fix iconos Leaflet en Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// ── Íconos personalizados ─────────────────────────────────────────────
const tecnicoIcon = L.divIcon({
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#00ffa3;border:3px solid #030508;
    box-shadow:0 0 14px rgba(0,255,163,.7);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: "",
})

const actividadIcon = (prio, done) => {
  const color = done
    ? "#00ffa3"
    : prio === 1
    ? "#ff3b5c"
    : prio === 2
    ? "#ffb020"
    : "#00c8ff"

  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:4px;
      background:${color};border:2px solid #030508;
      box-shadow:0 0 10px ${color}80;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;color:#030508;
      font-family:'Rajdhani',sans-serif;
    ">${done ? "✓" : "!"}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: "",
  })
}

// ── Auto-center ──────────────────────────────────────────────────────
function AutoCenter({ coords }) {
  const map = useMap()

  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], map.getZoom(), {
        animate: true,
      })
    }
  }, [coords, map])

  return null
}

// ── Componente principal ─────────────────────────────────────────────
export default function TecnicoMap({
  coords,
  ruta,
  actividades,
  activo,
}) {
  const center = coords
    ? [coords.lat, coords.lng]
    : actividades.length
    ? [actividades[0].lat, actividades[0].lng]
    : [23.6345, -102.5528]

  return (
    <MapContainer
      center={center}
      zoom={coords ? 15 : actividades.length ? 13 : 5}
      scrollWheelZoom
      style={{
        height: "100%",
        width: "100%",
        background: "#030508",
      }}
    >
      {/* Mapa oscuro */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; CARTO"
      />

      <AutoCenter coords={coords} />

      {/* Ruta */}
      {ruta.length > 1 && (
        <Polyline
          positions={ruta.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: "#00c8ff",
            weight: 2,
            opacity: 0.7,
            dashArray: "6,4",
          }}
        />
      )}

      {/* Técnico */}
      {coords && activo && (
        <Marker position={[coords.lat, coords.lng]} icon={tecnicoIcon}>
          <Popup>
            <div
              style={{
                fontFamily: "'Rajdhani',sans-serif",
                color: "#030508",
                fontWeight: 700,
              }}
            >
              📍 Mi posición actual
              <div
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: 10,
                  fontWeight: 400,
                  marginTop: 4,
                }}
              >
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Actividades */}
      {actividades.map((a) => (
        <Marker
          key={a.id}
          position={[a.lat, a.lng]}
          icon={actividadIcon(a.prioridad, a.llegada_confirmada)}
        >
          <Popup>
            <div
              style={{
                fontFamily: "'Rajdhani',sans-serif",
                color: "#030508",
                minWidth: 160,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                {a.titulo}
              </div>

              {a.cliente_nombre && (
                <div style={{ fontSize: 11 }}>
                  👤 {a.cliente_nombre}
                </div>
              )}

              {a.direccion && (
                <div style={{ fontSize: 11, marginTop: 2 }}>
                  📍 {a.direccion}
                </div>
              )}

              <div
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 2,
                  background: a.llegada_confirmada
                    ? "#00ffa3"
                    : "#ffb020",
                  display: "inline-block",
                  fontWeight: 700,
                }}
              >
                {a.llegada_confirmada
                  ? "✓ Llegada confirmada"
                  : "⏳ Pendiente llegada"}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}