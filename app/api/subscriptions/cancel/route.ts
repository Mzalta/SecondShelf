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
 * Safely create a Date object from a string or timestamp
 * Returns null if the date is invalid
 */
function safeDate(dateValue: string | number | null | undefined): Date | null {
  if (!dateValue) return null
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue)
    if (isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

/**
 * POST /api/subscriptions/cancel
 * Cancel user's subscription at period end
 */
export async function POST(request: NextRequest) {
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
        { error: 'Unauthorized. Please sign in to cancel your subscription.' },
        { status: 401 }
      )
    }

    console.log(`🔎 Authenticated user for cancel: ${user.id}`)

    // Get user's subscription with original period dates to preserve them
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, current_period_start, current_period_end')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Preserve original period dates before updating Stripe
    const originalPeriodStart = safeDate(subscription.current_period_start)
    const originalPeriodEnd = safeDate(subscription.current_period_end)

    console.log(`📅 Original period dates from DB: ${originalPeriodStart?.toISOString() || 'N/A'} to ${originalPeriodEnd?.toISOString() || 'N/A'}`)

    // Cancel subscription at period end (Stripe is source of truth)
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    // Use bracket notation to access properties to avoid TypeScript conflict with local Subscription type
    const stripeSubAny = updatedSubscription as any
    const periodStart = stripeSubAny.current_period_start as number
    const periodEnd = stripeSubAny.current_period_end as number
    const stripePeriodStart = periodStart ? safeDate(periodStart * 1000) : null
    const stripePeriodEnd = periodEnd ? safeDate(periodEnd * 1000) : null
    console.log(`📅 Stripe period dates after cancel: ${stripePeriodStart?.toISOString() || 'N/A'} to ${stripePeriodEnd?.toISOString() || 'N/A'}`)

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
      console.log(`✅ Subscription cancellation synced from Stripe: ${stripeSubAny.id}`)
      
      // Restore original period dates if they changed (preserve the original subscription period)
      if (originalPeriodStart && originalPeriodEnd) {
        const { data: syncedSub } = await supabaseAdmin
          .from('subscriptions')
          .select('current_period_start, current_period_end')
          .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          .single()
        
        const syncedPeriodStart = safeDate(syncedSub?.current_period_start)
        const syncedPeriodEnd = safeDate(syncedSub?.current_period_end)
        
        // Check if dates changed and restore original dates (only if both dates are valid)
        const periodStartChanged = syncedPeriodStart && originalPeriodStart && syncedPeriodStart.getTime() !== originalPeriodStart.getTime()
        const periodEndChanged = syncedPeriodEnd && originalPeriodEnd && syncedPeriodEnd.getTime() !== originalPeriodEnd.getTime()
        
        if ((periodStartChanged || periodEndChanged) && originalPeriodStart && originalPeriodEnd) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              current_period_start: originalPeriodStart.toISOString(),
              current_period_end: originalPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          console.log(`✅ Preserved original period dates in database: ${originalPeriodStart.toISOString()} to ${originalPeriodEnd.toISOString()}`)
          console.log(`⚠️ Stripe had: ${syncedPeriodStart?.toISOString() || 'N/A'} to ${syncedPeriodEnd?.toISOString() || 'N/A'}`)
        } else if (originalPeriodStart && originalPeriodEnd) {
          console.log(`✅ Period dates unchanged: ${originalPeriodStart.toISOString()} to ${originalPeriodEnd.toISOString()}`)
        }
      }
    } else {
      // Fallback: update database directly (shouldn't happen in production)
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          // Preserve original period dates (only if both are valid)
          ...(originalPeriodStart && originalPeriodEnd ? {
            current_period_start: originalPeriodStart.toISOString(),
            current_period_end: originalPeriodEnd.toISOString(),
          } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.stripe_subscription_id)
    }

    return NextResponse.json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancel_at_period_end: stripeSubAny.cancel_at_period_end,
    })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
