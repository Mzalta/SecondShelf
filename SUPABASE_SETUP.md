# Supabase Setup Guide

## Phase 1: Initial Setup

### Step 1: Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (or log in if you already have one)
3. Click "New Project"
4. Fill in the project details:
   - **Name**: Choose a name (e.g., "second-shelf")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to you
5. Wait for the project to be created (takes 1-2 minutes)

### Step 2: Get Your API Keys

1. Once your project is ready, go to **Settings** → **API**
2. You'll find two important values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Create Environment Variables File

1. Create a file named `.env.local` in the root of your project
2. Add the following content (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

### Step 4: Verify Installation

After creating `.env.local` with your credentials, restart your Next.js dev server:

```bash
npm run dev
```

The Supabase client is now configured and ready to use!

---

## Next Steps

Once you've completed Phase 1, we'll move on to:
- **Phase 2**: Creating the database tables
- **Phase 3**: Setting up the API service layer
- **Phase 4**: Updating the application code

