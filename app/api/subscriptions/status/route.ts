import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Ensure this route runs on Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/subscriptions/status
 * Get subscription status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header (like task-app does)
    const authHeader = request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
    
    let user = null
    let supabase = null
    
    if (!accessToken) {
      // Fallback to cookie-based authentication
      supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        console.error('Authentication error (cookie-based):', sessionError)
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to view your subscription status.' },
          { status: 401 }
        )
      }
      user = session.user
    } else {
      // Use Authorization header token (more reliable, like task-app)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
          { error: 'Supabase configuration is missing' },
          { status: 500 }
        )
      }
      
      supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
      
      const { data: { user: userData }, error: tokenError } = await supabase.auth.getUser()
      
      if (tokenError || !userData) {
        console.error('Authentication error (token-based):', tokenError)
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to view your subscription status.' },
          { status: 401 }
        )
      }
      
      user = userData
    }
    
    if (!user || !supabase) {
      console.error('No user or supabase client available')
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your subscription status.' },
        { status: 401 }
      )
    }
    
    console.log(`🔎 Authenticated user for subscription status: ${user.id}`)

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

