import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

// Ensure this route runs on Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/subscriptions/status
 * Get subscription status for the authenticated user
 * Also checks Stripe directly as a fallback if subscription not found in DB
 */
export async function GET(request: NextRequest) {
  try {
    // Debug: Log cookies to verify they're being sent
    const allCookies = cookies().getAll()
    console.log('Auth cookies:', allCookies.map(c => c.name).filter(name => name.includes('sb-') || name.includes('auth')))

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

    // If subscription not found or is still pending, check Stripe directly as fallback
    if (!subscription || subscription.status === 'pending' || subscription.stripe_subscription_id?.startsWith('pending-')) {
      console.log('Subscription not found or pending, checking Stripe directly...')
      
      // Try to sync from Stripe
      if (process.env.STRIPE_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
          
          // Find customer by user_id in metadata or by checking existing subscriptions
          let customerId: string | null = null
          
          if (subscription?.stripe_customer_id) {
            customerId = subscription.stripe_customer_id
          } else {
            // Try to find customer by metadata
            const customers = await stripe.customers.search({
              query: `metadata['supabase_user_id']:'${user.id}'`,
              limit: 1,
            })
            
            if (customers.data.length > 0) {
              customerId = customers.data[0].id
            }
          }
          
          if (customerId) {
            // Get active subscriptions for this customer
            const stripeSubscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: 'all',
              limit: 1,
            })
            
            if (stripeSubscriptions.data.length > 0) {
              const stripeSub = stripeSubscriptions.data[0]
              console.log(`Found subscription in Stripe: ${stripeSub.id}, status: ${stripeSub.status}`)
              
              // Sync to database using admin client
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
              
              // Import the upsert function logic (we'll inline it here)
              const subscriptionData = {
                user_id: user.id,
                stripe_subscription_id: stripeSub.id,
                stripe_customer_id: stripeSub.customer as string,
                status: stripeSub.status,
                current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
                current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                cancel_at_period_end: stripeSub.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              }
              
              // Upsert the subscription
              const { data: existingSub } = await supabaseAdmin
                .from('subscriptions')
                .select('id, stripe_subscription_id')
                .eq('user_id', user.id)
                .maybeSingle()
              
              if (existingSub) {
                // Delete if it's a placeholder or different subscription ID
                if (existingSub.stripe_subscription_id?.startsWith('pending-') || existingSub.stripe_subscription_id !== stripeSub.id) {
                  await supabaseAdmin
                    .from('subscriptions')
                    .delete()
                    .eq('user_id', user.id)
                  
                  await supabaseAdmin
                    .from('subscriptions')
                    .insert(subscriptionData)
                } else {
                  await supabaseAdmin
                    .from('subscriptions')
                    .update(subscriptionData)
                    .eq('user_id', user.id)
                }
              } else {
                await supabaseAdmin
                  .from('subscriptions')
                  .insert(subscriptionData)
              }
              
              console.log(`✅ Synced subscription from Stripe: ${stripeSub.id}`)
              
              // Re-fetch from database
              const { data: syncedSubscription } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single()
              
              if (syncedSubscription) {
                const isActive = ['active', 'trialing'].includes(syncedSubscription.status)
                  && new Date(syncedSubscription.current_period_end) > new Date()
                
                return NextResponse.json({
                  subscription: syncedSubscription,
                  isActive: !!isActive,
                  isPro: !!isActive,
                  synced: true,
                })
              }
            }
          }
        } catch (stripeError: any) {
          console.error('Error syncing from Stripe:', stripeError)
          // Continue with database subscription even if Stripe sync fails
        }
      }
    }

    // Check if subscription is active
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
