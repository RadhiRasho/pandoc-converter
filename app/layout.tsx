import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'pandoc-converter',
  description: 'A tool for converting documents using Pandoc',
  generator: 'pandoc-converter',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
