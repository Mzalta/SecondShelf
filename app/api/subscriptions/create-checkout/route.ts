import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Ensure this route runs on Node.js runtime (required for Stripe)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/subscriptions/create-checkout
 * Creates a Stripe Checkout Session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe client lazily (only when route is called, not during build)
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing from environment variables')
      return NextResponse.json(
        { error: 'Stripe secret key is not configured. Please check your environment variables and restart the server.' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Try to get access token from Authorization header first (more reliable)
    const authHeader = request.headers.get('Authorization')
    let user = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1]
      // Create a client with the access token in global headers
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabaseWithToken = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
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
        
        const { data: { user: userData }, error: tokenError } = await supabaseWithToken.auth.getUser()
        if (!tokenError && userData) {
          user = userData
        }
      }
    }
    
    // Fallback to cookie-based authentication
    if (!user) {
      const supabase = createClient()
      
      // Try to get session first (works better with cookies)
      const {
        data: { session: authSession },
        error: sessionError,
      } = await supabase.auth.getSession()
      
      // If no session, try getUser
      user = authSession?.user
      if (!user) {
        const {
          data: { user: userData },
          error: authError,
        } = await supabase.auth.getUser()
        
        if (authError || !userData) {
          console.error('Authentication error:', authError || sessionError)
          return NextResponse.json(
            { error: 'Unauthorized. Please sign in to upgrade your plan.' },
            { status: 401 }
          )
        }
        
        user = userData
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to upgrade your plan.' },
        { status: 401 }
      )
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // Get price ID from environment
    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      console.error('STRIPE_PRICE_ID is missing from environment variables')
      return NextResponse.json(
        { error: 'STRIPE_PRICE_ID is not configured. Please check your environment variables and restart the server.' },
        { status: 500 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId: string
    
    // Check if user already has a customer ID in any subscription record
    const { data: existingSub, error: subQueryError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id
    } else {
      // Create new Stripe customer with user_id in metadata
      // This ensures the webhook can find the user even if customer_id isn't in DB yet
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
      // Note: Customer ID will be saved to DB when subscription is created via webhook
      // The user_id is stored in Stripe customer metadata as a fallback
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin') || 'http://localhost:3000'}/subscription?success=true`,
      cancel_url: `${request.headers.get('origin') || 'http://localhost:3000'}/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

