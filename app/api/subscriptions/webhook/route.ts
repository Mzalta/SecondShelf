import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { upsertSubscriptionFromStripe, getUserIdFromCustomer } from '@/lib/stripe/subscriptions'

// Disable body parsing for webhook route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Log webhook failure to database for monitoring
 */
async function logWebhookFailure(
  eventId: string | undefined,
  eventType: string,
  error: Error | string,
  supabaseAdmin: SupabaseClient<any>
) {
  try {
    await supabaseAdmin.from('webhook_failures').insert({
      event_id: eventId,
      event_type: eventType,
      error: typeof error === 'string' ? error : error.message,
    })
    console.error(`❌ Logged webhook failure: event=${eventId}, type=${eventType}`)
  } catch (logError) {
    console.error('Failed to log webhook failure:', logError)
  }
}

/**
 * POST /api/subscriptions/webhook
 * Handles Stripe webhook events for subscriptions
 * Stripe is the source of truth - all subscription state comes from Stripe
 */
export async function POST(request: NextRequest) {
  // Initialize clients lazily (only when route is called, not during build)
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe configuration is missing' },
      { status: 500 }
    )
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Supabase configuration is missing' },
      { status: 500 }
    )
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  // Initialize Supabase admin client for webhook (bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    console.log(`📥 Received webhook event: ${event.type}, id: ${event.id}`)
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, stripe, supabaseAdmin, event.id)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription, supabaseAdmin, stripe, event.id)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabaseAdmin, stripe, event.id)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`❌ Error processing webhook event ${event.id} (${event.type}):`, error)
    
    // Log failure to database for monitoring
    await logWebhookFailure(event.id, event.type, error, supabaseAdmin)
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed event
 * User lookup order: session.metadata.user_id > customer.metadata > subscriptions table
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabaseAdmin: SupabaseClient<any>,
  eventId: string
) {
  if (session.mode !== 'subscription' || !session.subscription) {
    console.log('Skipping checkout.session.completed - not a subscription or no subscription ID')
    return
  }

  console.log(`🛒 Processing checkout.session.completed for session: ${session.id}, subscription: ${session.subscription}`)

  // User lookup order: session metadata > customer metadata > subscriptions table
  let userId = session.metadata?.user_id as string | undefined
  
  if (!userId && session.customer) {
    userId = await getUserIdFromCustomer(session.customer as string, stripe, supabaseAdmin) || undefined
  }

  if (!userId) {
    const error = new Error(`Cannot process checkout.session.completed: No user_id found for customer ${session.customer}`)
    console.error('❌', error.message)
    console.error('Session customer:', session.customer)
    console.error('Session metadata:', session.metadata)
    throw error
  }

  // Fetch full subscription from Stripe (source of truth)
  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
      { expand: ['customer'] }
    )
    console.log(`📋 Retrieved subscription from Stripe: ${subscription.id}, status: ${subscription.status}`)
  } catch (error) {
    console.error('Error retrieving subscription from Stripe:', error)
    throw error
  }

  // Upsert using canonical helper (idempotent)
  try {
    await upsertSubscriptionFromStripe(subscription, userId, supabaseAdmin)
    console.log(`✅ Checkout completed and subscription synced: ${subscription.id}, status: ${subscription.status}, user: ${userId}`)
  } catch (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }
}

/**
 * Handle customer.subscription.created and customer.subscription.updated events
 * User lookup order: customer.metadata > subscriptions table
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient<any>,
  stripe: Stripe,
  eventId: string
) {
  console.log(`🔄 Processing ${eventId} for subscription: ${subscription.id}, status: ${subscription.status}`)

  // User lookup order: customer metadata > subscriptions table
  let userId: string | null = null
  
  if (subscription.customer) {
    userId = await getUserIdFromCustomer(subscription.customer as string, stripe, supabaseAdmin)
  }

  if (!userId) {
    console.error(`⚠️ Subscription ${subscription.id} not found in database and no user_id in customer metadata`)
    console.error('Customer:', subscription.customer)
    // Don't throw - just log and skip (webhook may be for a subscription we don't manage)
    return
  }

  // Fetch full subscription from Stripe to ensure we have latest state
  let fullSubscription: Stripe.Subscription
  try {
    fullSubscription = await stripe.subscriptions.retrieve(subscription.id)
  } catch (error) {
    console.error('Error retrieving full subscription from Stripe:', error)
    // Use the subscription from the event if retrieval fails
    fullSubscription = subscription
  }

  // Upsert using canonical helper (idempotent)
  await upsertSubscriptionFromStripe(fullSubscription, userId, supabaseAdmin)
  console.log(`✅ Subscription synced: ${fullSubscription.id}, status: ${fullSubscription.status}, user: ${userId}`)
}

/**
 * Handle customer.subscription.deleted event
 * Fetch final state from Stripe before marking as canceled
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient<any>,
  stripe: Stripe,
  eventId: string
) {
  console.log(`🗑️ Processing customer.subscription.deleted for subscription: ${subscription.id}`)

  // Fetch subscription from Stripe to get final state (it may have expandable fields)
  let fullSubscription: Stripe.Subscription
  try {
    fullSubscription = await stripe.subscriptions.retrieve(subscription.id)
  } catch (error) {
    // If subscription is already deleted, Stripe may return 404
    // Use the subscription from the event
    console.log('Subscription already deleted in Stripe, using event data')
    fullSubscription = subscription
  }

  // User lookup: subscriptions table > customer metadata
  let userId: string | null = null
  
  // Try by subscription ID first
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', fullSubscription.id)
    .maybeSingle()

  userId = existingSub?.user_id || null

  // If not found, try by customer ID
  if (!userId && fullSubscription.customer) {
    userId = await getUserIdFromCustomer(fullSubscription.customer as string, stripe, supabaseAdmin)
  }

  if (!userId) {
    console.error(`⚠️ Cannot find user_id for deleted subscription: ${fullSubscription.id}`)
    // Still update status by subscription ID if we can
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', fullSubscription.id)
    
    console.log(`✅ Updated subscription status to canceled: ${fullSubscription.id}`)
    return
  }

  // Update using canonical helper (status will be 'canceled')
  await upsertSubscriptionFromStripe(fullSubscription, userId, supabaseAdmin)
  console.log(`✅ Subscription deleted and synced: ${fullSubscription.id}, user: ${userId}`)
}
