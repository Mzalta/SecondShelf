import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/isPro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/unread-count
 * Get total unread messages count across all conversations for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json(
        { unread_count: 0 }
      )
    }

    // Get all conversations for this user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

    if (convError || !conversations || conversations.length === 0) {
      return NextResponse.json({
        unread_count: 0,
      })
    }

    // Count unread messages across all conversations
    const conversationIds = conversations.map(c => c.id)
    
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null)

    if (countError) {
      console.error('Error counting unread messages:', countError)
      return NextResponse.json({
        unread_count: 0,
      })
    }

    return NextResponse.json({
      unread_count: count || 0,
    })
  } catch (error: any) {
    console.error('Error in unread count API:', error)
    return NextResponse.json({
      unread_count: 0,
    })
  }
}

