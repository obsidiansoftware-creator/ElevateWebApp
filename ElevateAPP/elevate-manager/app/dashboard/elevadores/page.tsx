export default function ElevadoresPage() {
  const elevadores = [
    { id: 1, nombre: 'Elevador Torre A', estado: 'Activo' },
    { id: 2, nombre: 'Elevador Plaza Centro', estado: 'Mantenimiento' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Elevadores</h1>

      <table className="w-full bg-white rounded-xl shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Nombre</th>
            <th className="p-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {elevadores.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-3">{e.nombre}</td>
              <td className="p-3">{e.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
