export function calcularCosto(data) {
  let costo = 0

  const baseTipo = {
    HIDRAULICO: 400000,
    TRACCION: 550000,
    PANORAMICO: 650000,
    MONTACARGAS: 700000,
  }

  const capacidad = Number(data.capacidad) || 0
  const paradas = Number(data.paradas) || 0
  const velocidad = Number(data.velocidad) || 0

  costo += baseTipo[data.tipo] || 0
  costo += capacidad * 120
  costo += paradas * 25000
  costo += velocidad * 50000

  if (data.acabados === "LUJO") costo += 80000
  if (data.acabados === "PREMIUM") costo += 150000

  return costo
}