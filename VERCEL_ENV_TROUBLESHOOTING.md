# Vercel Environment Variables Troubleshooting

## Quick Diagnostic Steps

### 1. Check if Variables are Set in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **second-shelf**
3. Go to **Settings** → **Environment Variables**
4. Verify you see all 7 variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Check Environment Scoping

For **EACH** variable, click on it and verify:
- ✅ **Production** is checked
- ✅ **Preview** is checked  
- ✅ **Development** is checked

**Common Issue**: If you only checked "Production", the variables won't be available in Preview deployments!

### 3. Verify Variable Values

Click on each variable to see:
- **Key**: Should match exactly (case-sensitive)
- **Value**: Should be the full key/secret (not truncated)

### 4. Test with Diagnostic Endpoint

After redeploying, visit:
```
https://your-project.vercel.app/api/debug/env
```

This will show:
- Which variables are loaded
- What environment you're in (Production/Preview)
- First few characters of keys (for verification)

### 5. Check Deployment Logs

In Vercel Dashboard → **Deployments** → Click on your deployment → **Logs**

Look for:
- Any errors about missing environment variables
- Build-time errors
- Runtime errors

## Common Issues & Solutions

### Issue: "Stripe secret key is not configured"

**Cause**: `STRIPE_SECRET_KEY` not set or not available in the deployment environment

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Find `STRIPE_SECRET_KEY`
3. Click on it
4. Make sure **Production**, **Preview**, and **Development** are all checked
5. Click **Save**
6. **Redeploy** your project

### Issue: Variables work locally but not on Vercel

**Cause**: Variables only set in `.env.local` (local file), not in Vercel

**Solution**:
1. Copy values from your `.env.local` file
2. Add them to Vercel Dashboard → Settings → Environment Variables
3. Make sure all environments are checked
4. Redeploy

### Issue: Variables work in Production but not Preview

**Cause**: Variables only scoped to Production environment

**Solution**:
1. Go to each variable in Vercel
2. Check **Preview** checkbox
3. Click **Save**
4. Redeploy

### Issue: Build succeeds but runtime errors occur

**Cause**: Variables might be set but not accessible at runtime

**Solution**:
1. Verify variables are set (not just during build)
2. Check that `NEXT_PUBLIC_*` variables are for client-side
3. Check that server-only variables (like `STRIPE_SECRET_KEY`) are set
4. Restart/redeploy after adding variables

## Verification Checklist

- [ ] All 7 required variables are in Vercel
- [ ] Each variable has Production, Preview, and Development checked
- [ ] Variable names match exactly (case-sensitive)
- [ ] Values are complete (not truncated)
- [ ] Project has been redeployed after adding variables
- [ ] Diagnostic endpoint shows variables are loaded
- [ ] No errors in deployment logs

## Quick Fix Script

If you have Vercel CLI installed:

```bash
# Verify you're logged in
vercel whoami

# List all environment variables
vercel env ls

# Check specific variable
vercel env pull .env.vercel
cat .env.vercel
```

## Still Having Issues?

1. **Check the diagnostic endpoint**: `/api/debug/env`
2. **Check Vercel logs**: Dashboard → Deployments → Logs
3. **Verify variable names**: Must match exactly (case-sensitive)
4. **Redeploy**: Variables only take effect after redeployment
5. **Check environment**: Make sure you're testing the right environment (Production vs Preview)

