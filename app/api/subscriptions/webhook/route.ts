import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
  supabaseAdmin: SupabaseClient<any>
) {
  if (session.mode !== 'subscription' || !session.subscription) {
    return
  }

  // Try to get user_id from session metadata first
  let userId = session.metadata?.user_id
  
  // If not in metadata, try to get it from Stripe customer metadata
  if (!userId && session.customer) {
    try {
      const customer = await stripe.customers.retrieve(session.customer as string)
      if (customer && !customer.deleted && customer.metadata?.supabase_user_id) {
        userId = customer.metadata.supabase_user_id
        console.log(`Retrieved user_id from customer metadata: ${userId}`)
      }
    } catch (error) {
      console.error('Error retrieving customer from Stripe:', error)
    }
  }
  
  // CRITICAL FIX: If still no userId, try to find user by customer_id in subscriptions table
  // This matches task-app's approach and ensures we can always find the user
  if (!userId && session.customer) {
    try {
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', session.customer as string)
        .maybeSingle()
      
      if (existingSub?.user_id) {
        userId = existingSub.user_id
        console.log(`Retrieved user_id from subscriptions table by customer_id: ${userId}`)
      }
    } catch (error) {
      console.error('Error querying subscriptions table:', error)
    }
  }

  if (!userId) {
    console.error('No user_id found in checkout session metadata, customer metadata, or subscriptions table')
    console.error('Session customer:', session.customer)
    return
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  await upsertSubscription(subscription, userId, supabaseAdmin)
  console.log(`✅ Checkout completed and subscription updated for user: ${userId}, subscription: ${subscription.id}, status: ${subscription.status}`)
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient<any>,
  stripe: Stripe
) {
  // Try to find user by customer ID in database first (like task-app does)
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer as string)
    .maybeSingle()

  let userId = existingSub?.user_id

  // If not found in DB, try to get user_id from Stripe customer metadata
  if (!userId && subscription.customer) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string)
      if (customer && !customer.deleted && customer.metadata?.supabase_user_id) {
        userId = customer.metadata.supabase_user_id
        console.log(`Retrieved user_id from customer metadata: ${userId}`)
      }
    } catch (error) {
      console.error('Error retrieving customer from Stripe:', error)
    }
  }

  if (!userId) {
    console.error('Subscription not found in database and no user_id in customer metadata for customer:', subscription.customer)
    return
  }

  await upsertSubscription(subscription, userId, supabaseAdmin)
  console.log(`Subscription updated: ${subscription.id}`)
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient<any>
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
  supabaseAdmin: SupabaseClient<any>
) {
  // Access subscription property with type assertion for API compatibility
  const subscriptionId = (invoice as any).subscription
  
  if (!subscriptionId || typeof subscriptionId !== 'string') return

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId
  )

  // Try to find user by subscription ID in database first
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  let userId = existingSub?.user_id

  // If not found by subscription ID, try by customer ID (like task-app does)
  if (!userId && subscription.customer) {
    const { data: customerSub } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .maybeSingle()
    
    if (customerSub?.user_id) {
      userId = customerSub.user_id
      console.log(`Retrieved user_id from subscriptions table by customer_id: ${userId}`)
    }
  }

  // If still not found, try to get user_id from Stripe customer metadata
  if (!userId && subscription.customer) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string)
      if (customer && !customer.deleted && customer.metadata?.supabase_user_id) {
        userId = customer.metadata.supabase_user_id
        console.log(`Retrieved user_id from customer metadata: ${userId}`)
      }
    } catch (error) {
      console.error('Error retrieving customer from Stripe:', error)
    }
  }

  if (userId) {
    await upsertSubscription(subscription, userId, supabaseAdmin)
    console.log(`Invoice payment succeeded for subscription: ${subscription.id}`)
  } else {
    console.error('Could not find user_id for subscription:', subscription.id)
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseAdmin: SupabaseClient<any>
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
  supabaseAdmin: SupabaseClient<any>
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

  // Check if subscription exists for this user (including placeholder records)
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  const isPlaceholder = existingSub?.stripe_subscription_id?.startsWith('pending-')
  const subscriptionIdChanged = existingSub && existingSub.stripe_subscription_id !== subscription.id

  // If we have a placeholder or the subscription ID changed, we need to handle the unique constraint
  // by deleting the old record first, then inserting/updating
  if (isPlaceholder || subscriptionIdChanged) {
    // Delete any existing subscription with the new subscription_id (for safety, in case it exists)
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('stripe_subscription_id', subscription.id)

    // If there's an existing subscription for this user (placeholder or old subscription), delete it
    if (existingSub) {
      const { error: deleteError } = await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error deleting existing subscription:', deleteError)
        throw deleteError
      }
    }

    // Now insert the new subscription with the real subscription ID
    const { error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)

    if (insertError) {
      console.error('Error inserting subscription after deleting placeholder:', insertError)
      throw insertError
    }

    console.log(`✅ Successfully replaced placeholder subscription with real subscription: ${subscription.id}`)
  } else if (existingSub) {
    // Subscription exists and ID hasn't changed - just update it
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(subscriptionData)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      throw updateError
    }

    console.log(`✅ Successfully updated subscription: ${subscription.id}`)
  } else {
    // No existing subscription - insert new one
    // First, delete any subscription with this subscription_id if it exists (shouldn't happen, but safety check)
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('stripe_subscription_id', subscription.id)

    const { error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)

    if (insertError) {
      console.error('Error inserting subscription:', insertError)
      throw insertError
    }

    console.log(`✅ Successfully inserted new subscription: ${subscription.id}`)
  }
}


