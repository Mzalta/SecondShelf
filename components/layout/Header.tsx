'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from './Navbar'
import SearchBar from '@/components/features/search/SearchBar'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle, signOut } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
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

  const handleSignOut = async () => {
    try {
      await signOut()
      setCurrentUser(null)
      // Use window.location for a full page reload to ensure state is cleared
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, try to redirect
      window.location.href = '/'
    }
  }

  const handleSearch = (query: string) => {
    // Always navigate to home page with search query
    router.push(`/?search=${encodeURIComponent(query)}`)
  }

  return (
    <header className="bg-[rgb(35,47,62)] text-white">
      {/* Main header with logo, search, and nav */}
      <div className="bg-[rgb(35,47,62)] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Logo - only one clickable logo */}
            <Link href="/" className="flex-shrink-0 no-underline">
              <h1 className="text-2xl font-bold text-white hover:text-orange-400 transition-colors">
                📚 SecondShelf
              </h1>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <SearchBar 
                onSearch={handleSearch} 
                placeholder="Search textbooks by title, author, or course..."
              />
            </div>

            {/* Account & Auth */}
            <div className="flex-shrink-0 flex items-center gap-4">
              {loading ? (
                <span className="text-xs opacity-75">Loading...</span>
              ) : currentUser ? (
                <>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-gray-300">Hello,</span>
                    <span className="text-sm font-semibold">
                      {currentUser.email?.split('@')[0] || currentUser.user_metadata?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-[rgb(35,47,62)] border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Navbar />
        </div>
      </div>
    </header>
  )
}
