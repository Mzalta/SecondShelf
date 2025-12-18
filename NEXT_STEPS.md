# Next Steps - OpenAI Categorization Setup

## ✅ Step 1: OpenAI API Key - COMPLETED
The OpenAI API key has been added to your `.env.local` file.

## ⏳ Step 2: Run Database Migration

You need to add the `category` column to your `books` table. Since you don't have Supabase CLI installed, follow these steps:

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor:**
   - Click on **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run the Migration:**
   - Copy the entire SQL below
   - Paste it into the SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

```sql
-- Add category column to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for faster category searches
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);

-- Add comment to explain the category field
COMMENT ON COLUMN books.category IS 'Auto-categorized academic subject category (e.g., STEM - Computer Science, Humanities - Literature)';
```

4. **Verify the Migration:**
   - You should see "Success. No rows returned"
   - Go to **Table Editor** → `books` table
   - Check that the `category` column exists (it should be nullable TEXT)

### Option B: Quick Verification Query

After running the migration, you can verify it worked:

```sql
-- Check if category column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'books' AND column_name = 'category';
```

You should see a row with `category`, `text`, and `YES` (nullable).

---

## ⏳ Step 3: Test the Feature

### Test 1: Start Your Development Server

```bash
npm run dev
```

### Test 2: Test the API Endpoint Directly

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/books/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Computer Science",
    "author": "John Smith",
    "course": "CS 101"
  }'
```

**Expected Response:**
```json
{
  "category": "STEM - Computer Science"
}
```

If you see an error about the API key, make sure:
- The `.env.local` file has `OPENAI_API_KEY` set
- You've restarted your dev server after adding the key

### Test 3: Test in the UI

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to the Add Book page:**
   - Go to: http://localhost:3000/add
   - Make sure you're signed in

3. **Fill in the form:**
   - **Title:** "Introduction to Computer Science"
   - **Author:** "John Smith"
   - **Course:** "CS 101"

4. **Watch for auto-categorization:**
   - After 1.5 seconds, the category field should auto-populate
   - You should see: "✓ Category: STEM - Computer Science"

5. **Or click the "Categorize" button:**
   - Click the button with the sparkles icon
   - Category should appear immediately

6. **Complete and submit the form:**
   - Fill in the remaining fields (price, contact, your name)
   - Submit the form
   - Check the homepage - the book card should show the category

---

## ⏳ Step 4: Deploy to Production (Vercel)

When you're ready to deploy:

1. **Add Environment Variable in Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add:
     - **Key:** `OPENAI_API_KEY`
     - **Value:** (your OpenAI API key from .env.local)
     - **Environment:** Production, Preview, Development (select all)
   - Click **Save**

2. **Redeploy:**
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Click **Redeploy**

3. **Run Migration on Production Database:**
   - Use the same SQL from Step 2 in your production Supabase project

---

## Troubleshooting

### Issue: "OpenAI API key is not configured"
**Solution:** 
- Make sure `.env.local` has `OPENAI_API_KEY=your-key`
- Restart your dev server: Stop (Ctrl+C) and run `npm run dev` again

### Issue: Category not appearing
**Solution:**
- Check browser console (F12) for errors
- Check Network tab to see if API call is being made
- Verify the API endpoint is working (Test 2 above)

### Issue: Database error when saving
**Solution:**
- Make sure you ran the migration (Step 2)
- Verify the `category` column exists in your `books` table

### Issue: API returns error
**Solution:**
- Check that your OpenAI API key is valid
- Check your OpenAI account has credits/usage available
- Verify the key format is correct (starts with `sk-`)

---

## What's Next?

Once everything is working:
- ✅ Test with different book types to see various categories
- ✅ Check that categories display on book cards
- ✅ Consider adding category filtering on the homepage (future enhancement)

---

**Status:** 
- ✅ API Key configured
- ⏳ Database migration needed
- ⏳ Testing needed
- ⏳ Production deployment needed
