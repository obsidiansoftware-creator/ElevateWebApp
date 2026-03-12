type FormCotizacion = {
  cliente_id: number
  capacidad: number
  paradas: number
  velocidad: number
  tipo: string
  acabados: string
  margen: number
}

type ResultadoCotizacion = {
  id: number
  numero: string
  precioFinal: number
}