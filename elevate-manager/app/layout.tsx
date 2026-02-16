import './globals.css'

export const metadata = {
  title: 'Elevator Manager',
  description: 'Dashboard para gestión de elevadores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen w-full">
        {children}  
      </body>
    </html>
  )
}
