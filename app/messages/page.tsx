'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Clock, Lock } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { getCurrentUser } from '@/lib/auth/auth'
import { useProStatus } from '@/lib/hooks/useProStatus'
import Button from '@/components/ui/Button'

interface Conversation {
  id: string
  created_at: string
  listing: {
    id: string
    title: string
    image_url: string | null
  } | null
  other_user: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    email?: string | null
  }
  last_message: {
    id: string
    content: string
    created_at: string
    sender_id: string
  } | null
  unread_count: number
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { isPro, loading: proLoading } = useProStatus()

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser()
      setCurrentUser(user)

      if (!user) {
        router.push('/')
        return
      }

      // Only load conversations if user is Pro
      if (!proLoading && isPro) {
        try {
          const response = await fetch('/api/messages', {
            credentials: 'include',
          })

          if (!response.ok) {
            throw new Error('Failed to load conversations')
          }

          const data = await response.json()
          setConversations(data.conversations || [])
        } catch (err: any) {
          setError(err.message || 'Failed to load conversations')
        } finally {
          setLoading(false)
        }
      } else if (!proLoading && !isPro) {
        setLoading(false)
      }
    }

    loadData()
  }, [router, isPro, proLoading])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getDisplayName = (user: Conversation['other_user']) => {
    return user.full_name || user.username || user.email || 'User'
  }

  if (loading || proLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <Loading />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your messages.</p>
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  // Show Pro-only message if user is not Pro
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Lock size={48} className="mx-auto text-purple-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pro Feature</h2>
          <p className="text-gray-600 mb-6">
            Messaging is only available to Pro subscribers. Upgrade to Pro to start messaging sellers and buyers.
          </p>
          <Link href="/subscription">
            <Button variant="primary" className="inline-flex">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          autoDismiss={true}
        />
      )}

      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
          <p className="text-gray-600">
            Start a conversation by messaging a seller from a book listing.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {conv.other_user.avatar_url ? (
                    <img
                      src={conv.other_user.avatar_url}
                      alt={getDisplayName(conv.other_user)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-lg">
                        {getDisplayName(conv.other_user).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {getDisplayName(conv.other_user)}
                        </h3>
                        {conv.unread_count > 0 && (
                          <span className="flex-shrink-0 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      {conv.listing && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conv.listing.title}
                        </p>
                      )}
                      {conv.last_message && (
                        <p className="text-sm text-gray-500 truncate">
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                    {conv.last_message && (
                      <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{formatTime(conv.last_message.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

