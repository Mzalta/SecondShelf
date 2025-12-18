'use client'

import { useState } from 'react'
import { Book } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CheckoutDialog from '@/components/features/payments/CheckoutDialog'
import { useBookStore } from '@/lib/store/useBookStore'

interface BookCardProps {
  book: Book
  isFavorite?: boolean
  isOwner?: boolean
  onToggleFavorite: () => void
  onMarkAsSold?: () => void
}

export default function BookCard({
  book,
  isFavorite = false,
  isOwner = false,
  onToggleFavorite,
  onMarkAsSold
}: BookCardProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const { currentUser, fetchBooks } = useBookStore()

  const handleBuyClick = () => {
    if (!currentUser) {
      alert('Please sign in to purchase books')
      return
    }
    setIsCheckoutOpen(true)
  }

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false)
    // Refresh the book list to update sold status
    fetchBooks()
  }

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
          {!isOwner && !book.sold && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBuyClick}
            >
              Buy Now
            </Button>
          )}
          {isOwner && onMarkAsSold && !book.sold && (
            <Button
              variant="danger"
              size="sm"
              onClick={onMarkAsSold}
            >
              Mark as Sold
            </Button>
          )}
        </div>
      </Card>
      <CheckoutDialog
        book={book}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </>
  )
}
