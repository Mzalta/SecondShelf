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

    // Get user's subscription with original period dates to preserve them
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, current_period_start, current_period_end')
      .eq('user_id', user.id)
      .single()
    
    subscription = subscriptionData // Assign to outer scope variable

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Get the original period dates from our database (when subscription was supposed to start and end)
    // Validate that current_period_end exists and is valid
    if (!subscription.current_period_end) {
      return NextResponse.json(
        { error: 'Subscription period end date is missing' },
        { status: 400 }
      )
    }

    const originalPeriodStart = subscription.current_period_start ? new Date(subscription.current_period_start) : null
    const originalPeriodEnd = new Date(subscription.current_period_end)
    
    // Check if the date is valid
    if (isNaN(originalPeriodEnd.getTime())) {
      console.error(`Invalid period end date from database: ${subscription.current_period_end}`)
      return NextResponse.json(
        { error: 'Invalid subscription period end date' },
        { status: 400 }
      )
    }

    // Validate period start if it exists
    if (originalPeriodStart && isNaN(originalPeriodStart.getTime())) {
      console.error(`Invalid period start date from database: ${subscription.current_period_start}`)
      return NextResponse.json(
        { error: 'Invalid subscription period start date' },
        { status: 400 }
      )
    }

    const originalPeriodEndTimestamp = Math.floor(originalPeriodEnd.getTime() / 1000)
    const now = new Date()

    // Get the Stripe subscription first to check its current state
    const stripeSubscriptionBefore = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    console.log(`📅 Original period dates from DB: ${originalPeriodStart?.toISOString()} to ${originalPeriodEnd.toISOString()} (${originalPeriodEndTimestamp})`)
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
    
    // Try to get Stripe period end, but use database value as fallback
    let stripePeriodEndNum: number | null = null
    
    if (stripePeriodEnd !== undefined && stripePeriodEnd !== null) {
      const converted = typeof stripePeriodEnd === 'number' ? stripePeriodEnd : Number(stripePeriodEnd)
      if (!isNaN(converted) && converted > 0) {
        stripePeriodEndNum = converted
        console.log(`📅 Stripe period end before update: ${new Date(stripePeriodEndNum * 1000).toISOString()} (${stripePeriodEndNum})`)
      } else {
        console.warn(`⚠️ Stripe period end value is invalid: ${stripePeriodEnd}, will use database value`)
      }
    } else {
      console.warn(`⚠️ Stripe subscription missing current_period_end property, will use database value`)
      console.log(`Available keys:`, Object.keys(stripeSubscriptionAny).slice(0, 20)) // Log first 20 keys
    }
    
    // Use database value if Stripe value is not available
    if (stripePeriodEndNum === null) {
      console.log(`📅 Using database period end value: ${originalPeriodEnd.toISOString()} (${originalPeriodEndTimestamp})`)
      stripePeriodEndNum = originalPeriodEndTimestamp
    }

    // Prepare update options
    const updateOptions: Stripe.SubscriptionUpdateParams = {
      cancel_at_period_end: false,
    }

    // If the original period end is in the future, we need to preserve it.
    // Note: When updating an existing subscription, billing_cycle_anchor can only be
    // 'now', 'unchanged', or unset. We cannot set it to a timestamp for existing subscriptions.
    // Stripe will preserve the current period end when we remove cancel_at_period_end.
    if (originalPeriodEnd > now) {
      // Set proration_behavior to 'none' to avoid prorating charges
      updateOptions.proration_behavior = 'none'
      
      const stripePeriodEndFromStripe = (stripeSubscriptionAny.current_period_end !== undefined && stripeSubscriptionAny.current_period_end !== null)
        ? (typeof stripeSubscriptionAny.current_period_end === 'number' ? stripeSubscriptionAny.current_period_end : Number(stripeSubscriptionAny.current_period_end))
        : null
      
      if (stripePeriodEndFromStripe !== null && !isNaN(stripePeriodEndFromStripe) && stripePeriodEndFromStripe > 0) {
        if (stripePeriodEndFromStripe !== originalPeriodEndTimestamp) {
          console.log(`🔧 Stripe period end (${stripePeriodEndFromStripe}) differs from original (${originalPeriodEndTimestamp})`)
          console.log(`🔧 Removing cancel_at_period_end should preserve Stripe's current period end`)
        } else {
          // Stripe's period end matches our original - just remove cancel_at_period_end
          console.log(`✅ Stripe period end matches original (${originalPeriodEnd.toISOString()}), removing cancel_at_period_end should preserve it`)
        }
      } else {
        console.log(`🔧 Stripe period end not available, removing cancel_at_period_end should preserve the subscription`)
      }
    }

    // Reactivate subscription by removing cancellation at period end
    // Stripe will preserve the current period end when we remove cancel_at_period_end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      updateOptions
    )

    // Access current_period_end using bracket notation to avoid TypeScript conflict
    const updatedSubscriptionAny = updatedSubscription as any
    const updatedPeriodEndRaw = updatedSubscriptionAny.current_period_end
    
    // Try to get updated period end, but use original as fallback
    let updatedPeriodEnd: number
    
    if (updatedPeriodEndRaw !== undefined && updatedPeriodEndRaw !== null) {
      const converted = typeof updatedPeriodEndRaw === 'number' ? updatedPeriodEndRaw : Number(updatedPeriodEndRaw)
      if (!isNaN(converted) && converted > 0) {
        updatedPeriodEnd = converted
        console.log(`📅 Stripe period end after update: ${new Date(updatedPeriodEnd * 1000).toISOString()} (${updatedPeriodEnd})`)
      } else {
        console.warn(`⚠️ Invalid updated period end value: ${updatedPeriodEndRaw}, using original database value`)
        updatedPeriodEnd = originalPeriodEndTimestamp
      }
    } else {
      console.warn(`⚠️ Stripe subscription missing current_period_end after update, using original database value`)
      updatedPeriodEnd = originalPeriodEndTimestamp
    }

    // If Stripe changed the period end, we'll preserve the original in the database
    // This is a fallback to ensure our database has the correct period end
    const stripeChangedPeriod = originalPeriodEnd > now && updatedPeriodEnd !== originalPeriodEndTimestamp
    if (stripeChangedPeriod) {
      console.log(`⚠️ Stripe changed period end to ${updatedPeriodEnd}, but original was ${originalPeriodEndTimestamp}`)
      console.log(`⚠️ Will preserve original period end in database`)
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
      
      // After syncing from Stripe, check if we need to preserve the original period dates
      // This is a fallback in case Stripe changed them despite our billing_cycle_anchor setting
      if (originalPeriodStart && originalPeriodEnd && originalPeriodEnd > now) {
        // Only preserve if the original period hasn't ended yet
        const { data: syncedSub } = await supabaseAdmin
          .from('subscriptions')
          .select('current_period_start, current_period_end')
          .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          .single()
        
        const syncedPeriodStart = syncedSub?.current_period_start ? new Date(syncedSub.current_period_start) : null
        const syncedPeriodEnd = syncedSub?.current_period_end ? new Date(syncedSub.current_period_end) : null
        
        // Validate synced period end if it exists
        if (syncedPeriodEnd && isNaN(syncedPeriodEnd.getTime())) {
          console.error(`Invalid synced period end: ${syncedSub?.current_period_end}`)
          // Continue without the fallback update
        } else {
          // Check if dates changed and restore original dates
          const periodStartChanged = syncedPeriodStart && syncedPeriodStart.getTime() !== originalPeriodStart.getTime()
          const periodEndChanged = syncedPeriodEnd && syncedPeriodEnd.getTime() !== originalPeriodEnd.getTime()
          
          // If Stripe's period dates are different from the original, preserve the original in our database
          // Note: This is a fallback to ensure our database has the correct period dates
          if (periodStartChanged || periodEndChanged) {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                current_period_start: originalPeriodStart.toISOString(),
                current_period_end: originalPeriodEnd.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscription.stripe_subscription_id)
            console.log(`✅ Preserved original period dates in database (fallback): ${originalPeriodStart.toISOString()} to ${originalPeriodEnd.toISOString()}`)
            console.log(`⚠️ Stripe had: ${syncedPeriodStart?.toISOString()} to ${syncedPeriodEnd?.toISOString()}`)
            console.log(`⚠️ Note: Stripe webhooks may overwrite this.`)
          } else {
            console.log(`✅ Period dates match: ${originalPeriodStart.toISOString()} to ${originalPeriodEnd.toISOString()}`)
          }
        }
      }
      
      console.log(`✅ Subscription reactivation synced from Stripe: ${updatedSubscription.id}`)
    } else {
      // Fallback: update database directly (shouldn't happen in production)
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          // Preserve original period dates if they're in the future
          ...(originalPeriodStart && originalPeriodEnd && originalPeriodEnd > now ? {
            current_period_start: originalPeriodStart.toISOString(),
            current_period_end: originalPeriodEnd.toISOString(),
          } : {}),
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
