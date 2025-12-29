'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Clock } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { getCurrentUser } from '@/lib/auth/auth'
import { createBrowserClient } from '@/lib/supabase/browser'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  read_at: string | null
}

interface ConversationData {
  conversation: {
    id: string
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
    }
  }
  messages: Message[]
  has_more: boolean
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversation_id as string
  const [conversationData, setConversationData] = useState<ConversationData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messageContent, setMessageContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser()
      setCurrentUser(user)

      if (!user) {
        router.push('/')
        return
      }

      if (!conversationId) {
        setError('Conversation ID is required')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/messages/${conversationId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load conversation')
        }

        const data = await response.json()
        setConversationData(data)
        // Reverse messages to show oldest first
        setMessages([...data.messages].reverse())

        // Mark messages as read
        await fetch(`/api/messages/${conversationId}/read`, {
          method: 'PATCH',
          credentials: 'include',
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Set up Realtime subscription
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
          
          // Mark as read if message is not from current user
          if (newMessage.sender_id !== currentUser?.id) {
            await fetch(`/api/messages/${conversationId}/read`, {
              method: 'PATCH',
              credentials: 'include',
            })
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, router, currentUser?.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!messageContent.trim() || sending) return

    const content = messageContent.trim()
    setMessageContent('')
    setSending(true)

    try {
      const response = await fetch(`/api/messages/${conversationId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 403) {
          router.push('/subscription')
        } else {
          throw new Error(data.error || 'Failed to send message')
        }
        return
      }

      // Message will be added via Realtime subscription
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
      setMessageContent(content) // Restore message content on error
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getDisplayName = (user: ConversationData['conversation']['other_user']) => {
    return user.full_name || user.username || 'User'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Loading />
      </div>
    )
  }

  if (error || !conversationData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Messages
        </Link>
        <ErrorDisplay
          error={error || 'Conversation not found'}
          onDismiss={() => router.push('/messages')}
          autoDismiss={false}
        />
      </div>
    )
  }

  const { conversation } = conversationData

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
        <Link
          href="/messages"
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          {conversation.other_user.avatar_url ? (
            <img
              src={conversation.other_user.avatar_url}
              alt={getDisplayName(conversation.other_user)}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-semibold">
                {getDisplayName(conversation.other_user).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {getDisplayName(conversation.other_user)}
            </h1>
            {conversation.listing && (
              <p className="text-sm text-gray-600">{conversation.listing.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUser?.id
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs ${
                      isOwn ? 'text-purple-100' : 'text-gray-500'
                    }`}
                  >
                    <Clock size={10} />
                    <span>{formatTime(message.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!messageContent.trim() || sending}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send size={18} />
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          autoDismiss={true}
        />
      )}
    </div>
  )
}

