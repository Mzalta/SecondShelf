'use client'

import { useEffect, useState } from 'react'
import { useBookStore } from '@/lib/store/useBookStore'
import { getFavoriteBooks } from '@/lib/api/favorites'
import { getCurrentUser, signInWithGoogle } from '@/lib/auth/auth'
import BookCard from '@/components/features/books/BookCard'
import BookGrid from '@/components/features/books/BookGrid'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import type { Book } from '@/types'

export default function FavoritesPage() {
  const { 
    favoriteIds, 
    currentUser, 
    loading,
    toggleFavorite, 
    markAsSold,
    removeListing,
    setCurrentUser,
    fetchFavorites
  } = useBookStore()
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Check authentication and fetch favorites on mount
  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)
      setCheckingAuth(false)
      
      if (user) {
        await fetchFavorites()
        try {
          const favorites = await getFavoriteBooks()
          setFavoriteBooks(favorites)
        } catch (error) {
          console.error('Error loading favorites:', error)
        }
      }
      setLoadingFavorites(false)
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
      // Refresh favorites list after deletion
      const favorites = await getFavoriteBooks()
      setFavoriteBooks(favorites)
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }
  
  if (checkingAuth || loadingFavorites) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-6">Your Saved Favorites</h2>
        <Loading />
      </section>
    )
  }
  
  if (!currentUser) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-6">Your Saved Favorites</h2>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="mb-4 text-gray-700">
            You need to sign in to view your favorites.
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
  
  if (favoriteBooks.length === 0) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-6">Your Saved Favorites</h2>
        <EmptyState
          icon="⭐"
          message="You haven't saved any favorites yet."
          actionLabel="Browse Listings"
          actionHref="/"
        />
      </section>
    )
  }
  
  return (
    <section>
      <h2 className="text-3xl font-bold mb-6">Your Saved Favorites</h2>
      {loading && <Loading />}
      <BookGrid>
        {favoriteBooks.map((book) => {
          if (!book.id) return null
          
          const isFavorite = favoriteIds.has(book.id)
          const isOwner = Boolean(currentUser && book.userId === currentUser.id)
          
          return (
            <BookCard
              key={book.id}
              book={book}
              isFavorite={isFavorite}
              isOwner={isOwner}
              onToggleFavorite={() => toggleFavorite(book.id!)}
              onMarkAsSold={isOwner ? () => markAsSold(book.id!) : undefined}
              onDelete={isOwner ? () => handleDelete(book.id!) : undefined}
            />
          )
        })}
      </BookGrid>
    </section>
  )
}
