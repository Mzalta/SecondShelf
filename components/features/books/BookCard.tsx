'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Book } from '@/types'
import Button from '@/components/ui/Button'
import { Heart, HeartOff, ShoppingBag, Trash2, Mail, Phone, Edit, MessageSquare } from 'lucide-react'
import { useProStatus } from '@/lib/hooks/useProStatus'
import { getCurrentUser } from '@/lib/auth/auth'
import Link from 'next/link'

interface BookCardProps {
  book: Book
  isFavorite?: boolean
  isOwner?: boolean
  onToggleFavorite: () => void
  onMarkAsSold?: () => void
  onMarkAsUnsold?: () => void
  onDelete?: () => void
  onEdit?: () => void
}

export default function BookCard({
  book,
  isFavorite = false,
  isOwner = false,
  onToggleFavorite,
  onMarkAsSold,
  onMarkAsUnsold,
  onDelete,
  onEdit
}: BookCardProps) {
  const router = useRouter()
  const { isPro, loading: proLoading } = useProStatus()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messageLoading, setMessageLoading] = useState(false)

  // Check if user is authenticated
  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user)
      setLoading(false)
    })
  }, [])

  // Extract price value for display
  const priceValue = book.price.replace(/[^0-9.]/g, '')
  const isPrice = /^\$?\d+/.test(book.price)

  const handleMessageClick = async () => {
    if (!currentUser) {
      // Redirect to sign in
      router.push(`/auth/callback?returnTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (!isPro) {
      // Redirect to subscription page
      router.push('/subscription')
      return
    }

    if (!book.id) {
      alert('Listing ID is missing')
      return
    }

    try {
      setMessageLoading(true)
      const response = await fetch('/api/messages/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ listing_id: book.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 403) {
          // Not Pro - redirect to subscription
          router.push('/subscription')
        } else {
          alert(data.error || 'Failed to start conversation')
        }
        return
      }

      const data = await response.json()
      router.push(`/messages/${data.conversation_id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation. Please try again.')
    } finally {
      setMessageLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Image */}
      <div className="w-full h-64 bg-gradient-to-br from-teal-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
        {book.imageUrl ? (
          <img
            src={book.imageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl opacity-30">📚</div>
        )}
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
        <Link href={book.id ? `/listings/${book.id}` : '#'}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 h-14 hover:text-purple-600 transition-colors cursor-pointer">
            {book.title}
          </h3>
        </Link>

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
          {!book.sold && !isOwner && (
            <>
              {/* Message Button - only show if not owner */}
              {!loading && !proLoading && (
                <>
                  {currentUser && isPro ? (
                    <button
                      onClick={handleMessageClick}
                      disabled={messageLoading}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <MessageSquare size={16} />
                      {messageLoading ? 'Starting...' : 'Message Seller'}
                    </button>
                  ) : currentUser && !isPro ? (
                    <Link
                      href="/subscription"
                      className="w-full py-2 px-4 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-center"
                    >
                      <MessageSquare size={16} />
                      Upgrade to Pro to message
                    </Link>
                  ) : (
                    <Link
                      href={`/auth/callback?returnTo=${encodeURIComponent(window.location.pathname)}`}
                      className="w-full py-2 px-4 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-center"
                    >
                      <MessageSquare size={16} />
                      Sign in to message
                    </Link>
                  )}
                </>
              )}
            </>
          )}

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

          {isOwner && !book.sold && onEdit && (
            <button
              onClick={onEdit}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Edit size={16} />
              Edit Listing
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

          {isOwner && book.sold && onMarkAsUnsold && (
            <button
              onClick={onMarkAsUnsold}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Relist Book
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
