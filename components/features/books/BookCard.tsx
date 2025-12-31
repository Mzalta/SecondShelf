'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Book } from '@/types'
import Button from '@/components/ui/Button'
import { Heart, HeartOff, ShoppingBag, Trash2, Mail, Phone, Edit, MessageSquare, BookOpen } from 'lucide-react'
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

  // Generate a subtle gradient based on book title hash for uniqueness
  const getGradientForBook = (title: string) => {
    const gradients = [
      'from-blue-50 via-indigo-50 to-purple-50',
      'from-teal-50 via-cyan-50 to-blue-50',
      'from-purple-50 via-pink-50 to-rose-50',
      'from-amber-50 via-orange-50 to-red-50',
      'from-emerald-50 via-teal-50 to-cyan-50',
      'from-violet-50 via-purple-50 to-fuchsia-50',
    ]
    let hash = 0
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash)
    }
    return gradients[Math.abs(hash) % gradients.length]
  }

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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-purple-300 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
      {/* Image Container with Enhanced Styling */}
      <Link href={book.id ? `/listings/${book.id}` : '#'}>
        <div className={`w-full h-72 bg-gradient-to-br ${getGradientForBook(book.title)} relative overflow-hidden`}>
          {book.imageUrl ? (
            <>
              <img
                src={book.imageUrl}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <BookOpen className="text-7xl opacity-20 text-gray-400 mb-2" />
              <div className="text-xs text-gray-400 font-medium">No Image Available</div>
            </div>
          )}
          
          {/* Sold Overlay */}
          {book.sold && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-xl transform rotate-[-2deg]">
                SOLD
              </div>
            </div>
          )}

          {/* Category Badge - Top Left */}
          {book.category && (
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-gray-200">
                {book.category}
              </span>
            </div>
          )}

          {/* Favorite Badge - Top Right (only show when favorited) */}
          {isFavorite && !book.sold && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-purple-600 text-white p-2 rounded-full shadow-lg">
                <Heart size={16} className="fill-current" />
              </div>
            </div>
          )}

          {/* Condition Badge - if available */}
          {book.condition_text && (
            <div className="absolute bottom-3 left-3 z-10">
              <span className="bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm border border-gray-200">
                {book.condition_text}
              </span>
            </div>
          )}

          {/* Edition Badge - if available */}
          {book.edition && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm border border-gray-200">
                {book.edition}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-5">
        {/* Title */}
        <Link href={book.id ? `/listings/${book.id}` : '#'}>
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-purple-600 transition-colors cursor-pointer leading-tight">
            {book.title}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-sm text-gray-600 mb-3 font-medium">by {book.author}</p>

        {/* Course Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            <BookOpen size={12} />
            {book.course}
          </span>
        </div>

        {/* Price Section - More Prominent */}
        <div className="mb-4 pb-4 border-b-2 border-gray-100">
          <div className="flex items-baseline gap-2">
            {isPrice ? (
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{book.price}</span>
            ) : (
              <span className="text-xl font-bold text-gray-900">{book.price}</span>
            )}
          </div>
        </div>

        {/* Seller Info Section */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {book.contact.includes('@') ? (
              <Mail size={16} className="text-purple-500 flex-shrink-0" />
            ) : (
              <Phone size={16} className="text-purple-500 flex-shrink-0" />
            )}
            <span className="truncate font-medium">{book.contact}</span>
          </div>
          {book.poster && (
            <p className="text-xs text-gray-500 font-medium">Seller: <span className="text-gray-700">{book.poster}</span></p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {!book.sold && !isOwner && (
            <>
              {/* Message Button - only show if not owner */}
              {!loading && !proLoading && (
                <>
                  {currentUser && isPro ? (
                    <button
                      onClick={handleMessageClick}
                      disabled={messageLoading}
                      className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <MessageSquare size={16} />
                      {messageLoading ? 'Starting...' : 'Message Seller'}
                    </button>
                  ) : currentUser && !isPro ? (
                    <Link
                      href="/subscription"
                      className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 text-center shadow-sm hover:shadow-md"
                    >
                      <MessageSquare size={16} />
                      Upgrade to Pro to message
                    </Link>
                  ) : (
                    <Link
                      href={`/auth/callback?returnTo=${encodeURIComponent(window.location.pathname)}`}
                      className="w-full py-2.5 px-4 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-center shadow-sm hover:shadow-md"
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
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${
                isFavorite
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 hover:from-amber-500 hover:to-amber-600'
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
              className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <Edit size={16} />
              Edit Listing
            </button>
          )}

          {isOwner && !book.sold && onMarkAsSold && (
            <button
              onClick={onMarkAsSold}
              className="w-full py-2.5 px-4 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <ShoppingBag size={16} />
              Mark as Sold
            </button>
          )}

          {isOwner && book.sold && onMarkAsUnsold && (
            <button
              onClick={onMarkAsUnsold}
              className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
              className="w-full py-2.5 px-4 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
