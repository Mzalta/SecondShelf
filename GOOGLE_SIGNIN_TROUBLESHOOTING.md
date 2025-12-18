# Google Sign-In Troubleshooting Guide

## Issue: Sign-in button does nothing when clicked

This is typically caused by missing or incorrect OAuth configuration in Supabase or Google Cloud Console.

## Step 1: Verify Supabase Configuration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Check the following settings:

### Site URL
Should be set to: `https://second-shelf.vercel.app`

### Redirect URLs
Must include:
- `https://second-shelf.vercel.app/auth/callback`
- `https://second-shelf.vercel.app/**` (wildcard for all routes)
- `http://localhost:3000/auth/callback` (for local development)

## Step 2: Verify Google OAuth Provider is Enabled

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Make sure it's **Enabled** (toggle should be ON)
4. Verify that **Client ID** and **Client Secret** are filled in

## Step 3: Verify Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID

### Authorized JavaScript origins
Must include:
- `https://second-shelf.vercel.app`
- `http://localhost:3000` (for local development)

### Authorized redirect URIs
Must include:
- `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
  - Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference
  - You can find this in your Supabase dashboard URL or in your `NEXT_PUBLIC_SUPABASE_URL` environment variable
- `http://localhost:3000/auth/callback` (for local development)

**Important:** The Supabase callback URL format is:
```
https://[PROJECT_REF].supabase.co/auth/v1/callback
```

## Step 4: Check Environment Variables in Vercel

Make sure these are set in your Vercel project:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these variables exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 5: Test the Sign-In Flow

After making the above changes:

1. Wait for Vercel to redeploy (or manually redeploy)
2. Open your browser's Developer Console (F12)
3. Click "Sign In with Google"
4. Check the console for any error messages
5. If there's an error, you should now see an alert with details

## Common Errors and Solutions

### Error: "redirect_uri_mismatch"
- **Cause:** The redirect URI in Google Console doesn't match what Supabase expects
- **Solution:** Make sure you've added the Supabase callback URL: `https://[PROJECT_REF].supabase.co/auth/v1/callback`

### Error: "Access blocked: This app's request is invalid"
- **Cause:** OAuth consent screen not configured or app in testing mode
- **Solution:** 
  - Go to Google Cloud Console → APIs & Services → OAuth consent screen
  - Add your email as a test user, OR
  - Publish the app (if ready for production)

### Error: "Missing Supabase environment variables"
- **Cause:** Environment variables not set in Vercel
- **Solution:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables

### Button does nothing / No error shown
- **Cause:** JavaScript error preventing the function from running
- **Solution:** 
  - Open browser console (F12)
  - Look for red error messages
  - Check if Supabase client is initializing correctly

## Quick Checklist

- [ ] Supabase Site URL set to `https://second-shelf.vercel.app`
- [ ] Supabase Redirect URLs include `https://second-shelf.vercel.app/auth/callback`
- [ ] Google OAuth provider enabled in Supabase
- [ ] Google Client ID and Secret configured in Supabase
- [ ] Google Cloud Console has `https://second-shelf.vercel.app` in Authorized JavaScript origins
- [ ] Google Cloud Console has Supabase callback URL in Authorized redirect URIs
- [ ] Environment variables set in Vercel
- [ ] Vercel deployment is up to date

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check Vercel deployment logs for any build/runtime errors
3. Verify your Supabase project is active and not paused
4. Test with a different browser or incognito mode
5. Make sure you're not blocking third-party cookies (some browsers do this by default)
