import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rule Flow Platform - Runtime App',
  description: 'Schema-driven runtime application',
}

export default function RootLayout({
  children,
}: {
  children: React.Node
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
