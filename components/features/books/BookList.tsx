'use client'

import { Book } from '@/types'
import BookCard from './BookCard'
import BookGrid from './BookGrid'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import Link from 'next/link'

interface BookListProps {
  books: Book[]
  favorites?: number[]
  currentUser?: string
  isLoading?: boolean
  onToggleFavorite: (index: number) => void
  onMarkAsSold?: (index: number) => void
}

export default function BookList({
  books,
  favorites = [],
  currentUser,
  isLoading = false,
  onToggleFavorite,
  onMarkAsSold
}: BookListProps) {
  if (isLoading) {
    return <Loading />
  }
  
  if (books.length === 0) {
    return (
      <EmptyState
        icon="📚"
        message="No book listings yet. Be the first to add one!"
        actionLabel="Add Your First Book"
        actionHref="/add"
      />
    )
  }
  
  return (
    <BookGrid>
      {books.map((book, index) => {
        const isFavorite = favorites.includes(index)
        const isOwner = Boolean(currentUser && book.poster === currentUser)
        
        return (
          <BookCard
            key={index}
            book={book}
            index={index}
            isFavorite={isFavorite}
            isOwner={isOwner}
            onToggleFavorite={onToggleFavorite}
            onMarkAsSold={onMarkAsSold}
          />
        )
      })}
    </BookGrid>
  )
}
