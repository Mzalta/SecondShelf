# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for the SecondShelf Pro account feature.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your Supabase project with the subscriptions table migration applied

## Step 1: Create a Stripe Product and Price

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Products** → **Add product**
3. Fill in the product details:
   - **Name:** SecondShelf Pro
   - **Description:** Monthly subscription for Pro features
   - **Pricing model:** Standard pricing
   - **Price:** $9.99 (or your desired amount)
   - **Billing period:** Monthly
4. Click **Save product**
5. **Copy the Price ID** (starts with `price_`) - you'll need this for your environment variable

## Step 2: Get Your Stripe API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)
   - ⚠️ Keep this secret! Never commit it to version control.

## Step 3: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/subscriptions/webhook`
   - For local development, use Stripe CLI (see Step 4)
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 4: Local Development with Stripe CLI (Optional)

For local development, you can use Stripe CLI to forward webhooks:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscriptions/webhook \
     --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed
   ```
3. Copy the webhook signing secret from the CLI output

## Step 5: Environment Variables

Update your `.env.local` file with:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_your_price_id_here

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important:** 
- Never commit `.env.local` to version control
- Use test keys (`sk_test_`, `pk_test_`) for development
- Use live keys (`sk_live_`, `pk_live_`) only in production

## Step 6: Run Database Migration

Apply the subscriptions table migration to your Supabase database:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the migration file: `supabase/migrations/005_create_subscriptions_table.sql`

Or use Supabase CLI:
```bash
supabase db push
```

## Step 7: Test the Integration

1. Start your development server: `npm run dev`
2. Sign in to your application
3. Navigate to `/subscription` page
4. Click "Subscribe to Pro"
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
6. Complete the checkout
7. Verify subscription status on the subscription page

## Test Cards

Stripe provides various test cards for different scenarios:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`
- **Insufficient funds:** `4000 0000 0000 9995`

See more at: https://stripe.com/docs/testing

## Webhook Events Handled

The webhook handler processes these events:

1. **checkout.session.completed** - When user completes subscription checkout
2. **customer.subscription.created** - When subscription is created
3. **customer.subscription.updated** - When subscription status changes
4. **customer.subscription.deleted** - When subscription is canceled
5. **invoice.payment_succeeded** - When monthly payment succeeds
6. **invoice.payment_failed** - When monthly payment fails

## Production Deployment

Before going live:

1. Switch to **Live mode** in Stripe Dashboard
2. Create a live product/price
3. Get your live API keys
4. Update environment variables in your hosting platform (Vercel, Netlify, etc.)
5. Set up the production webhook endpoint in Stripe
6. Test with a real payment (you can refund it immediately)

## Troubleshooting

### Checkout Session Creation Fails
- Check that `STRIPE_SECRET_KEY` is set correctly
- Verify `STRIPE_PRICE_ID` matches your Stripe product price
- Ensure user is authenticated

### Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint
- Check webhook endpoint URL is correct
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for webhook handler
- Check server logs for errors
- Verify webhook events are selected in Stripe Dashboard

### Subscription Not Showing as Active
- Check webhook is receiving events (Stripe Dashboard → Webhooks → Your endpoint)
- Verify database migration was applied
- Check Supabase logs for errors
- Ensure webhook handler is processing events correctly

## Security Notes

- Always use HTTPS in production
- Never expose secret keys in client-side code
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your Stripe Dashboard for suspicious activity

## Support

For Stripe-specific issues, consult:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Support](https://support.stripe.com)

For application issues, check the application logs and Supabase logs.

