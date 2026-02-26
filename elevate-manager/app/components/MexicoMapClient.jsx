  "use client"
  
  import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet"
  import { useEffect, useState } from "react"
  import L from "leaflet"

  const redIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [32, 32]
  })

  export default function MexicoMapClient() {
    const [geoData, setGeoData] = useState(null)
    const [projects, setProjects] = useState([])

    useEffect(() => {
      fetch("/api/proyectos", {
        cache: "no-store",
        credentials: "include" // 🔥 IMPORTANTE si usas JWT en cookies
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setProjects(data.data)
          } else {
            setProjects([])
          }
        })
        .catch(err => console.error(err))
    }, [])


    return (
      <MapContainer
        center={[23.6345, -102.5528]}
        zoom={5}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {projects.map((project) =>
          project.lat && project.lng ? (
            <Marker
              key={project.id}
              position={[project.lat, project.lng]}
              icon={redIcon}
            >
              <Popup>
                <strong>{project.nombre}</strong>
                <br />
                {project.direccion_obra}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    )
  }
