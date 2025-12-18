'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import AuthGuard from '@/components/auth/AuthGuard'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
