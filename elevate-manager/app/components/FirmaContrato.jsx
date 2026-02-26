"use client"

import SignatureCanvas from "react-signature-canvas"
import { useRef } from "react"

export default function FirmaContrato({ contratoId, onFirmado }) {
  const sigRef = useRef(null)

  const guardarFirma = async () => {
    if (!sigRef.current) return

    const firma = sigRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png")

    await fetch("/api/contratos/firma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contratoId, firma }),
    })

    if (onFirmado) onFirmado()
  }

  return (
    <div>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 400, height: 200, className: "border" }}
      />

      <button
        onClick={guardarFirma}
        className="bg-green-600 text-white px-4 py-2 mt-2 rounded"
      >
        Firmar Contrato
      </button>
    </div>
  )
}