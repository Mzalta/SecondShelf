'use client'

import { Book } from '@/types'
import type { User } from '@supabase/supabase-js'
import BookCard from './BookCard'
import BookGrid from './BookGrid'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import Link from 'next/link'

interface BookListProps {
  books: Book[]
  favoriteIds?: Set<string>
  currentUser?: User | null
  isLoading?: boolean
  onToggleFavorite: (bookId: string) => void
  onMarkAsSold?: (bookId: string) => void
  onMarkAsUnsold?: (bookId: string) => void
  onDelete?: (bookId: string) => void
  onEdit?: (book: Book) => void
}

export default function BookList({
  books,
  favoriteIds = new Set(),
  currentUser,
  isLoading = false,
  onToggleFavorite,
  onMarkAsSold,
  onMarkAsUnsold,
  onDelete,
  onEdit
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
      {books.map((book) => {
        if (!book.id) return null // Skip books without IDs
        
        const isFavorite = favoriteIds.has(book.id)
        const isOwner = Boolean(currentUser && book.userId === currentUser.id)
        
        return (
          <BookCard
            key={book.id}
            book={book}
            isFavorite={isFavorite}
            isOwner={isOwner}
            onToggleFavorite={() => onToggleFavorite(book.id!)}
            onMarkAsSold={isOwner && onMarkAsSold ? () => onMarkAsSold(book.id!) : undefined}
            onMarkAsUnsold={isOwner && onMarkAsUnsold ? () => onMarkAsUnsold(book.id!) : undefined}
            onDelete={isOwner && onDelete ? () => onDelete(book.id!) : undefined}
            onEdit={isOwner && onEdit ? () => onEdit(book) : undefined}
          />
        )
      })}
    </BookGrid>
  )
}
