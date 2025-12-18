'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from './Navbar'
import SearchBar from '@/components/features/search/SearchBar'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle, signOut } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const { currentUser, setCurrentUser } = useBookStore()
  const [loading, setLoading] = useState(true)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }

    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [accountMenuOpen])

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
                <div className="relative" ref={accountMenuRef}>
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-300">Hello,</span>
                      <span className="text-sm font-semibold">
                        {currentUser.email?.split('@')[0] || currentUser.user_metadata?.name || 'User'}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/subscription"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline transition-colors"
                      >
                        Upgrade to Pro
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false)
                          handleSignOut()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 bg-transparent border-0 cursor-pointer transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
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
