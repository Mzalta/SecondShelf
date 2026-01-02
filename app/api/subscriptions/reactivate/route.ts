import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { upsertSubscriptionFromStripe } from '@/lib/stripe/subscriptions'
import { cookies } from 'next/headers'

// Ensure this route runs on Node.js runtime (required for Stripe)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/subscriptions/reactivate
 * Reactivate user's subscription by removing the cancellation at period end.
 * Preserves the original period end date so the subscription continues from when
 * it was supposed to end, not from the reactivation date.
 */
export async function POST(request: NextRequest) {
  let subscription: any = null // Declare subscription in outer scope for error handling
  
  try {
    // Debug: Log cookies to verify they're being sent
    const allCookies = cookies().getAll()
    console.log('Auth cookies:', allCookies.map(c => c.name).filter(name => name.includes('sb-') || name.includes('auth')))

    // Initialize Stripe client
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured' },
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
        { error: 'Unauthorized. Please sign in to reactivate your subscription.' },
        { status: 401 }
      )
    }

    console.log(`🔎 Authenticated user for reactivate: ${user.id}`)

    // Get user's subscription with original period end date
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, current_period_end')
      .eq('user_id', user.id)
      .single()
    
    subscription = subscriptionData // Assign to outer scope variable

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Get the original period end date from our database (when subscription was supposed to end)
    // Validate that current_period_end exists and is valid
    if (!subscription.current_period_end) {
      return NextResponse.json(
        { error: 'Subscription period end date is missing' },
        { status: 400 }
      )
    }

    const originalPeriodEnd = new Date(subscription.current_period_end)
    
    // Check if the date is valid
    if (isNaN(originalPeriodEnd.getTime())) {
      console.error(`Invalid period end date from database: ${subscription.current_period_end}`)
      return NextResponse.json(
        { error: 'Invalid subscription period end date' },
        { status: 400 }
      )
    }

    const originalPeriodEndTimestamp = Math.floor(originalPeriodEnd.getTime() / 1000)
    const now = new Date()

    // Get the Stripe subscription first to check its current state
    const stripeSubscriptionBefore = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    console.log(`📅 Original period end from DB: ${originalPeriodEnd.toISOString()} (${originalPeriodEndTimestamp})`)
    // Access current_period_end using bracket notation to avoid TypeScript conflict with local Subscription type
    const stripeSubscriptionAny = stripeSubscriptionBefore as any
    const stripePeriodEnd = stripeSubscriptionAny.current_period_end
    
    // Log the subscription object to debug
    console.log(`🔍 Stripe subscription data:`, {
      id: stripeSubscriptionAny.id,
      status: stripeSubscriptionAny.status,
      current_period_end: stripePeriodEnd,
      current_period_end_type: typeof stripePeriodEnd,
      has_current_period_end: 'current_period_end' in stripeSubscriptionAny,
    })
    
    // Validate Stripe period end is valid
    // current_period_end should be a number (Unix timestamp in seconds)
    if (stripePeriodEnd === undefined || stripePeriodEnd === null) {
      console.error(`Stripe subscription missing current_period_end property`)
      console.error(`Available keys:`, Object.keys(stripeSubscriptionAny))
      return NextResponse.json(
        { error: 'Subscription data from Stripe is missing period end date' },
        { status: 500 }
      )
    }
    
    const stripePeriodEndNum = typeof stripePeriodEnd === 'number' ? stripePeriodEnd : Number(stripePeriodEnd)
    
    if (isNaN(stripePeriodEndNum) || stripePeriodEndNum <= 0) {
      console.error(`Invalid Stripe period end value: ${stripePeriodEnd} (type: ${typeof stripePeriodEnd})`)
      return NextResponse.json(
        { error: 'Invalid subscription period end date from Stripe' },
        { status: 500 }
      )
    }
    
    console.log(`📅 Stripe period end before update: ${new Date(stripePeriodEndNum * 1000).toISOString()} (${stripePeriodEndNum})`)

    // Prepare update options
    const updateOptions: Stripe.SubscriptionUpdateParams = {
      cancel_at_period_end: false,
    }

    // If the original period end is in the future, we need to preserve it.
    // If Stripe's period end already differs from our original, we'll try to fix it.
    // Note: We can't directly set current_period_end in Stripe, but we can try using
    // billing_cycle_anchor. However, this may not always work as expected.
    if (originalPeriodEnd > now) {
      if (stripePeriodEndNum !== originalPeriodEndTimestamp) {
        // Stripe's period end is different from our original - this shouldn't happen if cancel_at_period_end was true
        // Try to fix it by setting billing_cycle_anchor to the original period end
        // This tells Stripe when the next billing cycle should start, which should make the current period end at that time
        // billing_cycle_anchor accepts number (Unix timestamp) or 'now' | 'unchanged'
        updateOptions.billing_cycle_anchor = originalPeriodEndTimestamp as unknown as Stripe.SubscriptionUpdateParams.BillingCycleAnchor
        updateOptions.proration_behavior = 'none' // Don't prorate, just preserve the date
        console.log(`🔧 Stripe period end (${stripePeriodEndNum}) differs from original (${originalPeriodEndTimestamp})`)
        console.log(`🔧 Setting billing_cycle_anchor to ${originalPeriodEnd.toISOString()} to try to preserve original period end`)
      } else {
        // Stripe's period end matches our original - just remove cancel_at_period_end
        // Stripe should preserve the current_period_end when we do this
        console.log(`✅ Stripe period end matches original (${originalPeriodEnd.toISOString()}), removing cancel_at_period_end should preserve it`)
      }
    }

    // Reactivate subscription by removing cancellation at period end
    // If billing_cycle_anchor was set, it will preserve the original period end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      updateOptions
    )

    // Access current_period_end using bracket notation to avoid TypeScript conflict
    const updatedSubscriptionAny = updatedSubscription as any
    const updatedPeriodEndRaw = updatedSubscriptionAny.current_period_end
    
    // Validate updated period end is valid
    if (updatedPeriodEndRaw === undefined || updatedPeriodEndRaw === null) {
      console.error(`Stripe subscription missing current_period_end after update`)
      return NextResponse.json(
        { error: 'Subscription data from Stripe is missing period end date after update' },
        { status: 500 }
      )
    }
    
    const updatedPeriodEnd = typeof updatedPeriodEndRaw === 'number' ? updatedPeriodEndRaw : Number(updatedPeriodEndRaw)
    
    if (isNaN(updatedPeriodEnd) || updatedPeriodEnd <= 0) {
      console.error(`Invalid updated period end value: ${updatedPeriodEndRaw} (type: ${typeof updatedPeriodEndRaw})`)
      return NextResponse.json(
        { error: 'Invalid subscription period end date from Stripe after update' },
        { status: 500 }
      )
    }
    
    console.log(`📅 Stripe period end after update: ${new Date(updatedPeriodEnd * 1000).toISOString()} (${updatedPeriodEnd})`)

    // If Stripe still changed the period end despite our billing_cycle_anchor, we'll preserve it in the database
    // This is a fallback in case billing_cycle_anchor doesn't work as expected
    const stripeChangedPeriod = originalPeriodEnd > now && updatedPeriodEnd !== originalPeriodEndTimestamp
    if (stripeChangedPeriod) {
      console.log(`⚠️ Stripe changed period end to ${updatedPeriodEnd}, but original was ${originalPeriodEndTimestamp}`)
      console.log(`⚠️ billing_cycle_anchor may not have worked as expected, will preserve in database`)
    }

    // Sync from Stripe using canonical helper (ensures consistency)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
      await upsertSubscriptionFromStripe(updatedSubscription, user.id, supabaseAdmin)
      
      // After syncing from Stripe, check if we need to preserve the original period end date
      // This is a fallback in case Stripe changed it despite our billing_cycle_anchor setting
      if (originalPeriodEnd > now) {
        // Only preserve if the original period hasn't ended yet
        const { data: syncedSub } = await supabaseAdmin
          .from('subscriptions')
          .select('current_period_end')
          .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          .single()
        
        const syncedPeriodEnd = syncedSub && syncedSub.current_period_end 
          ? new Date(syncedSub.current_period_end) 
          : null
        
        // Validate synced period end if it exists
        if (syncedPeriodEnd && isNaN(syncedPeriodEnd.getTime())) {
          console.error(`Invalid synced period end: ${syncedSub?.current_period_end}`)
          // Continue without the fallback update
        } else if (syncedPeriodEnd && syncedPeriodEnd.getTime() !== originalPeriodEnd.getTime()) {
          // If Stripe's period end is different from the original, preserve the original in our database
          // Note: This is a fallback. Ideally, Stripe should have the correct value after billing_cycle_anchor
          await supabaseAdmin
            .from('subscriptions')
            .update({
              current_period_end: originalPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          console.log(`✅ Preserved original period end date in database (fallback): ${originalPeriodEnd.toISOString()} (Stripe had: ${syncedPeriodEnd.toISOString()})`)
          console.log(`⚠️ Note: Stripe webhooks may overwrite this. Consider checking why billing_cycle_anchor didn't preserve the period end.`)
        } else {
          console.log(`✅ Period end dates match: ${originalPeriodEnd.toISOString()}`)
        }
      }
      
      console.log(`✅ Subscription reactivation synced from Stripe: ${updatedSubscription.id}`)
    } else {
      // Fallback: update database directly (shouldn't happen in production)
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          // Preserve original period end if it's in the future
          ...(originalPeriodEnd > now ? { current_period_end: originalPeriodEnd.toISOString() } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.stripe_subscription_id)
    }

    return NextResponse.json({
      message: 'Subscription has been reactivated successfully',
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
    })
  } catch (error: any) {
    console.error('Error reactivating subscription:', error)
    console.error('Error stack:', error.stack)
    
    // Check if it's a date-related error
    const errorMessage = error.message || ''
    if (errorMessage.includes('Invalid Time') || errorMessage.includes('Invalid date') || errorMessage.includes('toISOString')) {
      console.error('Date parsing error detected. Subscription data:', {
        current_period_end: subscription?.current_period_end,
        stripe_subscription_id: subscription?.stripe_subscription_id,
      })
      return NextResponse.json(
        { error: 'Invalid date value in subscription data. Please contact support.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}

