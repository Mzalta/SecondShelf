'use client'

import { useEffect, useState } from 'react'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle } from '@/lib/auth/auth'
import BookList from '@/components/features/books/BookList'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import ErrorDisplay from '@/components/ui/ErrorDisplay'

export default function MyShelfPage() {
  const { 
    myBooks,
    favoriteIds, 
    currentUser, 
    loading,
    error,
    toggleFavorite, 
    markAsSold,
    removeListing,
    setCurrentUser,
    fetchMyBooks,
    fetchFavorites,
    clearError
  } = useBookStore()
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Check authentication and fetch user's books on mount
  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)
      setCheckingAuth(false)
      
      if (user) {
        await Promise.all([
          fetchMyBooks(),
          fetchFavorites()
        ])
      }
    }
    
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const handleSignIn = async () => {
    await signInWithGoogle()
  }
  
  const handleDelete = async (bookId: string) => {
    try {
      await removeListing(bookId)
      // Refresh the list after deletion
      await fetchMyBooks()
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }
  
  const handleMarkAsSold = async (bookId: string) => {
    try {
      await markAsSold(bookId)
      // Refresh the list after marking as sold
      await fetchMyBooks()
    } catch (error) {
      console.error('Error marking book as sold:', error)
    }
  }
  
  if (checkingAuth) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-6">My Shelf</h2>
        <Loading />
      </section>
    )
  }
  
  if (!currentUser) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-6">My Shelf</h2>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="mb-4 text-gray-700">
            You need to sign in to view your listings.
          </p>
          <Button
            variant="primary"
            onClick={handleSignIn}
          >
            Sign in with Google
          </Button>
        </div>
      </section>
    )
  }
  
  return (
    <section>
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">My Shelf</h2>
        <p className="text-gray-600">
          Manage all the books you&apos;ve listed on SecondShelf
        </p>
      </div>

      {/* Error Message */}
      <ErrorDisplay
        error={error}
        onDismiss={() => clearError()}
        autoDismiss={true}
      />

      {/* Book Listings Section */}
      {loading && <Loading />}
      
      {!loading && myBooks.length === 0 ? (
        <EmptyState
          icon="📚"
          message="You haven't added any books yet. Start building your shelf!"
          actionLabel="Add Your First Book"
          actionHref="/add"
        />
      ) : (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            {myBooks.length} {myBooks.length === 1 ? 'listing' : 'listings'}
          </div>
          <BookList
            books={myBooks}
            favoriteIds={favoriteIds}
            currentUser={currentUser}
            isLoading={false}
            onToggleFavorite={toggleFavorite}
            onMarkAsSold={handleMarkAsSold}
            onDelete={handleDelete}
          />
        </div>
      )}
    </section>
  )
}
