'use client'

import { Book } from '@/types'
import Button from '@/components/ui/Button'
import { Heart, HeartOff, ShoppingBag, Trash2, Mail, Phone } from 'lucide-react'

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
  // Extract price value for display
  const priceValue = book.price.replace(/[^0-9.]/g, '')
  const isPrice = /^\$?\d+/.test(book.price)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Image Placeholder */}
      <div className="w-full h-64 bg-gradient-to-br from-teal-50 to-purple-50 flex items-center justify-center relative">
        <div className="text-6xl opacity-30">📚</div>
        {book.sold && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded font-bold text-lg">SOLD</span>
          </div>
        )}
        {book.category && (
          <div className="absolute top-2 left-2">
            <span className="bg-white bg-opacity-90 text-xs font-semibold px-2 py-1 rounded text-gray-700">
              {book.category}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 h-14 hover:text-purple-600 transition-colors">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-sm text-gray-600 mb-1">by {book.author}</p>

        {/* Course Badge */}
        <div className="mb-3">
          <span className="inline-block bg-teal-50 text-teal-700 text-xs font-medium px-2 py-1 rounded">
            {book.course}
          </span>
        </div>

        {/* Price - Prominent */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            {isPrice && <span className="text-2xl font-bold text-gray-900">{book.price}</span>}
            {!isPrice && <span className="text-lg font-semibold text-gray-900">{book.price}</span>}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {book.contact.includes('@') ? (
              <Mail size={14} className="text-gray-400" />
            ) : (
              <Phone size={14} className="text-gray-400" />
            )}
            <span className="truncate">{book.contact}</span>
          </div>
          {book.poster && (
            <p className="text-xs text-gray-500 mt-1">Seller: {book.poster}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!book.sold && (
            <button
              onClick={onToggleFavorite}
              className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isFavorite
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-amber-400 text-gray-900 hover:bg-amber-500'
              }`}
            >
              {isFavorite ? (
                <>
                  <Heart size={16} className="fill-current" />
                  Saved
                </>
              ) : (
                <>
                  <HeartOff size={16} />
                  Save to Favorites
                </>
              )}
            </button>
          )}

          {isOwner && !book.sold && onMarkAsSold && (
            <button
              onClick={onMarkAsSold}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Mark as Sold
            </button>
          )}

          {isOwner && onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                  onDelete()
                }
              }}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete Listing
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
