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
    const originalPeriodStart = subscription.current_period_start ? new Date(subscription.current_period_start) : null
    const originalPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null

    console.log(`📅 Original period dates from DB: ${originalPeriodStart?.toISOString()} to ${originalPeriodEnd?.toISOString()}`)

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
    console.log(`📅 Stripe period dates after cancel: ${new Date(periodStart * 1000).toISOString()} to ${new Date(periodEnd * 1000).toISOString()}`)

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
        
        const syncedPeriodStart = syncedSub?.current_period_start ? new Date(syncedSub.current_period_start) : null
        const syncedPeriodEnd = syncedSub?.current_period_end ? new Date(syncedSub.current_period_end) : null
        
        // Check if dates changed and restore original dates
        const periodStartChanged = syncedPeriodStart && syncedPeriodStart.getTime() !== originalPeriodStart.getTime()
        const periodEndChanged = syncedPeriodEnd && syncedPeriodEnd.getTime() !== originalPeriodEnd.getTime()
        
        if (periodStartChanged || periodEndChanged) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              current_period_start: originalPeriodStart.toISOString(),
              current_period_end: originalPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          console.log(`✅ Preserved original period dates in database: ${originalPeriodStart.toISOString()} to ${originalPeriodEnd.toISOString()}`)
          console.log(`⚠️ Stripe had: ${syncedPeriodStart?.toISOString()} to ${syncedPeriodEnd?.toISOString()}`)
        } else {
          console.log(`✅ Period dates unchanged: ${originalPeriodStart.toISOString()} to ${originalPeriodEnd.toISOString()}`)
        }
      }
    } else {
      // Fallback: update database directly (shouldn't happen in production)
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          // Preserve original period dates
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
