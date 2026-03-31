"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"

const MapWithNoSSR = dynamic(() => import("../../components/TecnicoMap"), { ssr: false })

interface JornadaLog { time:string; msg:string; type:"ok"|"info"|"warn"|"err" }
interface Actividad {
  id:number; titulo:string; descripcion?:string
  lat:number; lng:number; direccion?:string; cliente_nombre?:string
  prioridad:1|2|3; tipo:string; llegada_confirmada:boolean; visita_id?:number
  evidencias?:{url:string;tipo:string;nota?:string}[]
}
type GpsStatus  = "off"|"acquiring"|"active"|"error"
type FaceStatus = "idle"|"loading"|"scanning"|"ok"|"error"

const LOG_COLORS = { ok:"#00ffa3", info:"#00c8ff", warn:"#ffb020", err:"#ff3b5c" }
const PRIO_CFG   = { 1:{color:"#ff3b5c",label:"ALTA"}, 2:{color:"#ffb020",label:"MEDIA"}, 3:{color:"#00ffa3",label:"BAJA"} }

const fmt = (d:Date) => d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
const dur = (ms:number) => {
  const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
}

export default function TecnicoPage() {
  const [activo,      setActivo]      = useState(false)
  const [coords,      setCoords]      = useState<{lat:number;lng:number}|null>(null)
  const [ruta,        setRuta]        = useState<{lat:number;lng:number}[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [startTime,   setStartTime]   = useState<Date|null>(null)
  const [elapsed,     setElapsed]     = useState(0)
  const [logs,        setLogs]        = useState<JornadaLog[]>([])
  const [gpsStatus,   setGpsStatus]   = useState<GpsStatus>("off")
  const [updateCount, setUpdateCount] = useState(0)
  const [faceStatus,  setFaceStatus]  = useState<FaceStatus>("idle")
  const [faceError,   setFaceError]   = useState("")
  const [activeTab,   setActiveTab]   = useState<"mapa"|"actividades"|"log">("mapa")
  const [uploadingId, setUploadingId] = useState<number|null>(null)
  const [uploadNote,  setUploadNote]  = useState("")

  const watchIdRef = useRef<number|null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval>|null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  useEffect(() => { logsEndRef.current?.scrollIntoView({behavior:'smooth'}) },[logs])
  useEffect(() => {
    if (activo) timerRef.current = setInterval(()=>setElapsed(p=>p+1000),1000)
    else if(timerRef.current) clearInterval(timerRef.current)
    return ()=>{if(timerRef.current)clearInterval(timerRef.current)}
  },[activo])

  const addLog = useCallback((msg:string,type:JornadaLog["type"]="info")=>{
    setLogs(p=>[...p.slice(-49),{time:fmt(new Date()),msg,type}])
  },[])

  const capturarFace = async ():Promise<number[]|null> => {
    setFaceStatus("loading"); setFaceError("")
    try {
      const faceapi = await import("@vladmandic/face-api")
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models")
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models")
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}})
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play()}
      setFaceStatus("scanning"); addLog("Escaneando rostro...","info")
      const deadline = Date.now()+10000; let det=null
      while(!det && Date.now()<deadline){
        await new Promise(r=>setTimeout(r,300))
        if(!videoRef.current) break
        det = await faceapi.detectSingleFace(videoRef.current,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true).withFaceDescriptor()
      }
      stream.getTracks().forEach(t=>t.stop())
      if(videoRef.current) videoRef.current.srcObject=null
      if(!det){setFaceStatus("error");setFaceError("No se detectó ningún rostro. Posiciónate frente a la cámara.");addLog("Face ID: sin rostro","err");return null}
      setFaceStatus("ok"); addLog("Face ID verificado","ok")
      return Array.from(det.descriptor)
    } catch(e:any){
      setFaceStatus("error"); setFaceError(e?.message||"Error de cámara"); addLog("Face ID: error","err"); return null
    }
  }

  const iniciar = async () => {
    setFaceError("")
    const descriptor = await capturarFace()
    if(!descriptor) return
    addLog("Conectando con servidor...","info")
    const res  = await fetch("/api/tecnico/iniciar-jornada",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({faceDescriptor:descriptor})})
    const data = await res.json()
    if(!res.ok){addLog(`Error: ${data.message||data.error}`,"err");setFaceStatus("error");setFaceError(data.message||"Autenticación fallida");return}
    setActivo(true);setStartTime(new Date());setElapsed(0);setUpdateCount(0);setRuta([]);setFaceStatus("idle")
    addLog("Jornada iniciada","ok")
    if(data.actividades?.length){setActividades(data.actividades);addLog(`${data.actividades.length} actividad(es) cargadas`,"info");setActiveTab("mapa")}
    else addLog("Sin actividades para hoy","warn")
    if(!navigator.geolocation){addLog("GPS no disponible","err");setGpsStatus("error");return}
    setGpsStatus("acquiring"); addLog("Adquiriendo GPS...","info")
    watchIdRef.current = navigator.geolocation.watchPosition(
      async pos=>{
        const {latitude:lat,longitude:lng}=pos.coords
        setCoords({lat,lng}); setRuta(p=>[...p,{lat,lng}]); setGpsStatus("active"); setUpdateCount(c=>c+1)
        try{
          await fetch("/api/tecnico/ubicacion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lat,lng})})
          addLog(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,"ok")
        }catch{addLog("Error al enviar ubicación","warn")}
      },
      err=>{addLog(`GPS error: ${err.message}`,"err");setGpsStatus("error")},
      {enableHighAccuracy:true,maximumAge:0,timeout:30000}
    )
  }

  const finalizar = async () => {
    await fetch("/api/tecnico/finalizar-jornada",{method:"POST"})
    setActivo(false);setGpsStatus("off");setActividades([]);setRuta([]);setCoords(null)
    addLog("Jornada finalizada","warn")
    if(watchIdRef.current!==null){navigator.geolocation.clearWatch(watchIdRef.current);watchIdRef.current=null}
  }

  const subirEvidencia = async (actividadId:number,file:File)=>{
    setUploadingId(actividadId)
    const fd=new FormData(); fd.append("file",file); fd.append("actividad_id",String(actividadId))
    if(uploadNote) fd.append("nota",uploadNote)
    try{
      const res=await fetch("/api/tecnico/evidencia",{method:"POST",body:fd}); const data=await res.json()
      if(!res.ok) throw new Error(data.error)
      addLog(`Evidencia subida — actividad #${actividadId}`,"ok")
      setActividades(p=>p.map(a=>a.id===actividadId?{...a,evidencias:[...(a.evidencias||[]),{url:data.url,tipo:file.type.startsWith("video")?"video":"foto"}]}:a))
      setUploadNote("")
    }catch(e:any){addLog(`Error evidencia: ${e.message}`,"err")}
    finally{setUploadingId(null)}
  }

  const GPS_CFG={off:{color:"#5c8fa8",label:"GPS Inactivo",pulse:false},acquiring:{color:"#ffb020",label:"Adquiriendo",pulse:true},active:{color:"#00ffa3",label:"GPS Activo",pulse:true},error:{color:"#ff3b5c",label:"Error GPS",pulse:false}}
  const gpsCfg=GPS_CFG[gpsStatus]
  const pendientes=actividades.filter(a=>!a.llegada_confirmada).length
  const completas=actividades.filter(a=>a.llegada_confirmada).length

  return(<>
    <style>{`
      .tec-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px}
      .tec-eyebrow{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.4em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px}
      .tec-eyebrow::before{content:'';display:block;width:20px;height:1px;background:#00ffa3}
      .tec-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:30px;letter-spacing:.18em;color:var(--text,#c8e8f5);text-transform:uppercase;line-height:1}
      .tec-title span{color:#00ffa3}
      .section-divider{height:1px;background:linear-gradient(90deg,#00ffa3,transparent 60%);margin-bottom:24px;opacity:.2}
      .tec-layout{display:grid;grid-template-columns:320px 1fr;gap:14px;align-items:start}
      @media(max-width:960px){.tec-layout{grid-template-columns:1fr}}
      .tec-panel{background:var(--surface,#0a1520);border:1px solid rgba(0,200,255,.12);border-radius:4px;padding:20px;position:relative}
      .tec-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,#00ffa3,transparent 60%);opacity:.3}
      .tec-panel-title{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;letter-spacing:.2em;color:var(--text,#c8e8f5);text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:8px}
      .tec-panel-dot{width:5px;height:5px;border-radius:50%;background:#00ffa3;box-shadow:0 0 5px #00ffa3;flex-shrink:0}
      .jornada-status{display:flex;flex-direction:column;align-items:center;gap:11px;padding:16px 0 8px}
      .jornada-clock{font-family:'Share Tech Mono',monospace;font-size:36px;letter-spacing:.05em;line-height:1}
      .jornada-clock.activo{color:#00ffa3;text-shadow:0 0 20px rgba(0,255,163,.25)}
      .jornada-clock.inactivo{color:var(--text2,#5c8fa8)}
      .jornada-label{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.25em;color:var(--text2,#5c8fa8);text-transform:uppercase;text-align:center}
      .face-video-wrap{width:100%;aspect-ratio:4/3;border-radius:3px;overflow:hidden;border:1px solid #ffb020;background:#000;position:relative;display:none}
      .face-video-wrap.vis{display:block}
      .face-video-wrap video{width:100%;height:100%;object-fit:cover}
      .face-scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ffb020,transparent);animation:scan-line 1.8s linear infinite}
      @keyframes scan-line{from{top:0}to{top:100%}}
      .face-bar{width:100%;padding:9px 12px;border-radius:3px;border:1px solid rgba(0,200,255,.1);background:rgba(0,0,0,.2);display:flex;align-items:center;gap:8px}
      .face-bar.scanning{border-color:#ffb020;background:rgba(255,176,32,.06)}
      .face-bar.ok{border-color:#00ffa3;background:rgba(0,255,163,.06)}
      .face-bar.error{border-color:#ff3b5c;background:rgba(255,59,92,.06)}
      .face-lbl{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.15em;text-transform:uppercase;flex:1}
      .face-err{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.08em;color:#ff3b5c;text-align:center;padding:2px 0;line-height:1.4}
      .gps-bar{width:100%;display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,.25);border:1px solid rgba(0,200,255,.07);border-radius:3px}
      .gps-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
      @keyframes gps-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
      .gps-dot.pulse{animation:gps-pulse 1.2s infinite}
      .gps-lbl{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase}
      .gps-coords{font-family:'Share Tech Mono',monospace;font-size:8px;color:var(--text2,#5c8fa8);margin-left:auto}
      .jornada-btn{width:100%;padding:12px;border-radius:3px;border:1px solid transparent;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;letter-spacing:.25em;text-transform:uppercase;cursor:pointer;position:relative;overflow:hidden;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:9px;background:transparent}
      .jornada-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);transform:translateX(-100%);transition:transform .5s}
      .jornada-btn:hover::before{transform:translateX(100%)}
      .jornada-btn.iniciar{border-color:rgba(0,255,163,.4);color:#00ffa3}
      .jornada-btn.iniciar:hover{border-color:#00ffa3;box-shadow:0 0 24px rgba(0,255,163,.2)}
      .jornada-btn.finalizar{border-color:rgba(255,59,92,.4);color:#ff3b5c}
      .jornada-btn.finalizar:hover{border-color:#ff3b5c;box-shadow:0 0 20px rgba(255,59,92,.15)}
      .jornada-btn:disabled{opacity:.5;cursor:not-allowed}
      .tec-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
      .tec-stat{padding:9px 11px;background:rgba(0,0,0,.25);border:1px solid rgba(0,200,255,.06);border-radius:3px}
      .tec-stat-val{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:19px;line-height:1}
      .tec-stat-key{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.18em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-top:2px}
      .tec-tabs{display:flex;border-bottom:1px solid rgba(0,200,255,.1);margin-bottom:14px}
      .tec-tab{padding:8px 14px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--text2,#5c8fa8);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .18s;position:relative;top:1px}
      .tec-tab.active{color:#00ffa3;border-bottom-color:#00ffa3}
      .tab-badge{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;font-size:8px;margin-left:4px;font-family:'Rajdhani',sans-serif;font-weight:700}
      .tec-map-wrap{height:460px;border-radius:3px;overflow:hidden;border:1px solid rgba(0,200,255,.1)}
      .act-list{display:flex;flex-direction:column;gap:8px;max-height:460px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(0,200,255,.12) transparent}
      .act-item{background:rgba(0,0,0,.25);border:1px solid rgba(0,200,255,.08);border-radius:3px;padding:13px;position:relative;overflow:hidden;transition:border-color .2s}
      .act-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--pc,#00c8ff)}
      .act-item.done{border-color:rgba(0,255,163,.15)}
      .act-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px}
      .act-titulo{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;color:var(--text,#c8e8f5)}
      .act-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:2px;border:1px solid currentColor;font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:.12em;white-space:nowrap}
      .act-field{font-family:'Exo 2',sans-serif;font-size:11px;color:var(--text2,#5c8fa8);margin-bottom:2px}
      .act-check{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.12em;margin-top:7px}
      .ev-section{margin-top:9px;padding-top:9px;border-top:1px solid rgba(0,200,255,.06)}
      .ev-lbl{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.25em;color:var(--text2,#5c8fa8);text-transform:uppercase;margin-bottom:6px}
      .ev-thumbs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px}
      .ev-thumb{width:54px;height:54px;border-radius:3px;overflow:hidden;border:1px solid rgba(0,200,255,.15);cursor:pointer}
      .ev-thumb img{width:100%;height:100%;object-fit:cover}
      .ev-thumb.vid{display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);color:#00c8ff;font-size:16px}
      .ev-row{display:flex;gap:6px;align-items:center}
      .ev-note{flex:1;background:rgba(0,200,255,.03);border:1px solid rgba(0,200,255,.1);border-radius:3px;padding:6px 10px;color:var(--text,#c8e8f5);font-family:'Exo 2',sans-serif;font-size:11px;outline:none}
      .ev-note::placeholder{color:rgba(0,200,255,.15)}
      .ev-btn{display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:3px;border:1px solid rgba(0,200,255,.22);color:#00c8ff;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:11px;letter-spacing:.13em;text-transform:uppercase;background:transparent;cursor:pointer;white-space:nowrap;transition:all .18s}
      .ev-btn:hover{border-color:#00c8ff;box-shadow:0 0 8px rgba(0,200,255,.1)}
      .ev-btn:disabled{opacity:.5;cursor:not-allowed}
      .tec-log{height:420px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(0,200,255,.1) transparent;display:flex;flex-direction:column}
      .log-item{display:flex;gap:9px;padding:5px 0;border-bottom:1px solid rgba(0,200,255,.04)}
      .log-item:last-child{border-bottom:none}
      .log-time{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--text2,#5c8fa8);flex-shrink:0;min-width:58px}
      .log-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:2px}
      .log-msg{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.03em;line-height:1.4}
      @keyframes spin{to{transform:rotate(360deg)}}
      .tec-spinner{width:12px;height:12px;border:1px solid rgba(0,255,163,.18);border-top-color:#00ffa3;border-radius:50%;animation:spin .7s linear infinite}
    `}</style>

    <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime" style={{display:'none'}}
      onChange={e=>{const f=e.target.files?.[0];if(f&&uploadingId!==null)subirEvidencia(uploadingId,f);e.target.value=""}}/>

    <div>
      <div className="tec-header">
        <div>
          <div className="tec-eyebrow">Módulo de campo</div>
          <div className="tec-title">PANEL <span>TÉCNICO</span></div>
        </div>
      </div>
      <div className="section-divider"/>

      <div className="tec-layout">
        {/* ── PANEL IZQUIERDO ── */}
        <div>
          <div className="tec-panel" style={{marginBottom:12}}>
            <div className="tec-panel-title"><div className="tec-panel-dot"/>Control de Jornada</div>
            <div className="jornada-status">
              <div className={`jornada-clock ${activo?'activo':'inactivo'}`}>{activo?dur(elapsed):'00:00:00'}</div>
              <div className="jornada-label">{activo?`ACTIVA — INICIO ${startTime?fmt(startTime):''}`:'JORNADA NO INICIADA'}</div>

              {/* Video face scan */}
              <div className={`face-video-wrap ${faceStatus==='scanning'?'vis':''}`} style={{width:'100%'}}>
                <video ref={videoRef} muted playsInline autoPlay/>
                <div className="face-scan-line"/>
              </div>

              {/* Face bar */}
              <div className={`face-bar ${faceStatus!=='idle'?faceStatus:''}`} style={{width:'100%'}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke={faceStatus==='ok'?'#00ffa3':faceStatus==='error'?'#ff3b5c':faceStatus==='scanning'?'#ffb020':'#5c8fa8'} strokeWidth="1.1"/>
                  <circle cx="5.5" cy="6.5" r="1" fill={faceStatus==='ok'?'#00ffa3':'#5c8fa8'}/>
                  <circle cx="10.5" cy="6.5" r="1" fill={faceStatus==='ok'?'#00ffa3':'#5c8fa8'}/>
                  <path d="M5.5 10.5c.7 1 4.3 1 5 0" stroke={faceStatus==='ok'?'#00ffa3':'#5c8fa8'} strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span className="face-lbl" style={{color:faceStatus==='ok'?'#00ffa3':faceStatus==='error'?'#ff3b5c':faceStatus==='scanning'?'#ffb020':'#5c8fa8'}}>
                  {faceStatus==='idle'?'Face ID requerido':faceStatus==='loading'?'Cargando modelos...':faceStatus==='scanning'?'Escaneando...':faceStatus==='ok'?'Verificado':'No reconocido'}
                </span>
              </div>
              {faceError && <div className="face-err">{faceError}</div>}

              {/* GPS */}
              <div className="gps-bar">
                <div className={`gps-dot ${gpsCfg.pulse?'pulse':''}`} style={{background:gpsCfg.color,boxShadow:`0 0 5px ${gpsCfg.color}`}}/>
                <span className="gps-lbl" style={{color:gpsCfg.color}}>{gpsCfg.label}</span>
                {coords&&<span className="gps-coords">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>}
              </div>

              {!activo?(
                <button className="jornada-btn iniciar" onClick={iniciar} disabled={faceStatus==='loading'||faceStatus==='scanning'}>
                  {faceStatus==='loading'||faceStatus==='scanning'?<><div className="tec-spinner"/>Verificando...</>:<>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1"/><path d="M5.5 4.5l3.5 2.5-3.5 2.5V4.5z" fill="currentColor"/></svg>
                    Iniciar Jornada
                  </>}
                </button>
              ):(
                <button className="jornada-btn finalizar" onClick={finalizar}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1"/><rect x="4.5" y="4.5" width="5" height="5" rx=".5" fill="currentColor"/></svg>
                  Finalizar Jornada
                </button>
              )}
            </div>
          </div>

          <div className="tec-stats">
            {[
              {val:activo?'ON':'OFF',key:'Estado',color:activo?'#00ffa3':'#5c8fa8'},
              {val:updateCount,key:'GPS Updates',color:'#00c8ff'},
              {val:actividades.length,key:'Actividades',color:'#ffb020'},
              {val:completas,key:'Completadas',color:'#00ffa3'},
              {val:pendientes,key:'Pendientes',color:'#ff3b5c'},
              {val:ruta.length,key:'Ruta pts',color:'#5c8fa8'},
            ].map(s=>(
              <div key={s.key} className="tec-stat">
                <div className="tec-stat-val" style={{color:s.color}}>{s.val}</div>
                <div className="tec-stat-key">{s.key}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className="tec-panel">
          <div className="tec-tabs">
            <button className={`tec-tab ${activeTab==='mapa'?'active':''}`} onClick={()=>setActiveTab('mapa')}>Mapa</button>
            <button className={`tec-tab ${activeTab==='actividades'?'active':''}`} onClick={()=>setActiveTab('actividades')}>
              Actividades{pendientes>0&&<span className="tab-badge" style={{background:'rgba(255,59,92,.15)',color:'#ff3b5c'}}>{pendientes}</span>}
            </button>
            <button className={`tec-tab ${activeTab==='log'?'active':''}`} onClick={()=>setActiveTab('log')}>
              Log<span className="tab-badge" style={{background:'rgba(0,200,255,.08)',color:'#5c8fa8'}}>{logs.length}</span>
            </button>
          </div>

          {activeTab==='mapa'&&(
            <div className="tec-map-wrap">
              <MapWithNoSSR coords={coords} ruta={ruta} actividades={actividades} activo={activo}/>
            </div>
          )}

          {activeTab==='actividades'&&(
            <div className="act-list">
              {actividades.length===0?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'40px',gap:10,opacity:.3}}>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:'.3em',color:'var(--text2,#5c8fa8)',textTransform:'uppercase'}}>
                    {activo?'Sin actividades asignadas':'Inicia jornada para ver actividades'}
                  </span>
                </div>
              ):actividades.map(a=>{
                const pc=PRIO_CFG[a.prioridad]
                return(
                  <div key={a.id} className={`act-item ${a.llegada_confirmada?'done':''}`} style={{'--pc':pc.color}as React.CSSProperties}>
                    <div className="act-head">
                      <div className="act-titulo">{a.titulo}</div>
                      <span className="act-badge" style={{color:pc.color}}>{pc.label}</span>
                    </div>
                    {a.cliente_nombre&&<div className="act-field">👤 {a.cliente_nombre}</div>}
                    {a.direccion&&<div className="act-field">📍 {a.direccion}</div>}
                    {a.descripcion&&<div className="act-field" style={{marginTop:4,opacity:.8}}>{a.descripcion}</div>}
                    <span className="act-check" style={a.llegada_confirmada?{color:'#00ffa3',background:'rgba(0,255,163,.07)',border:'1px solid rgba(0,255,163,.18)'}:{color:'#5c8fa8',background:'rgba(0,0,0,.2)',border:'1px solid rgba(0,200,255,.07)'}}>
                      {a.llegada_confirmada?'✓ LLEGADA CONFIRMADA':'○ PENDIENTE'}
                    </span>
                    <div className="ev-section">
                      <div className="ev-lbl">Evidencia</div>
                      {!!(a.evidencias?.length)&&(
                        <div className="ev-thumbs">
                          {(a.evidencias||[]).map((ev,i)=>ev.tipo==='video'?
                            <div key={i} className="ev-thumb vid">▶</div>:
                            <div key={i} className="ev-thumb"><img src={ev.url} alt="ev"/></div>
                          )}
                        </div>
                      )}
                      <div className="ev-row">
                        <input className="ev-note" placeholder="Nota (opcional)..." value={uploadNote} onChange={e=>setUploadNote(e.target.value)}/>
                        <button className="ev-btn" disabled={!activo||uploadingId===a.id}
                          onClick={()=>{setUploadingId(a.id);fileRef.current?.click()}}>
                          {uploadingId===a.id?<div className="tec-spinner"/>:<>
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v6.5M3 4l2.5-3 2.5 3M1 9.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Subir
                          </>}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab==='log'&&(
            <div className="tec-log">
              {logs.length===0?(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',opacity:.3}}>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:'.3em',color:'var(--text2,#5c8fa8)',textTransform:'uppercase'}}>Sin eventos</span>
                </div>
              ):logs.map((l,i)=>(
                <div key={i} className="log-item">
                  <span className="log-time">{l.time}</span>
                  <div className="log-dot" style={{background:LOG_COLORS[l.type],boxShadow:`0 0 4px ${LOG_COLORS[l.type]}`}}/>
                  <span className="log-msg" style={{color:LOG_COLORS[l.type]}}>{l.msg}</span>
                </div>
              ))}
              <div ref={logsEndRef}/>
            </div>
          )}
        </div>
      </div>
    </div>
  </>)
}