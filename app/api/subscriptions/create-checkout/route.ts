import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/subscriptions/create-checkout
 * Creates a Stripe Checkout Session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe client lazily (only when route is called, not during build)
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const supabase = createClient()
    
    // Try to get session first (works better with cookies)
    const {
      data: { session: authSession },
      error: sessionError,
    } = await supabase.auth.getSession()
    
    // If no session, try getUser
    let user = authSession?.user
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
      return NextResponse.json(
        { error: 'STRIPE_PRICE_ID is not configured' },
        { status: 500 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId: string
    
    // Check if user already has a customer ID
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single()

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
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

