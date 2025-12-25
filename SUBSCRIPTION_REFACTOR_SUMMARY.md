# Subscription System Refactor Summary

This document summarizes the comprehensive refactor of the Stripe + Supabase subscription system to eliminate placeholder subscriptions, make webhook handling idempotent and authoritative, and add self-healing sync and monitoring.

## ✅ Completed Changes

### 1. Removed Placeholder Subscriptions

**File: `app/api/subscriptions/create-checkout/route.ts`**
- ❌ Removed all code that creates subscription rows before Stripe checkout completes
- ✅ Now only ensures Stripe customer exists with user_id in metadata
- ✅ Stores user_id in both `customer.metadata.user_id` and `checkout.session.metadata.user_id`
- ✅ Returns checkout session URL without any database subscription row creation
- ✅ Subscription rows are now created ONLY when webhooks fire

### 2. Canonical Subscription Sync Helper

**File: `lib/stripe/subscriptions.ts`** (NEW)
- ✅ Created `upsertSubscriptionFromStripe()` - single source of truth for syncing subscriptions
- ✅ Uses `stripe_subscription_id` as unique key for idempotency
- ✅ Handles user_id changes and UNIQUE constraint conflicts
- ✅ Logs status transitions for monitoring
- ✅ Created `getUserIdFromCustomer()` helper for consistent user lookup

### 3. Idempotent Webhook Handler

**File: `app/api/subscriptions/webhook/route.ts`**
- ✅ Completely refactored to use canonical `upsertSubscriptionFromStripe()` helper
- ✅ All webhook handlers now go through the same canonical function
- ✅ Proper user lookup order: `session.metadata.user_id` → `customer.metadata` → `subscriptions` table
- ✅ Handles all events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- ✅ Fetches full subscription from Stripe before syncing (Stripe is source of truth)
- ✅ Safe to replay webhooks multiple times (idempotent)

### 4. Self-Healing Status API

**File: `app/api/subscriptions/status/route.ts`**
- ✅ Aggressively syncs from Stripe if:
  - No subscription exists in DB
  - Subscription status is NOT active or trialing
- ✅ Uses canonical helper for consistency
- ✅ Chooses best subscription: active > trialing > others
- ✅ Automatically fixes bad state without manual intervention

### 5. Webhook Failure Monitoring

**File: `supabase/migrations/007_create_webhook_failures_table.sql`** (NEW)
- ✅ Created `webhook_failures` table for logging webhook processing errors
- ✅ Logs event_id, event_type, error message, and timestamp
- ✅ Indexed for fast queries

**File: `app/api/subscriptions/webhook/route.ts`**
- ✅ Added `logWebhookFailure()` function
- ✅ Logs all webhook processing errors to database
- ✅ Never fails silently - all errors are logged

### 6. Admin Resync Endpoint

**File: `app/api/admin/subscriptions/resync/route.ts`** (NEW)
- ✅ POST endpoint to resync all subscriptions from Stripe
- ✅ Reconciles database to Stripe (Stripe is source of truth)
- ✅ Returns summary of processed/synced/errors
- ✅ GET endpoint to detect broken subscriptions (not active/trialing for >10 minutes)

### 7. Updated Cancel Route

**File: `app/api/subscriptions/cancel/route.ts`**
- ✅ Now uses canonical `upsertSubscriptionFromStripe()` helper
- ✅ Syncs from Stripe after cancellation to ensure consistency

### 8. Type Safety

**File: `types/index.ts`**
- ✅ Subscription type already excludes 'pending' (correct)
- ✅ Only uses Stripe's official status values: `active`, `canceled`, `past_due`, `unpaid`, `trialing`
- ✅ 'pending' exists only as UI concept, never persisted

## 🎯 Key Principles

1. **Stripe is the Source of Truth**: All subscription state comes from Stripe, database mirrors it
2. **Idempotency**: All operations are safe to repeat (webhooks, syncs)
3. **Self-Healing**: System automatically fixes bad state by syncing from Stripe
4. **No Placeholders**: Subscription rows only exist after Stripe creates them
5. **Comprehensive Logging**: All state changes and errors are logged

## 🔒 Database Schema

- `subscriptions` table has both `user_id UNIQUE` and `stripe_subscription_id UNIQUE`
- Helper function handles UNIQUE constraint conflicts correctly
- `webhook_failures` table for monitoring (NEW)

## 📝 Migration Required

Run the new migration:
```bash
# Migration file: supabase/migrations/007_create_webhook_failures_table.sql
```

## 🧪 Testing Recommendations

1. Test checkout flow - verify no subscription row created until webhook fires
2. Test webhook idempotency - replay same webhook multiple times
3. Test status sync - verify sync happens when subscription missing or invalid
4. Test admin resync - verify all subscriptions sync correctly
5. Test webhook failure logging - verify errors are logged to database

## 🚨 Breaking Changes

None - this is a refactor that maintains backward compatibility while fixing architectural issues.

## 📊 Monitoring

- Check `webhook_failures` table for processing errors
- Use admin resync endpoint to detect broken subscriptions
- Monitor logs for status transitions

