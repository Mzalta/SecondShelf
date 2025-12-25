'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useBookStore } from '@/lib/store/useBookStore'
import { useSearch } from '@/lib/hooks/useSearch'
import BookList from '@/components/features/books/BookList'
import EditListingDialog from '@/components/features/books/EditListingDialog'
import ResultsCount from '@/components/features/search/ResultsCount'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { getCurrentUser } from '@/lib/auth/auth'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Book } from '@/types'

export default function HomePage() {
  const searchParams = useSearchParams()
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
  
  // Get search query from URL params
  const searchQuery = searchParams.get('search') || ''
  
  // Filter out sold books from public listings
  const activeListings = listings.filter(book => !book.sold)
  const filteredBooks = useSearch(activeListings, searchQuery)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
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
  
  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setIsEditDialogOpen(true)
  }
  
  const handleEditClose = () => {
    setIsEditDialogOpen(false)
    setEditingBook(null)
  }
  
  const handleEditSuccess = async () => {
    // Refresh the list after editing
    await fetchBooks()
  }
  
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
                <Link href="/" className="hover:text-purple-600">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Textbooks</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">Textbook Marketplace</h1>
            </div>
            <Link
              href="/add"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
          <ResultsCount count={filteredBooks.length} total={activeListings.length} />
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
          onEdit={handleEdit}
        />
      </div>
      
      {/* Edit Dialog */}
      {editingBook && (
        <EditListingDialog
          book={editingBook}
          isOpen={isEditDialogOpen}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
