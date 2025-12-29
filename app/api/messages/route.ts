import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/isPro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/messages
 * Get list of user's conversations with last message preview, unread count, and participant info
 */
export async function GET(request: NextRequest) {
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

    // Get all conversations for this user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        listing_id,
        buyer_id,
        seller_id,
        books:listing_id (
          id,
          title,
          image_url
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (convError) {
      console.error('Error fetching conversations:', convError)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // For each conversation, get the last message and unread count
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get unread count (messages not sent by current user that haven't been read)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null)

        // Determine the other participant
        const otherUserId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id
        
        // Get other participant's profile info (if profiles table exists)
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

        return {
          id: conv.id,
          created_at: conv.created_at,
          listing: conv.books,
          other_user: otherUser || {
            id: otherUserId,
            username: null,
            full_name: null,
            avatar_url: null,
          },
          last_message: lastMessage || null,
          unread_count: unreadCount || 0,
        }
      })
    )

    return NextResponse.json({
      conversations: conversationsWithDetails,
    })
  } catch (error: any) {
    console.error('Error in get messages API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

