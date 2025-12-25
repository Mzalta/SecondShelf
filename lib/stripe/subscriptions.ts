/**
 * Stripe Subscription Utilities
 * Canonical functions for syncing Stripe subscription data to the database
 */

import Stripe from 'stripe'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Canonical function to upsert a subscription from Stripe
 * This is the single source of truth for syncing Stripe subscriptions to the database
 * 
 * @param subscription - Stripe Subscription object
 * @param userId - Supabase user ID
 * @param supabaseAdmin - Supabase admin client (bypasses RLS)
 * @returns The upserted subscription data
 */
export async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  userId: string,
  supabaseAdmin: SupabaseClient<any>
): Promise<any> {
  // Normalize Stripe subscription data
  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id, // This is our unique key
    stripe_customer_id: subscription.customer as string,
    status: subscription.status, // Stripe status: active, trialing, past_due, canceled, etc.
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  }

  console.log(`🔄 Upserting subscription from Stripe: ${subscription.id}, status: ${subscription.status}, user: ${userId}`)

  // Check if subscription already exists by stripe_subscription_id (our unique key)
  const { data: existingSub, error: queryError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, stripe_subscription_id, status, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (queryError && queryError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is fine
    console.error('Error querying existing subscription:', queryError)
    throw queryError
  }

  // Log status transition if subscription exists and status changed
  if (existingSub && existingSub.status !== subscription.status) {
    console.log(`📊 Status transition: ${subscription.id} ${existingSub.status} → ${subscription.status}`)
  }

  if (existingSub) {
    // Subscription exists - update it (idempotent)
    // Handle case where user_id might be different (stripe_subscription_id is source of truth)
    if (existingSub.user_id !== userId) {
      console.log(`⚠️ Subscription ${subscription.id} exists but for different user (${existingSub.user_id} → ${userId}), updating user_id`)
      // Delete any subscription for the new user_id to satisfy UNIQUE constraint
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('user_id', userId)
    }
    
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(subscriptionData)
      .eq('stripe_subscription_id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      throw updateError
    }

    console.log(`✅ Updated subscription: ${subscription.id}, status: ${subscription.status}`)
    return updatedData
  } else {
    // Subscription doesn't exist - insert it
    // First check if this user has another subscription (user_id has UNIQUE constraint)
    const { data: userSubs } = await supabaseAdmin
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('user_id', userId)

    if (userSubs && userSubs.length > 0) {
      console.log(`⚠️ User ${userId} already has ${userSubs.length} subscription(s), cleaning up...`)
      // Delete old subscriptions for this user to satisfy UNIQUE constraint
      for (const oldSub of userSubs) {
        await supabaseAdmin
          .from('subscriptions')
          .delete()
          .eq('id', oldSub.id)
      }
      console.log(`✅ Cleaned up ${userSubs.length} old subscription(s)`)
    }

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting subscription:', insertError)
      throw insertError
    }

    console.log(`✅ Inserted new subscription: ${subscription.id}, status: ${subscription.status}`)
    return insertedData
  }
}

/**
 * Get user_id from Stripe customer metadata or database lookup
 * 
 * @param customerId - Stripe customer ID
 * @param stripe - Stripe client
 * @param supabaseAdmin - Supabase admin client
 * @returns User ID if found, null otherwise
 */
export async function getUserIdFromCustomer(
  customerId: string,
  stripe: Stripe,
  supabaseAdmin: SupabaseClient<any>
): Promise<string | null> {
  // Try customer metadata first (most reliable)
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer && !customer.deleted) {
      // Check both metadata keys for compatibility
      const userId = (customer.metadata?.user_id || customer.metadata?.supabase_user_id) as string | undefined
      if (userId) {
        console.log(`✅ Found user_id from customer metadata: ${userId}`)
        return userId
      }
    }
  } catch (error) {
    console.error('Error retrieving customer from Stripe:', error)
  }

  // Fallback: lookup by stripe_customer_id in subscriptions table
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (existingSub?.user_id) {
    console.log(`✅ Found user_id from subscriptions table: ${existingSub.user_id}`)
    return existingSub.user_id
  }

  return null
}

