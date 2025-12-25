# Vercel Deployment Checklist for Stripe Integration

## ✅ Step 1: Set Environment Variables in Vercel

Go to your Vercel Dashboard and add these environment variables:

### Required Variables (9 total):

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://wtwaoadrqzfewlcyutba.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzk1ODYsImV4cCI6MjA4MTQxNTU4Nn0.C5ggqMzSNN0AT4stp8Ts0W-5GsOk1MS5qqYXMzsfLL0`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgzOTU4NiwiZXhwIjoyMDgxNDE1NTg2fQ.l8FdY4_MOCLBExpUW6yjXN6L1T4g6U1XcvrRwZdkgtI`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **STRIPE_SECRET_KEY**
   - Value: `sk_test_...` (Get from Stripe Dashboard → Developers → API keys)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

5. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - Value: `pk_test_...` (Get from Stripe Dashboard → Developers → API keys)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

6. **STRIPE_WEBHOOK_SECRET**
   - Value: `whsec_...` (Get from Stripe Dashboard → Developers → Webhooks)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

7. **STRIPE_PRICE_ID**
   - Value: `price_...` (Get from Stripe Dashboard → Products → Your product)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

8. **OPENAI_API_KEY**
   - Value: `sk-...` (Get from OpenAI Dashboard)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

### How to Add in Vercel:

1. Go to https://vercel.com/dashboard
2. Click on your **second-shelf** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** for each variable
5. Paste the value, select all environments (Production, Preview, Development)
6. Click **Save**

---

## ✅ Step 2: Push Code to Trigger Deployment

```bash
git push origin main
```

This will automatically trigger a new deployment in Vercel.

---

## ✅ Step 3: Update Stripe Webhook URLs

After deployment, update your Stripe webhook endpoints to point to your Vercel URL:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Update webhook endpoints to:
   - Payment webhook: `https://your-vercel-url.vercel.app/api/payments/webhook`
   - Subscription webhook: `https://your-vercel-url.vercel.app/api/subscriptions/webhook`
3. Copy the new **Signing secret** and update `STRIPE_WEBHOOK_SECRET` in Vercel if it changed

---

## ✅ Step 4: Test on Vercel

1. Visit your Vercel deployment URL
2. Sign in with Google
3. Try to purchase a book:
   - Browse books
   - Click "Buy Now" on a book
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC, any ZIP
4. Check that payment processes successfully

---

## 🔍 Troubleshooting

### If Stripe still doesn't work:

1. **Check Vercel deployment logs:**
   - Go to Vercel Dashboard → Your Project → Deployments → Click on latest deployment → View logs

2. **Verify environment variables:**
   - Make sure all 8 variables are set
   - Make sure they're enabled for the correct environments
   - Redeploy after adding variables

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed API calls

4. **Test API endpoint directly:**
   - Try: `https://your-vercel-url.vercel.app/api/payments/create-intent`
   - Should return an error (needs authentication), but confirms endpoint exists

---

## 📝 Notes

- Environment variables take effect after redeployment
- Always redeploy after adding/updating environment variables
- Test keys (`sk_test_`, `pk_test_`) are safe to use in production for testing
- Switch to live keys (`sk_live_`, `pk_live_`) when ready for real payments

