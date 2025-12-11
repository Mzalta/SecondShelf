import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SecondShelf - Used Textbook Exchange',
  description: 'Trade and sell used textbooks with college students locally',
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
