export function calcularCosto(data) {
  let costo = 0

  // Base por tipo
  const baseTipo = {
    HIDRAULICO: 400000,
    TRACCION: 550000,
    PANORAMICO: 650000,
    MONTACARGAS: 700000,
  }

  costo += baseTipo[data.tipo] || 0

  // Capacidad
  costo += data.capacidad * 120

  // Paradas
  costo += data.paradas * 25000

  // Velocidad
  costo += data.velocidad * 50000

  // Acabados
  if (data.acabados === "LUJO") costo += 80000
  if (data.acabados === "PREMIUM") costo += 150000

  return costo
}