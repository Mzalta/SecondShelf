'use client'

import { Book } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface BookCardProps {
  book: Book
  isFavorite?: boolean
  isOwner?: boolean
  onToggleFavorite: () => void
  onMarkAsSold?: () => void
  onDelete?: () => void
}

export default function BookCard({
  book,
  isFavorite = false,
  isOwner = false,
  onToggleFavorite,
  onMarkAsSold,
  onDelete
}: BookCardProps) {

  return (
    <>
      <Card hover>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{book.title}</h3>
        <div className="space-y-1 text-sm text-gray-600 mb-4">
          <p><strong>Author:</strong> {book.author}</p>
          <p><strong>Course:</strong> {book.course}</p>
          {book.category && (
            <p><strong>Category:</strong> <span className="text-blue-600 font-medium">{book.category}</span></p>
          )}
          <p><strong>Price:</strong> {book.price}</p>
          {book.poster && (
            <p><strong>Posted by:</strong> {book.poster}</p>
          )}
        </div>
        <p className="text-sm text-gray-700 mb-4">
          <strong>Contact:</strong> {book.contact}
        </p>
        {book.sold && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
              Sold
            </span>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="favorite"
            size="sm"
            onClick={onToggleFavorite}
          >
            {isFavorite ? '★ Saved' : '☆ Save to Favorites'}
          </Button>
          {isOwner && onMarkAsSold && !book.sold && (
            <Button
              variant="danger"
              size="sm"
              onClick={onMarkAsSold}
            >
              Mark as Sold
            </Button>
          )}
          {isOwner && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                  onDelete()
                }
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </Card>
    </>
  )
}
