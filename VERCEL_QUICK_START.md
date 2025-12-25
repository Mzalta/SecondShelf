# Quick Start: Deploy Stripe Payments to Vercel

This is a quick reference guide to get Stripe payments working on Vercel.

## 🚀 Quick Setup (3 Steps)

### Step 1: Set Environment Variables

**Option A: Use the automated script**
```bash
./scripts/setup-vercel-stripe.sh
```

**Option B: Manual setup**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables
2. Add these 4 Stripe variables (get values from your `.env.local`):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Enable for: Production, Preview, Development

### Step 2: Redeploy

In Vercel Dashboard:
- Go to Deployments → Click ⋯ on latest deployment → Redeploy

Or push a new commit:
```bash
git push origin main
```

### Step 3: Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Add endpoint: `https://your-project.vercel.app/api/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.*`
   - `invoice.payment_*`
4. Copy the signing secret → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

## ✅ Verify Setup

Run the verification script:
```bash
node scripts/verify-vercel-env.js
```

## 🧪 Test

1. Visit: `https://your-project.vercel.app/subscription`
2. Sign in with Google
3. Click "Subscribe to Pro"
4. Use test card: `4242 4242 4242 4242`

## 📚 Full Documentation

See `VERCEL_STRIPE_SETUP.md` for detailed instructions.

## 🆘 Troubleshooting

**"Stripe secret key is not configured"**
- Verify `STRIPE_SECRET_KEY` is set in Vercel
- Redeploy after adding variables

**"Unauthorized"**
- Sign in with Google first
- The page should show a sign-in button

**Webhooks not working**
- Verify webhook URL matches your Vercel deployment URL
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe signing secret
- Check Vercel deployment logs

