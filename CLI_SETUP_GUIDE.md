# CLI Setup Guide - Access Tokens Needed

## What We Need

To automate the Supabase migration and Vercel environment variable setup, we need:

### 1. Supabase Access Token (for running migrations)

**How to get it:**
1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Give it a name (e.g., "CLI Access Token")
4. Copy the token (you'll only see it once!)

**What it's used for:**
- Linking Supabase CLI to your project
- Running database migrations automatically

---

### 2. Vercel Access Token (optional, for automation)

**How to get it:**
1. Go to: https://vercel.com/account/tokens
2. Click **Create Token**
3. Give it a name (e.g., "CLI Token")
4. Set expiration (or leave as "No expiration")
5. Copy the token

**What it's used for:**
- Adding environment variables via CLI
- Deploying without manual steps

---

## What I Can Do With These Tokens

✅ **With Supabase Token:**
- Link your project automatically
- Run the migration (`006_add_category_to_books.sql`) automatically
- Verify the migration succeeded

✅ **With Vercel Token:**
- Add `OPENAI_API_KEY` to your Vercel project automatically
- Set it for all environments (production, preview, development)

---

## Alternative: Manual Steps (No Tokens Needed)

If you prefer not to share tokens, I can guide you through:

1. **Supabase Migration:**
   - Copy SQL from the migration file
   - Paste in Supabase SQL Editor
   - Click Run

2. **Vercel Environment Variable:**
   - Go to Vercel dashboard
   - Add the environment variable manually

---

## Security Note

These tokens give access to your projects. You can:
- Revoke them anytime from the dashboard
- Set expiration dates
- Use them only for this setup, then revoke

**I recommend:**
- Generate tokens just for this setup
- Revoke them after we're done
- Or set a short expiration (e.g., 1 day)

---

## Ready to Proceed?

If you want me to automate everything, please provide:
1. Supabase Access Token
2. Vercel Access Token (optional)
3. Your Vercel project name (if you know it)

Then I'll:
- ✅ Run the migration automatically
- ✅ Add environment variables to Vercel
- ✅ Verify everything works
