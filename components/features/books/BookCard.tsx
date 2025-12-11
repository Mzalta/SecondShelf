'use client'

import { Book } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface BookCardProps {
  book: Book
  index: number
  isFavorite?: boolean
  isOwner?: boolean
  onToggleFavorite: (index: number) => void
  onMarkAsSold?: (index: number) => void
}

export default function BookCard({
  book,
  index,
  isFavorite = false,
  isOwner = false,
  onToggleFavorite,
  onMarkAsSold
}: BookCardProps) {
  return (
    <Card hover>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{book.title}</h3>
      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <p><strong>Author:</strong> {book.author}</p>
        <p><strong>Course:</strong> {book.course}</p>
        <p><strong>Price:</strong> {book.price}</p>
        {book.poster && (
          <p><strong>Posted by:</strong> {book.poster}</p>
        )}
      </div>
      <p className="text-sm text-gray-700 mb-4">
        <strong>Contact:</strong> {book.contact}
      </p>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="favorite"
          size="sm"
          onClick={() => onToggleFavorite(index)}
        >
          {isFavorite ? '★ Saved' : '☆ Save to Favorites'}
        </Button>
        {isOwner && onMarkAsSold && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onMarkAsSold(index)}
          >
            Mark as Sold
          </Button>
        )}
      </div>
    </Card>
  )
}
