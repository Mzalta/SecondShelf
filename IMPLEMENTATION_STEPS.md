# Step-by-Step Implementation: OpenAI Auto-Categorization

## Quick Start Checklist

- [x] **Step 1:** Install OpenAI SDK (`npm install openai`)
- [x] **Step 2:** Create API route (`/app/api/books/categorize/route.ts`)
- [x] **Step 3:** Update TypeScript types (add `category` field)
- [x] **Step 4:** Create frontend API utility (`/lib/api/categorize.ts`)
- [x] **Step 5:** Update database migration (`/supabase/migrations/006_add_category_to_books.sql`)
- [x] **Step 6:** Update books API to handle category (`/lib/api/books.ts`)
- [x] **Step 7:** Integrate into Add Book form (`/app/add/page.tsx`)
- [x] **Step 8:** Display category in BookCard (`/components/features/books/BookCard.tsx`)
- [ ] **Step 9:** Add OpenAI API key to environment variables
- [ ] **Step 10:** Run database migration

---

## Detailed Implementation Steps

### Step 1: Backend - API Route Creation

**File:** `app/api/books/categorize/route.ts`

**What it does:**
- Accepts POST requests with book information (title, author, course)
- Calls OpenAI GPT-3.5-turbo to categorize the book
- Returns one of 20 predefined academic categories
- Handles errors gracefully

**Key Features:**
- Environment variable validation
- Input validation
- Error handling for API failures
- Category validation (ensures response matches predefined list)

---

### Step 2: Frontend - API Utility Function

**File:** `lib/api/categorize.ts`

**What it does:**
- Provides a clean TypeScript interface to call the categorization API
- Handles HTTP requests and responses
- Provides type safety with interfaces

**Usage:**
```typescript
import { categorizeBook } from '@/lib/api/categorize'

const category = await categorizeBook({
  title: "Introduction to Computer Science",
  author: "John Smith",
  course: "CS 101"
})
```

---

### Step 3: Database Schema Update

**File:** `supabase/migrations/006_add_category_to_books.sql`

**What it does:**
- Adds `category` column to `books` table (nullable TEXT)
- Creates index for faster category-based searches
- Adds documentation comment

**To apply:**
```bash
supabase db push
```
Or manually run the SQL in Supabase dashboard.

---

### Step 4: Type Definitions Update

**Files Modified:**
- `types/index.ts` - Added `category?: string` to `Book` and `BookFormData`
- `types/supabase.ts` - Added `category: string | null` to `DatabaseBook`

**Why:** Ensures TypeScript knows about the new field throughout the codebase.

---

### Step 5: Books API Update

**File:** `lib/api/books.ts`

**Changes:**
- Updated `dbBookToBook()` to map category from database
- Updated `bookToDbFormat()` to include category when saving

**Why:** Ensures category is properly saved and retrieved from the database.

---

### Step 6: Add Book Form Integration

**File:** `app/add/page.tsx`

**Features Added:**
1. **Category Input Field:**
   - Read-only field (auto-filled)
   - Shows "Category will be auto-suggested..." placeholder
   - Displays success indicator when category is set

2. **Auto-Categorization:**
   - Automatically triggers 1.5 seconds after user fills title, author, and course
   - Only runs if category field is empty
   - Debounced to avoid excessive API calls

3. **Manual Categorize Button:**
   - Sparkles icon button
   - Allows users to manually trigger categorization
   - Shows loading state ("Categorizing...")
   - Disabled if required fields are missing

4. **Error Handling:**
   - Displays error messages if categorization fails
   - Shows success message with category name

5. **Form Schema Update:**
   - Added `category` as optional field in Zod schema

---

### Step 7: Book Display Update

**File:** `components/features/books/BookCard.tsx`

**Changes:**
- Added category display in book card
- Shows category with blue highlight when available
- Positioned between course and price for visibility

---

## Configuration Required

### Environment Variables

**Local Development:**
Create `.env.local`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Environment: Production, Preview, Development

### Database Migration

Run the migration to add the category column:
```bash
supabase db push
```

Or in Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/006_add_category_to_books.sql`
3. Execute

---

## Testing

### Test API Route
```bash
curl -X POST http://localhost:3000/api/books/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Computer Science",
    "author": "John Smith",
    "course": "CS 101"
  }'
```

### Test in UI
1. Navigate to `/add`
2. Fill in title, author, course
3. Wait 1.5 seconds or click "Categorize"
4. Verify category appears
5. Submit form
6. Check book card shows category

---

## Categories Available

The system categorizes books into these 20 categories:

**STEM:**
- Computer Science
- Mathematics
- Engineering
- Natural Sciences
- Health Sciences

**Humanities:**
- Literature
- History
- Philosophy
- Languages

**Social Sciences:**
- Psychology
- Sociology
- Economics
- Political Science

**Business:**
- Management
- Finance
- Marketing

**Arts:**
- Visual Arts
- Performing Arts

**Other:**
- Education
- Other (fallback)

---

## Cost Estimation

- **Model:** GPT-3.5-turbo
- **Cost per request:** ~$0.0001-0.0002
- **1000 categorizations:** ~$0.10-0.20
- Very cost-effective for this use case

---

## Files Summary

### Created (4 files):
1. `app/api/books/categorize/route.ts` - Backend API route
2. `lib/api/categorize.ts` - Frontend API utility
3. `supabase/migrations/006_add_category_to_books.sql` - Database migration
4. `OPENAI_CATEGORIZATION_IMPLEMENTATION.md` - Detailed documentation

### Modified (6 files):
1. `app/add/page.tsx` - Added category field and auto-categorization
2. `components/features/books/BookCard.tsx` - Display category
3. `types/index.ts` - Added category to types
4. `types/supabase.ts` - Added category to database types
5. `lib/api/books.ts` - Handle category in CRUD operations
6. `package.json` - Added `openai` dependency (via npm install)

---

## Next Steps

1. ✅ Code implementation complete
2. ⏳ Add `OPENAI_API_KEY` to `.env.local` and Vercel
3. ⏳ Run database migration
4. ⏳ Test the feature
5. ⏳ Deploy to production

---

**Status:** Implementation complete, ready for configuration and testing!
