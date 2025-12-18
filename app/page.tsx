'use client'

import { useState, useEffect } from 'react'
import { useBookStore } from '@/lib/store/useBookStore'
import { useSearch } from '@/lib/hooks/useSearch'
import BookList from '@/components/features/books/BookList'
import ResultsCount from '@/components/features/search/ResultsCount'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { getCurrentUser } from '@/lib/auth/auth'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function HomePage() {
  const { 
    listings, 
    favoriteIds, 
    currentUser, 
    loading,
    error,
    fetchBooks, 
    fetchFavorites,
    toggleFavorite, 
    markAsSold,
    removeListing,
    setCurrentUser,
    clearError
  } = useBookStore()
  const [searchQuery, setSearchQuery] = useState('')
  const filteredBooks = useSearch(listings, searchQuery)
  
  // Get search query from URL params and update on navigation
  useEffect(() => {
    const updateSearchFromURL = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const searchParam = params.get('search') || ''
        setSearchQuery(searchParam)
      }
    }
    
    // Initial load
    updateSearchFromURL()
    
    // Listen for navigation changes
    window.addEventListener('popstate', updateSearchFromURL)
    
    return () => {
      window.removeEventListener('popstate', updateSearchFromURL)
    }
  }, [])
  
  // Fetch books and user on mount
  useEffect(() => {
    fetchBooks()
    
    // Check for authenticated user
    getCurrentUser().then((user) => {
      setCurrentUser(user)
      if (user) {
        fetchFavorites()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Message */}
      <ErrorDisplay
        error={error}
        onDismiss={() => clearError()}
        autoDismiss={true}
      />

      {/* Breadcrumb & Action Bar */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                <Link href="/" className="hover:text-orange-600">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Textbooks</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">Textbook Marketplace</h1>
            </div>
            <Link
              href="/add"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={18} />
              List Your Book
            </Link>
          </div>
        </div>
      </div>

      {/* Results Count & Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between">
          <ResultsCount count={filteredBooks.length} total={listings.length} />
        </div>
      </div>

      {/* Book Listings Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <BookList
          books={filteredBooks}
          favoriteIds={favoriteIds}
          currentUser={currentUser}
          isLoading={loading}
          onToggleFavorite={toggleFavorite}
          onMarkAsSold={markAsSold}
          onDelete={removeListing}
        />
      </div>
    </div>
  )
}
