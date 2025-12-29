import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserPro, getUserId } from '@/lib/auth/isPro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/messages/[conversation_id]/send
 * Send a message in a conversation
 * Requires: user must be Pro and participant in conversation
 */
export async function POST(
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

    // Check if user is Pro
    const isPro = await isUserPro()
    if (!isPro) {
      return NextResponse.json(
        { error: 'You must have a Pro subscription to send messages. Please upgrade to Pro.' },
        { status: 403 }
      )
    }

    const conversationId = params.conversation_id

    // Verify user is participant in conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
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

    // Parse request body
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
      })
      .select('id, content, created_at, sender_id')
      .single()

    if (insertError) {
      console.error('Error sending message:', insertError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        sender_id: message.sender_id,
      },
    })
  } catch (error: any) {
    console.error('Error in send message API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

