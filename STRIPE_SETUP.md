# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for the SecondShelf application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your Supabase project with the purchases table migration applied

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)
   - ⚠️ Keep this secret! Never commit it to version control.

## Step 2: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/payments/webhook`
   - For local development, use Stripe CLI (see Step 3)
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Local Development with Stripe CLI (Optional)

For local development, you can use Stripe CLI to forward webhooks:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/payments/webhook`
3. Copy the webhook signing secret from the CLI output

## Step 4: Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important:** 
- Never commit `.env.local` to version control
- Use test keys (`sk_test_`, `pk_test_`) for development
- Use live keys (`sk_live_`, `pk_live_`) only in production

## Step 5: Run Database Migration

Apply the purchases table migration to your Supabase database:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the migration file: `supabase/migrations/004_create_purchases_table.sql`

Or use Supabase CLI:
```bash
supabase db push
```

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Sign in to your application
3. Browse books and click "Buy Now" on a book
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete the payment
6. Check your purchases at `/purchases`

## Test Cards

Stripe provides various test cards for different scenarios:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`
- **Insufficient funds:** `4000 0000 0000 9995`

See more at: https://stripe.com/docs/testing

## Production Deployment

Before going live:

1. Switch to **Live mode** in Stripe Dashboard
2. Get your live API keys
3. Update environment variables in your hosting platform (Vercel, Netlify, etc.)
4. Set up the production webhook endpoint in Stripe
5. Test with a real payment (you can refund it immediately)

## Troubleshooting

### Payment Intent Creation Fails
- Check that `STRIPE_SECRET_KEY` is set correctly
- Verify the book exists and is not already sold
- Ensure user is authenticated

### Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint
- Check webhook endpoint URL is correct
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for webhook handler
- Check server logs for errors

### Payment Succeeds but Book Not Marked as Sold
- Check webhook is receiving events (Stripe Dashboard → Webhooks → Your endpoint)
- Verify database migration was applied
- Check Supabase logs for errors

## Security Notes

- Always use HTTPS in production
- Never expose secret keys in client-side code
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your Stripe Dashboard for suspicious activity

## Support

For Stripe-specific issues, consult:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For application issues, check the application logs and Supabase logs.

