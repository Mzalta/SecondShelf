import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Ensure this route is dynamic (not statically generated)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/purchases
 * Get purchase history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's purchases with book details
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        *,
        books (
          id,
          title,
          author,
          course,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching purchases:', error)
      return NextResponse.json(
        { error: 'Failed to fetch purchases' },
        { status: 500 }
      )
    }

    return NextResponse.json({ purchases: purchases || [] })
  } catch (error: any) {
    console.error('Error in purchases API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

