# Vercel Environment Variables Setup - Quick Guide

## Your Supabase Credentials

✅ **Project URL:** `https://wtwaoadrqzfewlcyutba.supabase.co`  
✅ **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzk1ODYsImV4cCI6MjA4MTQxNTU4Nn0.C5ggqMzSNN0AT4stp8Ts0W-5GsOk1MS5qqYXMzsfLL0`

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard
1. Visit: https://vercel.com
2. Sign in to your account
3. Click on your **second-shelf** project

### 2. Navigate to Environment Variables
1. Click on **Settings** in the top navigation
2. Click on **Environment Variables** in the left sidebar

### 3. Add First Variable: NEXT_PUBLIC_SUPABASE_URL
1. Click **Add New** button
2. Enter:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://wtwaoadrqzfewlcyutba.supabase.co`
   - **Environment:** Check all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
3. Click **Save**

### 4. Add Second Variable: NEXT_PUBLIC_SUPABASE_ANON_KEY
1. Click **Add New** button again
2. Enter:
   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzk1ODYsImV4cCI6MjA4MTQxNTU4Nn0.C5ggqMzSNN0AT4stp8Ts0W-5GsOk1MS5qqYXMzsfLL0`
   - **Environment:** Check all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Click **Save**

### 5. Redeploy Your Application
After adding the variables, you need to redeploy:

**Option A: Automatic Redeploy (Recommended)**
- Just push a new commit to trigger a new deployment
- Or wait a few minutes and Vercel will detect the new env vars

**Option B: Manual Redeploy**
1. Go to the **Deployments** tab
2. Click the **⋯** (three dots) on your latest deployment
3. Click **Redeploy**
4. Make sure to check **Use existing Build Cache** is OFF (to pick up new env vars)

## Verification Checklist

After redeploying, verify:
- [ ] Both variables are listed in Environment Variables
- [ ] Both are enabled for Production, Preview, and Development
- [ ] New deployment has completed successfully
- [ ] Visit https://second-shelf.vercel.app and try signing in

## Direct Link to Your Vercel Project

If you're logged in, you can go directly to:
https://vercel.com/mzaltas-projects/second-shelf/settings/environment-variables

## Troubleshooting

If sign-in still doesn't work after adding variables:
1. Make sure you **redeployed** after adding the variables
2. Check the browser console (F12) for any errors
3. Verify the variable names are exactly:
   - `NEXT_PUBLIC_SUPABASE_URL` (case-sensitive)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (case-sensitive)
4. Check that there are no extra spaces in the values
