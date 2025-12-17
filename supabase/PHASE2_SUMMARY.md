# Phase 2 Complete: Database Schema with Google OAuth

## ✅ What's Been Done

### 1. Updated Database Migrations

**`001_create_books_table.sql`:**
- Added `user_id` column (references `auth.users`)
- Updated RLS policies:
  - Anyone can **read** books (public browsing)
  - Only authenticated users can **create** books
  - Users can only **update/delete** their own books

**`002_create_favorites_table.sql`:**
- Added `user_id` column (references `auth.users`)
- Changed unique constraint to `(user_id, book_id)` - users can favorite the same book
- Updated RLS policies:
  - Users can only **read/insert/delete** their own favorites

### 2. Created Authentication Infrastructure

**Files Created:**
- `lib/supabase/server.ts` - Server-side Supabase client for Next.js
- `lib/auth/auth.ts` - Auth helper functions (signInWithGoogle, signOut, getCurrentUser)
- `app/auth/callback/route.ts` - OAuth callback handler
- `middleware.ts` - Session refresh middleware for Next.js

### 3. Updated Type Definitions

- `types/supabase.ts` - Added `user_id` to DatabaseBook and DatabaseFavorite
- `types/index.ts` - Added `userId` to Book interface

### 4. Documentation

- `supabase/GOOGLE_OAUTH_SETUP.md` - Complete guide for setting up Google OAuth
- Updated `supabase/DATABASE_SETUP.md` - Reflects user authentication changes

## 🔧 What You Need to Do

### Step 1: Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run `001_create_books_table.sql`
3. Run `002_create_favorites_table.sql`
4. Verify tables exist in Table Editor

### Step 2: Set Up Google OAuth

Follow the instructions in `supabase/GOOGLE_OAUTH_SETUP.md`:

1. Create Google OAuth credentials in Google Cloud Console
2. Configure Google provider in Supabase Dashboard
3. Add redirect URIs to Google OAuth settings

**Important Redirect URI:**
```
https://wtwaoadrqzfewlcyutba.supabase.co/auth/v1/callback
```

### Step 3: Test Authentication

Once OAuth is configured, you can test by:
1. Starting your dev server: `npm run dev`
2. Using the `signInWithGoogle()` function from `lib/auth/auth.ts`
3. Verifying the callback route works

## 📋 Next Steps

After completing the above:
- **Phase 3**: Create database service layer (API functions)
- **Phase 4**: Update Zustand store and components to use Supabase
- **Phase 5**: Test and handle errors

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only modify their own data
- Public read access for book listings (anyone can browse)
- Authenticated-only write access (must sign in to post)

