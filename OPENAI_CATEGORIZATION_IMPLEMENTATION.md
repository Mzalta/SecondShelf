# OpenAI Auto-Categorization Implementation Guide

This document provides a step-by-step guide for implementing the OpenAI auto-categorization feature for books in SecondShelf.

## Overview

The auto-categorization feature uses OpenAI's GPT-3.5-turbo model to automatically categorize textbooks into predefined academic categories based on the book's title, author, and course information.

## Implementation Steps

### Step 1: Install OpenAI SDK

```bash
npm install openai
```

✅ **Status:** Completed

### Step 2: Set Up Environment Variables

Add your OpenAI API key to your environment variables:

1. Create or update `.env.local` file in the project root:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

2. For production (Vercel), add the environment variable in your Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `OPENAI_API_KEY` with your API key value

✅ **Status:** Ready for configuration

### Step 3: Database Migration

Run the migration to add the `category` column to the `books` table:

**File:** `supabase/migrations/006_add_category_to_books.sql`

To apply the migration:

1. **Using Supabase CLI:**
```bash
supabase db push
```

2. **Or manually in Supabase Dashboard:**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `006_add_category_to_books.sql`
   - Execute the SQL

✅ **Status:** Migration file created, ready to run

### Step 4: Backend API Route

**File:** `app/api/books/categorize/route.ts`

This API route:
- Accepts POST requests with `title`, `author`, and `course`
- Calls OpenAI API to categorize the book
- Returns a category from predefined academic categories
- Handles errors gracefully

**Categories:**
- STEM (Computer Science, Mathematics, Engineering, Natural Sciences, Health Sciences)
- Humanities (Literature, History, Philosophy, Languages)
- Social Sciences (Psychology, Sociology, Economics, Political Science)
- Business (Management, Finance, Marketing)
- Arts (Visual Arts, Performing Arts)
- Education
- Other

✅ **Status:** Completed

### Step 5: Frontend API Utility

**File:** `lib/api/categorize.ts`

This utility function:
- Makes HTTP requests to the categorization API
- Handles errors and returns the category string
- Provides TypeScript types for request/response

✅ **Status:** Completed

### Step 6: Type Definitions Update

Updated type definitions to include `category` field:

**Files Updated:**
- `types/index.ts` - Added `category?: string` to `Book` and `BookFormData` interfaces
- `types/supabase.ts` - Added `category: string | null` to `DatabaseBook` interface

✅ **Status:** Completed

### Step 7: Books API Update

**File:** `lib/api/books.ts`

Updated helper functions to handle the `category` field:
- `dbBookToBook()` - Maps database category to app format
- `bookToDbFormat()` - Maps app category to database format

✅ **Status:** Completed

### Step 8: Add Book Form Integration

**File:** `app/add/page.tsx`

Features added:
- Category input field (read-only, auto-filled)
- Auto-categorization trigger when title, author, and course are filled (1.5s debounce)
- Manual "Categorize" button with loading state
- Error handling and success feedback
- Category display with visual indicator

✅ **Status:** Completed

### Step 9: Book Display Update

**File:** `components/features/books/BookCard.tsx`

Updated to display the category on book cards when available.

✅ **Status:** Completed

## Testing the Implementation

### 1. Test the API Route Directly

```bash
curl -X POST http://localhost:3000/api/books/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Computer Science",
    "author": "John Smith",
    "course": "CS 101"
  }'
```

Expected response:
```json
{
  "category": "STEM - Computer Science"
}
```

### 2. Test in the UI

1. Navigate to `/add` page
2. Fill in:
   - Title: "Introduction to Computer Science"
   - Author: "John Smith"
   - Course: "CS 101"
3. Wait 1.5 seconds - category should auto-populate
4. Or click "Categorize" button manually
5. Verify category appears in the field
6. Submit the form
7. Check the book card on homepage - category should be displayed

## API Costs

**Model Used:** `gpt-3.5-turbo`
**Estimated Cost:** ~$0.0001-0.0002 per categorization
- Very cost-effective for this use case
- Consider caching results for identical book entries

## Error Handling

The implementation includes error handling for:
- Missing OpenAI API key
- Invalid request data
- OpenAI API errors
- Network failures
- Timeout scenarios

## Future Enhancements

1. **Caching:** Cache categorization results to avoid redundant API calls
2. **Batch Categorization:** Categorize multiple books at once
3. **Category Filtering:** Add filter by category on homepage
4. **Category Statistics:** Show category distribution
5. **Custom Categories:** Allow users to override auto-categorization
6. **Category Suggestions:** Show related categories

## Troubleshooting

### Issue: "OpenAI API key is not configured"
**Solution:** Ensure `OPENAI_API_KEY` is set in `.env.local` or Vercel environment variables

### Issue: Category not appearing
**Solution:** 
- Check browser console for errors
- Verify API route is accessible
- Check network tab for API response

### Issue: Database error when saving
**Solution:** 
- Ensure migration `006_add_category_to_books.sql` has been run
- Verify `category` column exists in `books` table

## Files Modified/Created

### Created:
- `app/api/books/categorize/route.ts` - API route
- `lib/api/categorize.ts` - Frontend utility
- `supabase/migrations/006_add_category_to_books.sql` - Database migration
- `OPENAI_CATEGORIZATION_IMPLEMENTATION.md` - This guide

### Modified:
- `app/add/page.tsx` - Added category field and auto-categorization
- `components/features/books/BookCard.tsx` - Display category
- `types/index.ts` - Added category to types
- `types/supabase.ts` - Added category to database types
- `lib/api/books.ts` - Handle category in CRUD operations
- `package.json` - Added `openai` dependency

## Next Steps

1. ✅ Install OpenAI package
2. ⏳ Add `OPENAI_API_KEY` to environment variables
3. ⏳ Run database migration
4. ✅ Test the feature
5. ✅ Deploy to production

---

**Implementation Date:** December 2024
**Status:** Ready for testing and deployment
