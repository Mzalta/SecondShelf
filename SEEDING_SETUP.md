# Database Seeding Setup Guide

## Quick Start

Your seeding API endpoint is ready at: `POST /api/admin/seed-listings`

## Step 1: Verify Deployment

1. **Check if Vercel has deployed your latest code:**
   - Go to https://vercel.com/dashboard
   - Find your `SecondShelf` project
   - Check the latest deployment status
   - If it shows "Ready", proceed to Step 2
   - If it's still building, wait for it to complete

2. **Your Vercel URL should be:** `https://second-shelf.vercel.app`

## Step 2: Set Environment Variables (Optional but Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add a new variable:
   - **Key:** `SEED_SECRET_KEY`
   - **Value:** (Generate a secure random string, e.g., `openssl rand -hex 32`)
   - **Environments:** Production, Preview, Development (all)
3. Click "Save"

**Note:** If you skip this step, the endpoint will still work but won't be protected.

## Step 3: Verify Environment Variables Exist

Ensure these are already set in Vercel:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ `SEED_SECRET_KEY` (optional)

## Step 4: Trigger the Seeding

### Option A: Using curl (Command Line)

**If you set SEED_SECRET_KEY:**
```bash
curl -X POST https://second-shelf.vercel.app/api/admin/seed-listings \
  -H "X-Seed-Secret: your-secret-key-here" \
  -H "Content-Type: application/json"
```

**If you did NOT set SEED_SECRET_KEY:**
```bash
curl -X POST https://second-shelf.vercel.app/api/admin/seed-listings \
  -H "Content-Type: application/json"
```

### Option B: Using Browser/Postman

1. URL: `https://second-shelf.vercel.app/api/admin/seed-listings`
2. Method: `POST`
3. Headers:
   - `Content-Type: application/json`
   - `X-Seed-Secret: your-secret-key` (only if you set SEED_SECRET_KEY)
4. Click Send

### Option C: Check Status First

```bash
curl https://second-shelf.vercel.app/api/admin/seed-listings
```

## Step 5: Expected Response

### Success:
```json
{
  "success": true,
  "inserted": 187,
  "generated": 187,
  "message": "Successfully inserted 187 listings"
}
```

### Skipped (if >50 listings already exist):
```json
{
  "success": true,
  "skipped": true,
  "message": "Skipped: 75 listings already exist (threshold: 50)"
}
```

### Error:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Troubleshooting

### "404 Not Found"
- ✅ Wait for Vercel deployment to complete
- ✅ Check that the route file exists: `app/api/admin/seed-listings/route.ts`

### "Supabase configuration is missing"
- ✅ Verify `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- ✅ Redeploy after adding environment variables

### "Unauthorized: Invalid seed secret"
- ✅ Check that `X-Seed-Secret` header matches `SEED_SECRET_KEY`
- ✅ Or remove `SEED_SECRET_KEY` from Vercel to disable protection

### "No users found"
- ✅ You need at least one user in your `profiles` table
- ✅ Create a user by signing up through your app first

## Verify Seeding Worked

1. Go to your Supabase Dashboard
2. Navigate to Table Editor → `books` table
3. You should see 150-200 new listings

## What Gets Created

- **150-200 textbook listings** across 35 popular textbooks
- **Variations include:**
  - Different conditions (New, Like New, Very Good, Good, Acceptable)
  - Realistic prices based on condition
  - Random solutions manuals (30% chance)
  - Random access codes (20% chance)
  - Descriptive text and tags
  - Placeholder images from Lorem Picsum

## Need Help?

If you encounter issues, check:
1. Vercel deployment logs
2. Vercel function logs (for the API route)
3. Supabase logs (for database errors)

