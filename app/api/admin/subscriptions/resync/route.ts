import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { upsertSubscriptionFromStripe, getUserIdFromCustomer } from '@/lib/stripe/subscriptions'

// Ensure this route runs on Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/subscriptions/resync
 * Admin endpoint to resync all subscriptions from Stripe to database
 * Reconciles DB to Stripe (Stripe is source of truth)
 * 
 * Requires authentication/authorization (add your auth check here)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, this is a basic implementation - secure it in production
    
    if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Stripe or Supabase configuration is missing' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
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

    console.log('🔄 Starting admin resync of all subscriptions from Stripe...')

    // Get all subscriptions from Stripe
    const allSubscriptions: Stripe.Subscription[] = []
    let hasMore = true
    let startingAfter: string | undefined = undefined

    while (hasMore) {
      const response = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
        status: 'all',
      })

      allSubscriptions.push(...response.data)
      hasMore = response.has_more
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id
      }
    }

    console.log(`📋 Found ${allSubscriptions.length} subscription(s) in Stripe`)

    const results = {
      processed: 0,
      synced: 0,
      errors: 0,
      errorDetails: [] as Array<{ subscriptionId: string; error: string }>,
    }

    // Process each subscription
    for (const subscription of allSubscriptions) {
      try {
        results.processed++

        // Get user_id for this subscription
        let userId: string | null = null

        if (subscription.customer) {
          userId = await getUserIdFromCustomer(subscription.customer as string, stripe, supabaseAdmin)
        }

        if (!userId) {
          console.log(`⚠️ Skipping subscription ${subscription.id} - no user_id found`)
          continue
        }

        // Sync subscription using canonical helper
        await upsertSubscriptionFromStripe(subscription, userId, supabaseAdmin)
        results.synced++
        console.log(`✅ Synced subscription: ${subscription.id}, user: ${userId}, status: ${subscription.status}`)
      } catch (error: any) {
        results.errors++
        const errorMsg = error.message || String(error)
        results.errorDetails.push({
          subscriptionId: subscription.id,
          error: errorMsg,
        })
        console.error(`❌ Error syncing subscription ${subscription.id}:`, error)
      }
    }

    console.log(`✅ Admin resync complete: ${results.synced}/${results.processed} synced, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      summary: {
        totalInStripe: allSubscriptions.length,
        processed: results.processed,
        synced: results.synced,
        errors: results.errors,
      },
      errors: results.errorDetails.length > 0 ? results.errorDetails : undefined,
    })
  } catch (error: any) {
    console.error('Error in admin resync:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/subscriptions/resync
 * Get status of broken subscriptions (subscriptions not in active/trialing state for >10 minutes)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Supabase configuration is missing' },
        { status: 500 }
      )
    }

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

    // Find subscriptions in broken state (not active/trialing for >10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const { data: brokenSubscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .not('status', 'in', '(active,trialing)')
      .lt('created_at', tenMinutesAgo)

    if (error) {
      console.error('Error fetching broken subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch broken subscriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      brokenCount: brokenSubscriptions?.length || 0,
      brokenSubscriptions: brokenSubscriptions || [],
    })
  } catch (error: any) {
    console.error('Error in admin resync status:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

