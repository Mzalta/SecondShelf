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
        console.error('Authentication error:', sessionError)
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to upgrade your plan.' },
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
        console.error('Authentication error:', tokenError)
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to upgrade your plan.' },
          { status: 401 }
        )
      }
      
      user = userData
    }
    
    if (!user || !supabase) {
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

    // Create or retrieve Stripe customer (like task-app does)
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
      console.log('📝 Creating new Stripe customer...')
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
      
      // IMPORTANT: Store customer ID in database BEFORE redirecting to Stripe
      // This ensures the webhook can find the user even if metadata fails
      // Use a unique placeholder subscription_id per user to avoid unique constraint issues
      const placeholderSubscriptionId = `pending-${user.id}-${Date.now()}`
      
      // Check if a subscription record already exists for this user
      const { data: existingRecord } = await supabase
        .from('subscriptions')
        .select('id, stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (existingRecord) {
        // Update existing record with customer ID
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            stripe_customer_id: customerId,
            stripe_subscription_id: placeholderSubscriptionId,
            status: 'pending',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date().toISOString(),
          })
          .eq('user_id', user.id)
        
        if (updateError) {
          console.error('Error updating subscription with customer ID:', updateError)
          // Continue anyway - metadata will help webhook find the user
        } else {
          console.log(`✅ Updated existing subscription record with customer ID: ${customerId}`)
        }
      } else {
        // Create new placeholder record
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: placeholderSubscriptionId,
            status: 'pending',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date().toISOString(),
          })
        
        if (insertError) {
          console.error('Error storing customer ID:', insertError)
          // Continue anyway - metadata will help webhook find the user
        } else {
          console.log(`✅ Created placeholder subscription record with customer ID: ${customerId}`)
        }
      }
      
      console.log(`✅ Created and stored Stripe customer: ${customerId}`)
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

