'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from './Navbar'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle, signOut } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function Header() {
  const { currentUser, setCurrentUser } = useBookStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for authenticated user on mount
    getCurrentUser().then((user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    // Listen for auth state changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setCurrentUser])

  const handleSignIn = async () => {
    await signInWithGoogle()
  }

  const handleSignOut = async () => {
    await signOut()
    setCurrentUser(null)
  }

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <nav className="max-w-1200 mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="logo no-underline">
          <h1 className="text-2xl font-semibold text-white">📚 SecondShelf</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Navbar />
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="text-sm opacity-75">Loading...</span>
            ) : currentUser ? (
              <>
                <span className="text-sm hidden sm:inline">
                  {currentUser.email || currentUser.user_metadata?.name || 'User'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                  className="!bg-blue-700 hover:!bg-blue-800"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignIn}
                className="!bg-blue-700 hover:!bg-blue-800"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
