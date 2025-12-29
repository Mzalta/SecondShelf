import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/isPro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/[conversation_id]
 * Get messages in a conversation (paginated)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversation_id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const conversationId = params.conversation_id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify user is participant in conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, listing_id, books:listing_id(id, title, image_url)')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      )
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, content, created_at, sender_id, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Get other participant info (if profiles table exists)
    const otherUserId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id
    let otherUser = null
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single()
      otherUser = data
    } catch (err) {
      // Profiles table might not exist, that's okay
      console.log('Profiles table not found or error fetching profile:', err)
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        listing: conversation.books,
        other_user: otherUser || {
          id: otherUserId,
          username: null,
          full_name: null,
          avatar_url: null,
        },
      },
      messages: messages || [],
      has_more: (messages?.length || 0) === limit,
    })
  } catch (error: any) {
    console.error('Error in get conversation messages API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

