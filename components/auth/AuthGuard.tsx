'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signInWithGoogle } from '@/lib/auth/auth'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { User } from '@supabase/supabase-js'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    try {
      setLoading(true)
      const { error } = await signInWithGoogle()
      if (error) {
        console.error('Sign in error:', error)
        const errorMessage = (error as any)?.message || String(error) || 'Unknown error'
        alert(`Sign in failed: ${errorMessage}`)
        setLoading(false)
      }
      // If successful, the redirect will happen automatically via OAuth
    } catch (error: unknown) {
      console.error('Sign in error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error) || 'Please check your browser console for details.'
      alert(`Sign in failed: ${errorMessage}`)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-purple-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <h1 className="text-4xl mb-2">📚</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SecondShelf</h2>
            <p className="text-gray-600">
              Please sign in with Google to access the textbook marketplace
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSignIn}
            className="w-full"
          >
            Sign In with Google
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            By signing in, you agree to our terms of service
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

