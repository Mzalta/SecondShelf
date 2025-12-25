import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Ensure this route runs on Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/subscriptions/status
 * Get subscription status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Try to get session first (works better with cookies)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    
    // If no session, try getUser
    let user = session?.user
    if (!user) {
      const {
        data: { user: userData },
        error: authError,
      } = await supabase.auth.getUser()
      
      if (authError || !userData) {
        console.error('Authentication error:', authError || sessionError)
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to view your subscription status.' },
          { status: 401 }
        )
      }
      
      user = userData
    }

    // Get user's subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error fetching subscription:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    // Check if subscription is active
    const isActive = subscription 
      && ['active', 'trialing'].includes(subscription.status)
      && new Date(subscription.current_period_end) > new Date()

    return NextResponse.json({
      subscription: subscription || null,
      isActive: !!isActive,
      isPro: !!isActive,
    })
  } catch (error: any) {
    console.error('Error in subscription status API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

