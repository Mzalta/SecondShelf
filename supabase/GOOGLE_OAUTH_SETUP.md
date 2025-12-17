# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: "SecondShelf"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes (optional for now)
   - Add test users if needed
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "SecondShelf Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `https://wtwaoadrqzfewlcyutba.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local development)
7. Click **Create**
8. **Copy the Client ID and Client Secret** - you'll need these next

## Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click on it
4. Toggle **Enable Google provider**
5. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **Save**

## Step 3: Update Redirect URLs in Google Console

After configuring Supabase, you need to add the Supabase callback URL to your Google OAuth credentials:

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   - `https://wtwaoadrqzfewlcyutba.supabase.co/auth/v1/callback`
5. Click **Save**

## Step 4: Test the Integration

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to a page with a sign-in button
3. Click "Sign in with Google"
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Make sure the redirect URI in Google Console exactly matches: `https://wtwaoadrqzfewlcyutba.supabase.co/auth/v1/callback`
   - Check for trailing slashes or typos

2. **"Access blocked" error**
   - If your app is in testing mode, add your email as a test user in Google OAuth consent screen
   - Or publish your OAuth consent screen

3. **Not redirecting back to app**
   - Check that your callback route is set up correctly at `app/auth/callback/route.ts`
   - Verify the redirect URL in the `signInWithGoogle` function matches your domain

## Production Deployment

When deploying to production:

1. Add your production domain to Google OAuth:
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/auth/callback`

2. Update the redirect URL in `lib/auth/auth.ts`:
   ```typescript
   redirectTo: `${window.location.origin}/auth/callback`
   ```
   This should automatically use the correct domain.

3. Make sure your production environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

