import { ProyectosProvider } from '../contexts/ProyectosContext'

export default function ProyectosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProyectosProvider>
      {children}
    </ProyectosProvider>
  )
}
