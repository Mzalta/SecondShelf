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
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, current_period_end')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Get the original period end date from our database (when subscription was supposed to end)
    const originalPeriodEnd = new Date(subscription.current_period_end)
    const now = new Date()

    // Reactivate subscription by removing cancellation at period end
    // Stripe will preserve the current_period_end if the subscription is still active
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    )

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
      
      // After syncing from Stripe, preserve the original period end date in our database
      // This ensures the subscription continues from when it was supposed to end, not from today
      if (originalPeriodEnd > now) {
        // Only preserve if the original period hasn't ended yet
        const { data: syncedSub } = await supabaseAdmin
          .from('subscriptions')
          .select('current_period_end')
          .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          .single()
        
        const syncedPeriodEnd = syncedSub ? new Date(syncedSub.current_period_end) : null
        
        // If Stripe's period end is different from the original, preserve the original
        if (syncedPeriodEnd && syncedPeriodEnd.getTime() !== originalPeriodEnd.getTime()) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              current_period_end: originalPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.stripe_subscription_id)
          console.log(`✅ Preserved original period end date: ${originalPeriodEnd.toISOString()} (was: ${syncedPeriodEnd.toISOString()})`)
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
    return NextResponse.json(
      { error: error.message || 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}

