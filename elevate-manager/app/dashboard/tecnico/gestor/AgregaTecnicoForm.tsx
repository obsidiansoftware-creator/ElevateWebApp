"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface Tecnico {
  id: number
  nombre: string
  email: string
  telefono?: string
  estatus: "activo" | "inactivo" | "bloqueado"
  face_enrollado: boolean
  ultimo_login?: string
  created_at: string
}

interface Props {
  tecnico: Tecnico | null  // null = modo crear, Tecnico = modo editar
  onClose: () => void
  onSaved: () => void
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AgregaTecnicoForm({ tecnico, onClose, onSaved }: Props) {
  const isEdit = !!tecnico

  const [nombre,   setNombre]   = useState(tecnico?.nombre    || "")
  const [email,    setEmail]    = useState(tecnico?.email      || "")
  const [telefono, setTelefono] = useState(tecnico?.telefono  || "")
  const [password, setPassword] = useState("")
  const [estatus,  setEstatus]  = useState<"activo"|"inactivo"|"bloqueado">(tecnico?.estatus || "activo")
  const [focused,  setFocused]  = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState("")

  // Cerrar con ESC
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [onClose])

  const handleSave = async () => {
    if (!nombre || !email) { setError("Nombre y email son obligatorios"); return }
    if (!isEdit && !password) { setError("La contraseña es obligatoria para nuevos técnicos"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch(
        isEdit ? `/api/tecnico/${tecnico!.id}` : "/api/tecnico",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            email,
            telefono: telefono || undefined,
            password: password || undefined,
            estatus,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); setSaving(false); return }
      onSaved()
      onClose()
    } catch {
      setError("Error de conexión")
    }
    setSaving(false)
  }

  // ── Campo reutilizable ─────────────────────────────────────────────────────
  const Field = ({
    id, label, value, onChange, type = "text", placeholder, required = false,
  }: {
    id: string; label: string; value: string; onChange: (v: string) => void
    type?: string; placeholder?: string; required?: boolean
  }) => (
    <div className={`gf-field ${focused === id ? "focused" : ""}`}>
      <label className="gf-label">
        {label}
        {required && <span className="gf-req">*</span>}
      </label>
      <input
        className="gf-input"
        type={type}
        placeholder={placeholder || label}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
      />
    </div>
  )

  return createPortal(
    <div className="gf-backdrop" onClick={onClose}>
      <div className="gf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>

        {/* Corner decorations */}
        <div className="gf-corner tl" /><div className="gf-corner tr" />
        <div className="gf-corner bl" /><div className="gf-corner br" />

        {/* Header */}
        <div className="gf-header">
          <div>
            <div className="gf-eyebrow">{isEdit ? "Modificar registro" : "Nuevo registro"}</div>
            <div className="gf-title">
              {isEdit ? "Editar" : "Agregar"}{" "}
              <span style={{ color: "#00ffa3" }}>Técnico</span>
            </div>
          </div>
          <button className="gf-close" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="gf-body">

          {/* Aviso Face ID — solo al crear */}
          {!isEdit && (
            <div style={{
              padding: "10px 12px",
              background: "rgba(0,200,255,0.04)",
              border: "1px solid rgba(0,200,255,0.15)",
              borderRadius: 3,
              marginBottom: 14,
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 8,
                letterSpacing: ".3em",
                color: "#00c8ff",
                textTransform: "uppercase",
                marginBottom: 4,
              }}>
                ℹ AVISO FACE ID
              </div>
              <div style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 11,
                color: "var(--text2,#5c8fa8)",
                lineHeight: 1.5,
              }}>
                Al crearse la cuenta, el técnico deberá registrar su Face ID
                al hacer su primer inicio de sesión.
              </div>
            </div>
          )}

          {/* Sección: Datos personales */}
          <div className="gf-section-label">Datos Personales</div>
          <Field id="nom" label="Nombre completo" value={nombre} onChange={setNombre} required />
          <Field id="tel" label="Teléfono" value={telefono} onChange={setTelefono} type="tel" />

          {/* Sección: Acceso */}
          <div className="gf-section-label" style={{ marginTop: 6 }}>Acceso al Sistema</div>
          <Field
            id="em"
            label="Correo electrónico"
            value={email}
            onChange={setEmail}
            type="email"
            required
          />
          <Field
            id="pw"
            label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            value={password}
            onChange={setPassword}
            type="password"
            required={!isEdit}
            placeholder={isEdit ? "Dejar vacío para no cambiar" : "••••••••"}
          />

          {/* Sección: Estado — solo al editar */}
          {isEdit && (
            <>
              <div className="gf-section-label" style={{ marginTop: 6 }}>Estado</div>
              <div className="gf-field">
                <label className="gf-label">Estatus</label>
                <div className="gf-select-wrap">
                  <select
                    className="gf-select"
                    value={estatus}
                    onChange={e => setEstatus(e.target.value as typeof estatus)}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              color: "#ff3b5c",
              letterSpacing: ".15em",
              padding: "6px 10px",
              background: "rgba(255,59,92,0.06)",
              border: "1px solid rgba(255,59,92,0.2)",
              borderRadius: 3,
            }}>
              ● {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="gf-footer">
          <button className="gf-btn gf-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="gf-btn gf-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><div className="gf-spinner" />Guardando...</>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {isEdit ? "Actualizar" : "Crear Técnico"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}