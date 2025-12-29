import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserPro, getUserId } from '@/lib/auth/isPro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/messages/start
 * Start a new conversation (or return existing) between authenticated buyer and seller for a given listing_id
 * Requires: user must be Pro
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { listing_id } = body

    if (!listing_id) {
      return NextResponse.json(
        { error: 'listing_id is required' },
        { status: 400 }
      )
    }

    // Verify listing exists and get seller_id
    const { data: listing, error: listingError } = await supabase
      .from('books')
      .select('user_id, title')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    const sellerId = listing.user_id
    if (!sellerId) {
      return NextResponse.json(
        { error: 'Listing has no seller' },
        { status: 400 }
      )
    }

    // Prevent users from messaging themselves
    if (userId === sellerId) {
      return NextResponse.json(
        { error: 'You cannot message yourself' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const { data: existingConversation, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', userId)
      .single()

    if (existingConversation) {
      return NextResponse.json({
        conversation_id: existingConversation.id,
        created: false,
      })
    }

    // Create new conversation
    const { data: conversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        listing_id,
        buyer_id: userId,
        seller_id: sellerId,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating conversation:', insertError)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      conversation_id: conversation.id,
      created: true,
    })
  } catch (error: any) {
    console.error('Error in start conversation API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

