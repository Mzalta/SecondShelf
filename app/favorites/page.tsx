'use client'

import { useBookStore } from '@/lib/store/useBookStore'
import BookCard from '@/components/features/books/BookCard'
import BookGrid from '@/components/features/books/BookGrid'
import EmptyState from '@/components/ui/EmptyState'

export default function FavoritesPage() {
  const { listings, favorites, currentUser, toggleFavorite, markAsSold } = useBookStore()
  
  // Get favorite books with their original indices
  const favoriteBooksWithIndices = favorites
    .filter((index) => index < listings.length)
    .map((index) => ({ book: listings[index], originalIndex: index }))
  
  if (favoriteBooksWithIndices.length === 0) {
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
      <BookGrid>
        {favoriteBooksWithIndices.map(({ book, originalIndex }) => {
          const isFavorite = favorites.includes(originalIndex)
          const isOwner = Boolean(currentUser && book.poster === currentUser)
          
          return (
            <BookCard
              key={originalIndex}
              book={book}
              index={originalIndex}
              isFavorite={isFavorite}
              isOwner={isOwner}
              onToggleFavorite={toggleFavorite}
              onMarkAsSold={isOwner ? markAsSold : undefined}
            />
          )
        })}
      </BookGrid>
    </section>
  )
}
