import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Ensure this route runs on Node.js runtime (required for Stripe)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/subscriptions/create-checkout
 * Creates a Stripe Checkout Session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Debug: Log cookies to verify they're being sent
    const allCookies = cookies().getAll()
    console.log('Auth cookies:', allCookies.map(c => c.name).filter(name => name.includes('sb-') || name.includes('auth')))

    // Initialize Stripe client
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing from environment variables')
      return NextResponse.json(
        { error: 'Stripe secret key is not configured. Please check your environment variables and restart the server.' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Create Supabase server client (reads from cookies)
    const supabase = createClient()

    // Get authenticated user from cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to upgrade your plan.' },
        { status: 401 }
      )
    }

    console.log(`🔎 Authenticated user: ${user.id}`)

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
    // DO NOT create subscription row here - only create it when webhook fires
    let customerId: string
    
    // Check if user already has a customer ID in any subscription record
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id
      console.log(`✅ Found existing Stripe customer: ${customerId}`)
    } else {
      // Create new Stripe customer with user_id in metadata
      // This is the ONLY database interaction we do here - storing customer_id
      // Subscription row will be created ONLY when webhook fires
      console.log('📝 Creating new Stripe customer...')
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id, // Use user_id for consistency
          supabase_user_id: user.id, // Also include for backward compatibility
        },
      })
      customerId = customer.id
      console.log(`✅ Created Stripe customer: ${customerId} (subscription will be created via webhook)`)
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
        user_id: user.id, // Store user_id in checkout session metadata
      },
      customer_update: {
        metadata: {
          user_id: user.id, // Also ensure customer metadata has user_id
          supabase_user_id: user.id,
        },
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
