import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { upsertSubscriptionFromStripe, getUserIdFromCustomer } from '@/lib/stripe/subscriptions'

// Ensure this route runs on Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/subscriptions/status
 * Get subscription status for the authenticated user
 * Aggressively syncs from Stripe if subscription not found or status is invalid
 * Stripe is the source of truth
 * 
 * Query params:
 * - session_id: Checkout session ID (for strong consistency after checkout)
 */
export async function GET(request: NextRequest) {
  try {
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
        { error: 'Unauthorized. Please sign in to view your subscription status.' },
        { status: 401 }
      )
    }

    console.log(`🔎 Authenticated user for subscription status: ${user.id}`)

    // Check for session_id parameter (strong consistency path)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      console.log(`🎯 Using checkout session path (strong consistency): ${sessionId}`)
      const result = await syncFromCheckoutSession(sessionId, user.id, supabase)
      
      if (result) {
        return result
      }
      // If checkout session path fails, fall through to regular sync
      console.log(`⚠️ Checkout session path failed, falling back to metadata search`)
    }

    // Get user's subscription from database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error fetching subscription:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    // Aggressively sync from Stripe if:
    // 1. No subscription exists in DB
    // 2. Subscription status is NOT active or trialing
    const needsSync = !subscription || !['active', 'trialing'].includes(subscription.status)

    if (needsSync) {
      console.log(`⚠️ Subscription needs sync (exists: ${!!subscription}, status: ${subscription?.status}), syncing from Stripe...`)
      
      const syncedSubscription = await syncSubscriptionFromStripe(user.id, subscription?.stripe_customer_id || null)
      
      if (syncedSubscription) {
        // Re-fetch from database to return the synced subscription
        const { data: updatedSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (updatedSubscription) {
          const isActive = ['active', 'trialing'].includes(updatedSubscription.status)
            && new Date(updatedSubscription.current_period_end) > new Date()
          
          console.log(`✅ Synced subscription from Stripe: ${updatedSubscription.stripe_subscription_id}, status: ${updatedSubscription.status}`)
          
          return NextResponse.json({
            subscription: updatedSubscription,
            isActive: !!isActive,
            isPro: !!isActive,
            synced: true,
          })
        }
      } else {
        // Customer not found after retries (eventually consistent search issue)
        // Return pending status so frontend can retry
        console.log(`⏳ No subscription found in Stripe for user: ${user.id} (customer search returned zero results after retries)`)
        console.log(`📤 Returning pending status (202) - frontend will retry once`)
        return NextResponse.json(
          { status: 'pending' },
          { status: 202 }
        )
      }
    }

    // Check if subscription is active (only active or trialing with valid period)
    const isActive = subscription 
      && ['active', 'trialing'].includes(subscription.status)
      && new Date(subscription.current_period_end) > new Date()

    return NextResponse.json({
      subscription: subscription || null,
      isActive: !!isActive,
      isPro: !!isActive,
    })
  } catch (error: any) {
    console.error('Error in subscription status API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Sync subscription from Stripe Checkout Session (strong consistency)
 * This bypasses eventually consistent customer search
 */
async function syncFromCheckoutSession(
  sessionId: string,
  userId: string,
  supabase: any
): Promise<NextResponse | null> {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('⚠️ Stripe or Supabase admin credentials not configured, skipping checkout session sync')
    return null
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    
    console.log(`📥 Retrieving checkout session: ${sessionId}`)
    
    // Retrieve checkout session with expanded subscription and customer (strong consistency)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })
    
    console.log(`✅ Retrieved checkout session: ${session.id}, subscription: ${session.subscription}, customer: ${session.customer}`)
    
    // Verify this session belongs to the authenticated user
    const sessionUserId = session.metadata?.user_id || session.metadata?.supabase_user_id
    if (sessionUserId && sessionUserId !== userId) {
      console.error(`❌ Checkout session user_id mismatch: ${sessionUserId} !== ${userId}`)
      return null
    }
    
    // If session has a subscription, sync it immediately
    if (session.subscription) {
      const subscription = typeof session.subscription === 'string' 
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription
      
      console.log(`🔄 Syncing subscription from checkout session: ${subscription.id}, status: ${subscription.status}`)
      
      // Use admin client for upsert
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
      
      // Use canonical helper to upsert (idempotent)
      await upsertSubscriptionFromStripe(subscription, userId, supabaseAdmin)
      
      // Re-fetch from database to return the synced subscription
      const { data: syncedSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (syncedSubscription) {
        const isActive = ['active', 'trialing'].includes(syncedSubscription.status)
          && new Date(syncedSubscription.current_period_end) > new Date()
        
        console.log(`✅ Synced subscription from checkout session: ${syncedSubscription.stripe_subscription_id}, status: ${syncedSubscription.status}`)
        
        return NextResponse.json({
          subscription: syncedSubscription,
          isActive: !!isActive,
          isPro: !!isActive,
          synced: true,
        })
      }
    } else {
      console.log(`⚠️ Checkout session has no subscription yet: ${sessionId}`)
    }
    
    return null
  } catch (error: any) {
    console.error(`❌ Error syncing from checkout session ${sessionId}:`, error)
    return null
  }
}

/**
 * Sync subscription from Stripe to database
 * This is the self-healing mechanism that fixes bad state
 * Uses metadata-based customer search with retry logic
 */
async function syncSubscriptionFromStripe(
  userId: string,
  existingCustomerId: string | null
): Promise<any | null> {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('⚠️ Stripe or Supabase admin credentials not configured, skipping sync')
    return null
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    
    // Find customer ID
    let customerId: string | null = existingCustomerId
    
    if (!customerId) {
      // Try to find customer by user_id in metadata with retry logic
      console.log(`🔍 Searching for customer by user_id metadata: ${userId} (with retries)`)
      
      const maxRetries = 5
      const retryDelay = 500 // 500ms
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const customers = await stripe.customers.search({
          query: `metadata['user_id']:'${userId}' OR metadata['supabase_user_id']:'${userId}'`,
          limit: 1,
        })
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
          console.log(`✅ Found customer by metadata (attempt ${attempt}/${maxRetries}): ${customerId}`)
          break
        } else {
          if (attempt < maxRetries) {
            console.log(`⏳ Customer not found (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
          } else {
            console.log(`❌ Customer not found after ${maxRetries} attempts (eventually consistent search)`)
            // Return null to trigger pending status
            return null
          }
        }
      }
    }
    
    if (!customerId) {
      console.log(`⚠️ No customer ID found after retries, returning null (will trigger pending status)`)
      return null
    }

    // Get all subscriptions for this customer from Stripe
    console.log(`📥 Fetching subscriptions from Stripe for customer: ${customerId}`)
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    })
    
    console.log(`Found ${stripeSubscriptions.data.length} subscription(s) in Stripe`)
    
    if (stripeSubscriptions.data.length === 0) {
      return null
    }

    // Choose best subscription: active > trialing > others (prefer most recent)
    const activeSub = stripeSubscriptions.data.find(sub => sub.status === 'active')
    const trialingSub = stripeSubscriptions.data.find(sub => sub.status === 'trialing')
    const bestSub = activeSub || trialingSub || stripeSubscriptions.data[0] // Fallback to most recent
    
    console.log(`✅ Selected subscription from Stripe: ${bestSub.id}, status: ${bestSub.status}`)
    
    // Sync to database using admin client and canonical helper
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
    
    // Use canonical helper to upsert (idempotent, handles all edge cases)
    await upsertSubscriptionFromStripe(bestSub, userId, supabaseAdmin)
    
    // Return the synced subscription data
    const { data: syncedSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', bestSub.id)
      .single()
    
    return syncedSubscription
  } catch (error: any) {
    console.error('❌ Error syncing subscription from Stripe:', error)
    return null
  }
}
