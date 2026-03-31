"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!

interface Actividad {
  id: number; titulo: string; cliente_nombre?: string; direccion?: string
  lat: number; lng: number; prioridad: 1|2|3; tipo: string
  llegada_confirmada: boolean; fecha_llegada?: string
  evidencia_url?: string; evidencia_tipo?: string
}

interface Tecnico {
  tecnico_id: number; nombre: string; lat: number; lng: number
  updated_at: string; fecha_inicio: string
  ruta: {lat:number;lng:number}[]
  actividades: Actividad[]
}

const PRIO_COLORS = { 1:'#ff3b5c', 2:'#ffb020', 3:'#00ffa3' }

export default function MonitoreoPage() {
  const mapContainer  = useRef<HTMLDivElement|null>(null)
  const mapRef        = useRef<mapboxgl.Map|null>(null)
  const markersRef    = useRef<{[id:number]: mapboxgl.Marker}>({})
  const actMarkersRef = useRef<{[key:string]: mapboxgl.Marker}>({})
  const intervalRef   = useRef<ReturnType<typeof setInterval>|null>(null)

  const [tecnicos,    setTecnicos]    = useState<Tecnico[]>([])
  const [selected,    setSelected]    = useState<Tecnico|null>(null)
  const [loading,     setLoading]     = useState(true)
  const [lastUpdate,  setLastUpdate]  = useState<Date|null>(null)

  useEffect(()=>{
    if(!mapContainer.current) return
    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-102.5528, 23.6345],
      zoom: 5,
    })
    mapRef.current = map
    map.on("load", () => {
      cargarTecnicos()
      intervalRef.current = setInterval(cargarTecnicos, 5000)
    })
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      map.remove()
    }
  },[])

  async function cargarTecnicos() {
    try {
      const res = await fetch("/api/monitoreo/tecnicos")
      if (!res.ok) return
      const data: Tecnico[] = await res.json()
      setTecnicos(data)
      setLastUpdate(new Date())
      setLoading(false)
      actualizarMapa(data)
    } catch { setLoading(false) }
  }

  function actualizarMapa(data: Tecnico[]) {
    const map = mapRef.current; if(!map) return

    // Set de IDs activos
    const activeIds = new Set(data.map(t => t.tecnico_id))

    // Eliminar técnicos que ya no están activos
    Object.keys(markersRef.current).forEach(idStr => {
      const id = Number(idStr)
      if (!activeIds.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
        // Eliminar source/layer de su ruta
        const routeId = `route-${id}`
        if (map.getLayer(routeId)) map.removeLayer(routeId)
        if (map.getSource(routeId)) map.removeSource(routeId)
      }
    })

    data.forEach(t => {
      const lngLat: [number,number] = [t.lng, t.lat]

      // ── Marcador del técnico ──
      if (markersRef.current[t.tecnico_id]) {
        markersRef.current[t.tecnico_id].setLngLat(lngLat)
      } else {
        const el = document.createElement("div")
        el.style.cssText = `
          width:20px;height:20px;border-radius:50%;
          background:#00ffa3;border:3px solid #030508;
          box-shadow:0 0 14px rgba(0,255,163,.8);
          cursor:pointer;transition:transform .2s;
        `
        el.onmouseenter = () => { el.style.transform = "scale(1.3)" }
        el.onmouseleave = () => { el.style.transform = "scale(1)" }
        el.onclick = () => setSelected(t)

        const popup = new mapboxgl.Popup({ offset:14, className:"mon-popup" })
          .setHTML(`
            <div style="font-family:'Rajdhani',sans-serif;color:#c8e8f5;min-width:160px;">
              <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${t.nombre}</div>
              <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:#5c8fa8;letter-spacing:.15em;">
                JORNADA ACTIVA<br/>
                ${t.lat.toFixed(5)}, ${t.lng.toFixed(5)}
              </div>
            </div>
          `)

        markersRef.current[t.tecnico_id] = new mapboxgl.Marker(el)
          .setLngLat(lngLat).setPopup(popup).addTo(map)
      }

      // ── Ruta del técnico ──
      const routeId = `route-${t.tecnico_id}`
      const coords = t.ruta.map(p => [p.lng, p.lat])

      if (t.ruta.length > 1) {
        const geojson: GeoJSON.Feature = {
          type: "Feature",
          geometry: { type:"LineString", coordinates: coords },
          properties: {}
        }
        if (map.getSource(routeId)) {
          (map.getSource(routeId) as mapboxgl.GeoJSONSource).setData(geojson)
        } else {
          map.addSource(routeId, { type:"geojson", data: geojson })
          map.addLayer({
            id: routeId, type:"line", source: routeId,
            layout: { "line-join":"round", "line-cap":"round" },
            paint: { "line-color":"#00c8ff", "line-width":2, "line-opacity":0.65, "line-dasharray":[3,2] },
          })
        }
      }

      // ── Marcadores de actividades ──
      t.actividades.forEach(a => {
        const key = `act-${t.tecnico_id}-${a.id}`
        const color = a.llegada_confirmada ? '#00ffa3' : PRIO_COLORS[a.prioridad]

        if (actMarkersRef.current[key]) {
          // Actualizar color si cambió estado
          const elExist = actMarkersRef.current[key].getElement()
          elExist.style.background = color
        } else {
          const el = document.createElement("div")
          el.style.cssText = `
            width:22px;height:22px;border-radius:3px;
            background:${color};border:2px solid #030508;
            box-shadow:0 0 8px ${color}80;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:700;color:#030508;cursor:pointer;
          `
          el.textContent = a.llegada_confirmada ? '✓' : String(a.prioridad)

          const popup = new mapboxgl.Popup({ offset:12, className:"mon-popup" })
            .setHTML(`
              <div style="font-family:'Rajdhani',sans-serif;color:#c8e8f5;min-width:180px;">
                <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${a.titulo}</div>
                ${a.cliente_nombre?`<div style="font-size:11px;color:#5c8fa8;">👤 ${a.cliente_nombre}</div>`:''}
                ${a.direccion?`<div style="font-size:11px;color:#5c8fa8;margin-top:2px;">📍 ${a.direccion}</div>`:''}
                <div style="margin-top:6px;font-family:'Share Tech Mono',monospace;font-size:8px;padding:2px 6px;border-radius:2px;display:inline-block;background:${a.llegada_confirmada?'rgba(0,255,163,.15)':'rgba(255,176,32,.15)'};color:${a.llegada_confirmada?'#00ffa3':'#ffb020'};">
                  ${a.llegada_confirmada?'✓ LLEGADA CONFIRMADA':'⏳ PENDIENTE'}
                </div>
              </div>
            `)

          actMarkersRef.current[key] = new mapboxgl.Marker(el)
            .setLngLat([a.lng, a.lat]).setPopup(popup).addTo(map)
        }
      })
    })
  }

  const fmt = (s:string) => new Date(s).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})

  return(
    <>
      <style>{`
        .mon-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px}
        .mon-eyebrow{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.4em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px}
        .mon-eyebrow::before{content:'';display:block;width:20px;height:1px;background:#00c8ff}
        .mon-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:30px;letter-spacing:.18em;color:var(--text,#c8e8f5);text-transform:uppercase;line-height:1}
        .mon-title span{color:#00c8ff}
        .section-divider{height:1px;background:linear-gradient(90deg,#00c8ff,transparent 60%);margin-bottom:20px;opacity:.2}
        .mon-layout{display:grid;grid-template-columns:1fr 300px;gap:14px;align-items:start}
        @media(max-width:1000px){.mon-layout{grid-template-columns:1fr}}
        .mon-panel{background:var(--surface,#0a1520);border:1px solid rgba(0,200,255,.12);border-radius:4px;padding:18px;position:relative}
        .mon-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,#00c8ff,transparent 60%);opacity:.3}
        .mon-map{height:560px;border-radius:3px;overflow:hidden;border:1px solid rgba(0,200,255,.1)}
        .mon-map-wrap{position:relative}
        .mon-status-bar{position:absolute;top:10px;left:10px;z-index:10;display:flex;align-items:center;gap:8px;padding:6px 12px;background:rgba(3,5,8,.85);border:1px solid rgba(0,200,255,.2);border-radius:3px;backdrop-filter:blur(6px)}
        .mon-status-dot{width:6px;height:6px;border-radius:50%;background:#00ffa3;box-shadow:0 0 6px #00ffa3;animation:pulse-dot 2s infinite}
        @keyframes pulse-dot{0%,100%{opacity:1;box-shadow:0 0 6px #00ffa3}50%{opacity:.4;box-shadow:0 0 2px #00ffa3}}
        .mon-status-txt{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.2em;color:#00ffa3;text-transform:uppercase}
        .mon-update{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.15em;color:var(--text2,#5c8fa8)}
        .mon-panel-title{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;letter-spacing:.2em;color:var(--text,#c8e8f5);text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .mon-panel-dot{width:5px;height:5px;border-radius:50%;background:#00c8ff;box-shadow:0 0 5px #00c8ff;flex-shrink:0}
        .tec-list{display:flex;flex-direction:column;gap:8px}
        .tec-card{padding:12px 14px;background:rgba(0,0,0,.25);border:1px solid rgba(0,200,255,.08);border-radius:3px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
        .tec-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:#00ffa3;box-shadow:0 0 5px #00ffa3}
        .tec-card:hover{border-color:rgba(0,200,255,.22);background:rgba(0,200,255,.03)}
        .tec-card.sel{border-color:rgba(0,200,255,.3);background:rgba(0,200,255,.05)}
        .tec-card-name{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;color:var(--text,#c8e8f5);margin-bottom:4px}
        .tec-card-meta{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.15em;color:var(--text2,#5c8fa8);text-transform:uppercase}
        .tec-act-list{margin-top:8px;display:flex;flex-direction:column;gap:4px}
        .tec-act-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-top:1px solid rgba(0,200,255,.04)}
        .tec-act-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .tec-act-name{font-family:'Exo 2',sans-serif;font-size:10px;color:var(--text2,#5c8fa8);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .tec-act-state{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.1em;flex-shrink:0}
        .no-tec{display:flex;flex-direction:column;align-items:center;padding:40px;gap:10px;opacity:.3}
        .no-tec span{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.3em;color:var(--text2,#5c8fa8);text-transform:uppercase}
        .mapboxgl-popup-content{background:rgba(6,14,24,.95)!important;border:1px solid rgba(0,200,255,.2)!important;border-radius:4px!important;padding:12px 14px!important;box-shadow:0 4px 20px rgba(0,0,0,.6)!important}
        .mapboxgl-popup-tip{display:none!important}
      `}</style>

      <div>
        <div className="mon-header">
          <div>
            <div className="mon-eyebrow">Tiempo Real</div>
            <div className="mon-title">MONITOREO DE <span>TÉCNICOS</span></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#00ffa3',boxShadow:'0 0 5px #00ffa3'}}/>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:'.2em',color:'#00ffa3'}}>{tecnicos.length} EN CAMPO</span>
            </div>
          </div>
        </div>
        <div className="section-divider"/>

        <div className="mon-layout">
          {/* MAPA */}
          <div className="mon-panel">
            <div className="mon-map-wrap">
              <div className="mon-status-bar">
                <div className="mon-status-dot"/>
                <span className="mon-status-txt">Live</span>
                {lastUpdate&&<span className="mon-update">· {lastUpdate.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
              </div>
              <div ref={mapContainer} className="mon-map"/>
            </div>
          </div>

          {/* PANEL LATERAL */}
          <div>
            <div className="mon-panel">
              <div className="mon-panel-title">
                <div className="mon-panel-dot"/>
                Técnicos Activos
                <span style={{marginLeft:'auto',fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'var(--text2,#5c8fa8)',letterSpacing:'.15em'}}>{tecnicos.length}</span>
              </div>
              {loading?(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'30px',gap:8,fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:'.25em',color:'var(--text2,#5c8fa8)'}}>
                  <div style={{width:12,height:12,border:'1px solid rgba(0,200,255,.2)',borderTopColor:'#00c8ff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                  CARGANDO...
                </div>
              ):tecnicos.length===0?(
                <div className="no-tec">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="12" r="7" stroke="#00c8ff" strokeWidth="1.3"/><path d="M5 34c0-7.18 5.82-13 13-13s13 5.82 13 13" stroke="#00c8ff" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  <span>Sin técnicos activos</span>
                </div>
              ):(
                <div className="tec-list">
                  {tecnicos.map(t=>(
                    <div key={t.tecnico_id} className={`tec-card ${selected?.tecnico_id===t.tecnico_id?'sel':''}`}
                      onClick={()=>{
                        setSelected(s=>s?.tecnico_id===t.tecnico_id?null:t)
                        mapRef.current?.flyTo({center:[t.lng,t.lat],zoom:14,duration:1200})
                      }}>
                      <div className="tec-card-name">{t.nombre}</div>
                      <div className="tec-card-meta">
                        DESDE {fmt(t.fecha_inicio)} · {t.actividades.length} ACTIVIDAD{t.actividades.length!==1?'ES':''}
                      </div>
                      {/* Actividades mini list */}
                      {t.actividades.length>0&&(
                        <div className="tec-act-list">
                          {t.actividades.map(a=>(
                            <div key={a.id} className="tec-act-row">
                              <div className="tec-act-dot" style={{background:a.llegada_confirmada?'#00ffa3':PRIO_COLORS[a.prioridad]}}/>
                              <span className="tec-act-name">{a.titulo}</span>
                              <span className="tec-act-state" style={{color:a.llegada_confirmada?'#00ffa3':'#5c8fa8'}}>
                                {a.llegada_confirmada?'✓':'○'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detalle técnico seleccionado */}
            {selected&&(
              <div className="mon-panel" style={{marginTop:10}}>
                <div className="mon-panel-title">
                  <div className="mon-panel-dot"/>
                  {selected.nombre}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {selected.actividades.map(a=>(
                    <div key={a.id} style={{padding:'10px 12px',background:'rgba(0,0,0,.3)',border:'1px solid rgba(0,200,255,.07)',borderRadius:3,borderLeft:`3px solid ${a.llegada_confirmada?'#00ffa3':PRIO_COLORS[a.prioridad]}`}}>
                      <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,color:'var(--text,#c8e8f5)',marginBottom:3}}>{a.titulo}</div>
                      {a.cliente_nombre&&<div style={{fontFamily:"'Exo 2',sans-serif",fontSize:10,color:'var(--text2,#5c8fa8)'}}>👤 {a.cliente_nombre}</div>}
                      {a.direccion&&<div style={{fontFamily:"'Exo 2',sans-serif",fontSize:10,color:'var(--text2,#5c8fa8)',marginTop:1}}>📍 {a.direccion}</div>}
                      {a.evidencia_url&&(
                        <div style={{marginTop:6}}>
                          {a.evidencia_tipo==='video'
                            ?<div style={{padding:'4px 8px',background:'rgba(0,200,255,.08)',border:'1px solid rgba(0,200,255,.15)',borderRadius:2,fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'#00c8ff',display:'inline-flex',alignItems:'center',gap:4}}>▶ VIDEO</div>
                            :<img src={a.evidencia_url} style={{width:60,height:60,objectFit:'cover',borderRadius:3,border:'1px solid rgba(0,200,255,.15)'}}/>
                          }
                        </div>
                      )}
                      <div style={{marginTop:5,fontFamily:"'Share Tech Mono',monospace",fontSize:7,padding:'2px 6px',borderRadius:2,display:'inline-block',background:a.llegada_confirmada?'rgba(0,255,163,.08)':'rgba(255,176,32,.08)',color:a.llegada_confirmada?'#00ffa3':'#ffb020',letterSpacing:'.15em'}}>
                        {a.llegada_confirmada?`✓ LLEGADA ${a.fecha_llegada?new Date(a.fecha_llegada).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}):''}` :'⏳ PENDIENTE'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}