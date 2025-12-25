'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle } from '@/lib/auth/auth'
import BookList from '@/components/features/books/BookList'
import EditListingDialog from '@/components/features/books/EditListingDialog'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { Plus } from 'lucide-react'
import { Book } from '@/types'

export default function MyShelfPage() {
  const { 
    myBooks,
    favoriteIds, 
    currentUser, 
    loading,
    error,
    toggleFavorite, 
    markAsSold,
    markAsUnsold,
    removeListing,
    setCurrentUser,
    fetchMyBooks,
    fetchBooks,
    fetchFavorites,
    clearError
  } = useBookStore()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
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

  const handleMarkAsUnsold = async (bookId: string) => {
    try {
      await markAsUnsold(bookId)
      // Refresh the list after unmarking as sold
      await fetchMyBooks()
      // Also refresh public listings to show the book again
      await fetchBooks()
    } catch (error) {
      console.error('Error unmarking book as sold:', error)
    }
  }
  
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
    await fetchMyBooks()
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">My Shelf</h2>
          <p className="text-gray-600">
            Manage all the books you&apos;ve listed on SecondShelf
          </p>
        </div>
        <Link href="/add">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            Sell Your Book
          </Button>
        </Link>
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
        <div className="space-y-8">
          {/* Active Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Active</h3>
              <div className="text-sm text-gray-600">
                {myBooks.filter(book => !book.sold).length} {myBooks.filter(book => !book.sold).length === 1 ? 'listing' : 'listings'}
              </div>
            </div>
            {myBooks.filter(book => !book.sold).length === 0 ? (
              <EmptyState
                icon="📖"
                message="You don't have any active listings yet."
                actionLabel="Add Your First Book"
                actionHref="/add"
              />
            ) : (
              <BookList
                books={myBooks.filter(book => !book.sold)}
                favoriteIds={favoriteIds}
                currentUser={currentUser}
                isLoading={false}
                onToggleFavorite={toggleFavorite}
                onMarkAsSold={handleMarkAsSold}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            )}
          </div>

          {/* Sold Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Sold</h3>
              <div className="text-sm text-gray-600">
                {myBooks.filter(book => book.sold).length} {myBooks.filter(book => book.sold).length === 1 ? 'listing' : 'listings'}
              </div>
            </div>
            {myBooks.filter(book => book.sold).length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No sold listings yet.</p>
              </div>
            ) : (
              <BookList
                books={myBooks.filter(book => book.sold)}
                favoriteIds={favoriteIds}
                currentUser={currentUser}
                isLoading={false}
                onToggleFavorite={toggleFavorite}
                onMarkAsSold={undefined}
                onMarkAsUnsold={handleMarkAsUnsold}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Edit Dialog */}
      {editingBook && (
        <EditListingDialog
          book={editingBook}
          isOpen={isEditDialogOpen}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </section>
  )
}
