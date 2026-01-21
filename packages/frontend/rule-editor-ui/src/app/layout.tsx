import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rule Editor - Rule Flow Platform',
  description: 'Create and manage business rules',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
