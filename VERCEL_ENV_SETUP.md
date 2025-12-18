# Vercel Environment Variables Setup Guide

## Required Environment Variables

Your SecondShelf application needs the following environment variables set in Vercel:

### Supabase Variables
1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`
   - Find it in: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Find it in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY** (Required for webhooks)
   - Your Supabase service role key (keep this secret!)
   - Find it in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **Warning**: Never expose this in client-side code!

### Stripe Variables
4. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - Your Stripe publishable key (starts with `pk_`)
   - Find it in: Stripe Dashboard → Developers → API keys → Publishable key

5. **STRIPE_SECRET_KEY**
   - Your Stripe secret key (starts with `sk_`)
   - Find it in: Stripe Dashboard → Developers → API keys → Secret key
   - ⚠️ **Warning**: Never expose this in client-side code!

6. **STRIPE_WEBHOOK_SECRET** (Required for webhooks)
   - Your Stripe webhook signing secret (starts with `whsec_`)
   - Find it in: Stripe Dashboard → Developers → Webhooks → Click on your webhook → Signing secret
   - You'll need to create webhooks for:
     - Payment webhook: `/api/payments/webhook`
     - Subscription webhook: `/api/subscriptions/webhook`

7. **STRIPE_PRICE_ID** (Required for subscriptions)
   - Your Stripe subscription price ID (starts with `price_`)
   - Find it in: Stripe Dashboard → Products → Your subscription product → Pricing → Price ID

---

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign in to your account

2. **Navigate to Your Project**
   - Click on your **SecondShelf** project

3. **Go to Settings**
   - Click on **Settings** in the top navigation
   - Click on **Environment Variables** in the left sidebar

4. **Add Each Variable**
   For each environment variable:
   - Click **Add New**
   - Enter the **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the **Value** (paste your actual key/URL)
   - Select which environments to apply to:
     - ✅ **Production** (for your live site)
     - ✅ **Preview** (for preview deployments)
     - ✅ **Development** (for local development)
   - Click **Save**

5. **Repeat for All Variables**
   Add all 7 variables listed above.

6. **Redeploy Your Application**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on your latest deployment
   - Click **Redeploy**
   - Or simply push a new commit to trigger a new deployment

### Method 2: Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_ID

# Pull environment variables to verify
vercel env pull .env.local
```

---

## Where to Find Your Keys

### Supabase Keys
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. You'll see:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys**:
     - `anon` `public` → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` `secret` → Use for `SUPABASE_SERVICE_ROLE_KEY`

### Stripe Keys
1. Go to https://dashboard.stripe.com
2. Make sure you're in **Test mode** or **Live mode** (depending on your needs)
3. Go to **Developers** → **API keys**
4. You'll see:
   - **Publishable key** → Use for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → Use for `STRIPE_SECRET_KEY`

5. For Webhook Secret:
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint** or select existing webhook
   - Set endpoint URL to: `https://your-domain.vercel.app/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Click **Add endpoint**
   - Copy the **Signing secret** → Use for `STRIPE_WEBHOOK_SECRET`

6. For Subscription Webhook:
   - Add another webhook endpoint: `https://your-domain.vercel.app/api/subscriptions/webhook`
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (you can use the same one or create separate)

7. For Price ID:
   - Go to **Products** → Create or select your subscription product
   - Click on the product → **Pricing**
   - Copy the **Price ID** → Use for `STRIPE_PRICE_ID`

---

## Verification

After setting all variables:

1. **Redeploy your application** in Vercel
2. **Check the deployment logs** for any errors
3. **Test the application**:
   - Try signing in with Google
   - Try adding a book
   - Try purchasing a book (if Stripe is configured)

---

## Troubleshooting

### Variables not working?
- Make sure you selected the correct environments (Production, Preview, Development)
- Redeploy after adding variables
- Check that variable names match exactly (case-sensitive)
- For `NEXT_PUBLIC_*` variables, they need to be available at build time

### Still seeing errors?
- Check Vercel deployment logs
- Verify your keys are correct (no extra spaces, correct format)
- Make sure webhook URLs in Stripe match your Vercel deployment URL

---

## Security Notes

⚠️ **Important Security Reminders:**
- Never commit `.env` files to git
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `STRIPE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` should NEVER be in `NEXT_PUBLIC_*` variables
- Keep service role keys secret - they have admin access

