import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-1200 w-full mx-auto px-4 sm:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
