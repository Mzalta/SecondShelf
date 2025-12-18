# Fix: Redirect to localhost After Google Sign-In

## Problem
After signing in with Google, you're being redirected to `localhost` instead of your production URL.

## Root Cause
The redirect URLs in Supabase need to be configured to include your production domain.

## Solution: Update Supabase Redirect URLs

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: `wtwaoadrqzfewlcyutba`
3. Go to **Authentication** → **URL Configuration**

### Step 2: Update Site URL
Set **Site URL** to:
```
https://second-shelf.vercel.app
```

### Step 3: Update Redirect URLs
In the **Redirect URLs** section, add these URLs (one per line):
```
https://second-shelf.vercel.app/auth/callback
https://second-shelf.vercel.app/**
http://localhost:3000/auth/callback
```

The `/**` wildcard allows all routes under your domain.

### Step 4: Save Changes
Click **Save** at the bottom of the page.

## Also Check: Google Cloud Console

Make sure your Google OAuth credentials have the correct redirect URI:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, make sure you have:
   ```
   https://wtwaoadrqzfewlcyutba.supabase.co/auth/v1/callback
   ```
   (This is the Supabase callback URL - Google redirects here first, then Supabase redirects to your app)

## Why This Happens

The OAuth flow works like this:
1. User clicks "Sign in with Google" on your app
2. User is redirected to Google
3. User signs in with Google
4. Google redirects to: `https://wtwaoadrqzfewlcyutba.supabase.co/auth/v1/callback`
5. Supabase processes the auth and redirects to your app's callback URL
6. **If Supabase doesn't have your production URL in the allowed list, it defaults to localhost**

## After Making Changes

1. Wait a few seconds for Supabase to update
2. Try signing in again
3. You should now be redirected to `https://second-shelf.vercel.app` instead of localhost

## Quick Checklist

- [ ] Supabase Site URL = `https://second-shelf.vercel.app`
- [ ] Supabase Redirect URLs include `https://second-shelf.vercel.app/auth/callback`
- [ ] Google OAuth has Supabase callback URL: `https://wtwaoadrqzfewlcyutba.supabase.co/auth/v1/callback`
- [ ] Test sign-in flow again
