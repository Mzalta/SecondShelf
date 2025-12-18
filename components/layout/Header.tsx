'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from './Navbar'
import SearchBar from '@/components/features/search/SearchBar'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle, signOut } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import { User } from 'lucide-react'

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
    // Navigate to home with search query
    router.push(`/?search=${encodeURIComponent(query)}`)
  }

  return (
    <header className="bg-[rgb(35,47,62)] text-white">
      {/* Top bar */}
      <div className="bg-[rgb(19,25,33)] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-orange-400 transition-colors">
                📚 SecondShelf
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {loading ? (
                <span className="text-xs opacity-75">Loading...</span>
              ) : currentUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs hidden sm:inline text-gray-300">
                    {currentUser.email || currentUser.user_metadata?.name || 'User'}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs hover:text-orange-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="text-xs hover:text-orange-400 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header with logo, search, and nav */}
      <div className="bg-[rgb(35,47,62)] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
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

            {/* Account & Cart */}
            <div className="flex-shrink-0 flex items-center gap-4">
              {currentUser && (
                <Link 
                  href="/favorites" 
                  className="flex flex-col items-start hover:text-orange-400 transition-colors"
                >
                  <span className="text-xs text-gray-300">Favorites</span>
                  <span className="text-sm font-semibold">Saved</span>
                </Link>
              )}
              <Link 
                href={currentUser ? "/my-shelf" : "#"} 
                onClick={!currentUser ? handleSignIn : undefined}
                className="flex flex-col items-start hover:text-orange-400 transition-colors"
              >
                <span className="text-xs text-gray-300">Account</span>
                <span className="text-sm font-semibold flex items-center gap-1">
                  <User size={16} />
                  {currentUser ? 'My Shelf' : 'Sign In'}
                </span>
              </Link>
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
