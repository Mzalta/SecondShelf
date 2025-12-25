# Vercel Stripe Payment Setup Guide

This guide will help you set up Stripe payments to work on Vercel.

## Quick Setup

### Option 1: Automated Script (Recommended)

1. Make sure you have Vercel CLI installed and logged in:
   ```bash
   npm i -g vercel
   vercel login
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-vercel-stripe.sh
   ```

   This script will automatically add all required environment variables from your `.env.local` file.

### Option 2: Manual Setup via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below:

## Required Environment Variables

### Stripe Variables

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (starts with `sk_`) | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_PRICE_ID` | Subscription price ID (starts with `price_`) | Stripe Dashboard → Products → Your product → Pricing → Price ID |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (starts with `whsec_`) | Stripe Dashboard → Developers → Webhooks → Your webhook → Signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (starts with `pk_`) | Stripe Dashboard → Developers → API keys → Publishable key |

### Supabase Variables (if not already set)

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret` |

## Setting Variables in Vercel

For each variable:
1. Click **Add New**
2. Enter the **Name** (exactly as shown above)
3. Enter the **Value** (paste your key)
4. Select environments:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
5. Click **Save**

## Configure Stripe Webhooks

After deploying to Vercel, you need to set up webhooks in Stripe:

### 1. Get Your Vercel URL

Your deployment URL will be something like: `https://your-project.vercel.app`

### 2. Create Payment Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://your-project.vercel.app/api/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### 3. Create Subscription Webhook

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint** (or use the same endpoint if you prefer)
3. Enter endpoint URL: `https://your-project.vercel.app/api/subscriptions/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. If you created a separate webhook, copy the **Signing secret** and update `STRIPE_WEBHOOK_SECRET` in Vercel

> **Note:** You can use the same webhook secret for both endpoints, or create separate webhooks with different secrets.

## Redeploy Your Application

After setting all environment variables:

1. Go to Vercel Dashboard → **Deployments**
2. Click the **⋯** (three dots) on your latest deployment
3. Click **Redeploy**
4. Or simply push a new commit to trigger a new deployment

## Testing

1. Visit your Vercel deployment URL
2. Sign in with Google
3. Navigate to `/subscription` page
4. Click "Subscribe to Pro"
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC
   - Any ZIP code

## Troubleshooting

### "Stripe secret key is not configured"

- Verify `STRIPE_SECRET_KEY` is set in Vercel
- Make sure it's enabled for the correct environment (Production/Preview/Development)
- Redeploy after adding the variable

### "Unauthorized. Please sign in"

- This is expected if you're not signed in
- The page should show a sign-in button
- Sign in with Google to continue

### Webhooks not working

- Verify webhook URLs in Stripe match your Vercel deployment URL
- Check that `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe
- Check Vercel deployment logs for webhook errors
- Make sure webhook events are selected in Stripe Dashboard

### Environment variables not working

- Variables take effect after redeployment
- `NEXT_PUBLIC_*` variables are available at build time
- Other variables are available at runtime
- Check variable names are exact (case-sensitive)
- Verify variables are enabled for the correct environments

## Security Notes

⚠️ **Important:**
- Never commit `.env` files to git
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `STRIPE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` should NEVER be in `NEXT_PUBLIC_*` variables
- Keep service role keys secret - they have admin access

## Support

If you continue to have issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure webhook URLs in Stripe match your Vercel URL

