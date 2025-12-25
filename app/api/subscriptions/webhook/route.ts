import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Disable body parsing for webhook route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/subscriptions/webhook
 * Handles Stripe webhook events for subscriptions
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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, stripe, supabaseAdmin)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription, supabaseAdmin, stripe)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabaseAdmin)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice, stripe, supabaseAdmin)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice, supabaseAdmin)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  if (session.mode !== 'subscription' || !session.subscription) {
    return
  }

  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  await upsertSubscription(subscription, userId, supabaseAdmin)
  console.log(`Checkout completed for user: ${userId}`)
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe
) {
  // Find user by customer ID
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()

  if (!existingSub) {
    console.error('Subscription not found in database')
    return
  }

  await upsertSubscription(subscription, existingSub.user_id, supabaseAdmin)
  console.log(`Subscription updated: ${subscription.id}`)
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription status to canceled:', error)
    throw error
  }

  console.log(`Subscription canceled: ${subscription.id}`)
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  stripe: Stripe,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  // Access subscription property with type assertion for API compatibility
  const subscriptionId = (invoice as any).subscription
  
  if (!subscriptionId || typeof subscriptionId !== 'string') return

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId
  )

  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existingSub) {
    await upsertSubscription(subscription, existingSub.user_id, supabaseAdmin)
    console.log(`Invoice payment succeeded for subscription: ${subscription.id}`)
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const subscriptionId = (invoice as any).subscription
  if (!subscriptionId || typeof subscriptionId !== 'string') return

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription status to past_due:', error)
    throw error
  }

  console.log(`Invoice payment failed for subscription: ${subscriptionId}`)
}

async function upsertSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }
}

