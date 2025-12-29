# ChatGPT Prompt: Subscription Status Stuck on "Pending" Issue

## Problem Summary

I'm building a Next.js 14 application with Supabase authentication and Stripe subscriptions. The subscription status in the Supabase database keeps showing "pending" even after successful payment and checkout completion. The status should update to "active" when the Stripe webhook fires, but it's not updating correctly.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **Payments:** Stripe Subscriptions
- **Language:** TypeScript
- **Deployment:** Vercel

## How the Subscription Flow Works

1. **User initiates subscription:**
   - User clicks "Upgrade to Pro" button
   - Frontend calls `/api/subscriptions/create-checkout`
   - API route creates a Stripe Checkout Session
   - A placeholder subscription record is created in Supabase with:
     - `status: 'pending'`
     - `stripe_subscription_id: 'pending-{user_id}-{timestamp}'`
     - `stripe_customer_id: {actual_stripe_customer_id}`

2. **User completes payment:**
   - User is redirected to Stripe Checkout
   - User completes payment
   - Stripe redirects back to `/subscription?success=true`

3. **Webhook should update status:**
   - Stripe sends `checkout.session.completed` webhook event
   - Webhook handler at `/api/subscriptions/webhook` should:
     - Find the user by customer ID or metadata
     - Retrieve the actual subscription from Stripe
     - Update the database record with:
       - Real `stripe_subscription_id` (replacing the placeholder)
       - Actual `status` from Stripe (should be 'active', 'trialing', etc.)
       - Period dates and other subscription details

4. **Status API fallback:**
   - Frontend polls `/api/subscriptions/status` to check subscription status
   - If status is still 'pending', the API should sync directly from Stripe
   - This serves as a fallback if webhook hasn't fired yet or failed

## The Problem

The subscription status remains "pending" in the database even after:
- Successful payment completion
- Webhook events being received (potentially)
- User being redirected back to the app

**Symptoms:**
- Subscription table shows `status = 'pending'` indefinitely
- Users see "pending" status on the subscription page
- Pro features not activated even though payment succeeded

## Root Causes Identified

1. **Webhook handler issues:**
   - Insufficient error handling and logging
   - Webhook might fail silently if user_id lookup fails
   - Status update logic might not properly replace placeholder records
   - No clear indication when webhook processing fails

2. **Status sync fallback issues:**
   - Status API route had basic Stripe sync but wasn't aggressive enough
   - Didn't properly handle placeholder subscription IDs
   - Limited error logging made debugging difficult

3. **TypeScript type mismatch:**
   - Stripe's subscription status type doesn't include 'pending'
   - Comparing Stripe status to 'pending' caused TypeScript errors
   - 'pending' only exists in our database, not in Stripe

## Database Schema

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- 'pending', 'active', 'trialing', 'canceled', 'past_due', etc.
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Code Changes Made

### 1. Enhanced Webhook Handler (`app/api/subscriptions/webhook/route.ts`)

**Improvements:**
- Added comprehensive logging at each step
- Better error handling with descriptive error messages
- Improved user_id lookup with multiple fallback methods:
  1. Checkout session metadata
  2. Stripe customer metadata
  3. Query subscriptions table by customer_id
- Enhanced `upsertSubscription` function:
  - Better handling of placeholder subscriptions
  - Clearer logging of status transitions
  - Proper deletion and replacement of placeholder records
- Fixed TypeScript error by removing invalid Stripe status comparison

**Key changes:**
```typescript
// Before: Minimal logging, could fail silently
await upsertSubscription(subscription, userId, supabaseAdmin)

// After: Comprehensive logging and error handling
console.log(`🔄 Upserting subscription: ${subscription.id}, status: ${subscription.status}, user: ${userId}`)
// ... detailed logging throughout
console.log(`✅ Successfully replaced placeholder subscription with real subscription: ${subscription.id}, status: ${subscription.status}`)
```

### 2. Enhanced Status API Route (`app/api/subscriptions/status/route.ts`)

**Improvements:**
- More aggressive Stripe sync when status is 'pending'
- Better customer lookup (by metadata and existing subscriptions)
- Handles placeholder subscriptions properly
- Improved error logging
- Fetches multiple subscriptions and finds the active one
- Better handling of subscription replacement

**Key changes:**
```typescript
// Before: Basic sync, limited error handling
if (!subscription || subscription.status === 'pending') {
  // Basic sync logic
}

// After: Comprehensive sync with detailed logging
if (!subscription || subscription.status === 'pending' || subscription.stripe_subscription_id?.startsWith('pending-')) {
  console.log(`⚠️ Subscription not found or pending, checking Stripe directly...`)
  // Enhanced sync with multiple lookup methods
  // Proper placeholder handling
  // Detailed logging
}
```

## Environment Variables Required

- `STRIPE_SECRET_KEY` - Stripe secret key (server-side)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for webhook to bypass RLS)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `STRIPE_PRICE_ID` - Stripe price ID for subscriptions

## Webhook Configuration

**Required Stripe Webhook Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Webhook Endpoint:** `https://your-domain.com/api/subscriptions/webhook`

## Testing the Fix

1. **Check webhook is receiving events:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Check if events are being received
   - Verify webhook endpoint URL is correct
   - Check webhook event logs for errors

2. **Test subscription flow:**
   - Create a new subscription
   - Complete payment in Stripe Checkout
   - Check server logs for webhook processing
   - Verify database status updates from 'pending' to 'active'

3. **Test fallback sync:**
   - If webhook hasn't fired, check subscription status page
   - Status API should sync from Stripe automatically
   - Check server logs for sync messages

## Current Status

✅ **Fixed:**
- Enhanced webhook handler with better logging and error handling
- Improved status API route with aggressive Stripe sync
- Fixed TypeScript compilation errors
- Better placeholder subscription handling

⚠️ **To Verify:**
- Webhook is properly configured in Stripe Dashboard
- Webhook endpoint is receiving events
- Environment variables are set correctly in Vercel
- Test with a real subscription to confirm status updates

## Questions for ChatGPT

1. Are there any edge cases I should handle for subscription status updates?
2. Should I add retry logic if webhook processing fails?
3. Is there a better way to handle the placeholder subscription pattern?
4. Should I add database triggers or functions to automatically sync status?
5. Are there any security concerns with the current webhook implementation?
6. Should I add monitoring/alerting for failed webhook processing?

## Additional Context

- The app uses Supabase Row Level Security (RLS)
- Webhook handler uses service role key to bypass RLS
- Frontend polls status API every 1-2 seconds after checkout success
- Placeholder subscriptions are created to store customer_id before checkout completes
- Stripe subscription statuses: 'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'
- Our database also uses 'pending' status for subscriptions not yet confirmed by Stripe

