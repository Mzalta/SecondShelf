# Database Setup Instructions

## Phase 2: Create Database Tables

Follow these steps to create the database tables in your Supabase project.

### Step 1: Open SQL Editor in Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Books Table Migration

1. Copy the entire contents of `supabase/migrations/001_create_books_table.sql`
2. Paste it into the SQL Editor
3. Click **Run** (or press Cmd/Ctrl + Enter)
4. You should see "Success. No rows returned"

This will create:
- `books` table with all required fields
- Indexes for faster searches
- Automatic `updated_at` timestamp trigger
- Row Level Security (RLS) policies allowing public read/write access

### Step 3: Run the Favorites Table Migration

1. Copy the entire contents of `supabase/migrations/002_create_favorites_table.sql`
2. Paste it into the SQL Editor
3. Click **Run**
4. You should see "Success. No rows returned"

This will create:
- `favorites` table for storing favorite book IDs
- Indexes for faster lookups
- Row Level Security (RLS) policies

### Step 4: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see two tables:
   - `books`
   - `favorites`

### Step 5: (Optional) Test the Setup

You can test by inserting a sample book:

```sql
INSERT INTO books (title, author, course, price, contact, poster)
VALUES (
  'Introduction to Computer Science',
  'John Doe',
  'CS101',
  '$50',
  'john@example.com',
  'John Doe'
);
```

Then query it:

```sql
SELECT * FROM books;
```

---

## Database Schema Overview

### `books` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to auth.users (nullable, for authenticated users) |
| `title` | TEXT | Book title (required) |
| `author` | TEXT | Book author (required) |
| `course` | TEXT | Course code (required) |
| `price` | TEXT | Price (required) |
| `contact` | TEXT | Contact information (required) |
| `poster` | TEXT | Name of person posting (optional) |
| `sold` | BOOLEAN | Whether book is sold (default: false) |
| `created_at` | TIMESTAMP | Auto-set on creation |
| `updated_at` | TIMESTAMP | Auto-updated on modification |

### `favorites` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to auth.users (required) |
| `book_id` | UUID | Foreign key to books table |
| `created_at` | TIMESTAMP | Auto-set on creation |

---

## Security Notes

The RLS policies are configured for authenticated users:

- **Books**: Anyone can read, but only authenticated users can create books. Users can only update/delete their own books.
- **Favorites**: Users can only see and manage their own favorites.

This ensures data privacy and security while allowing public browsing of book listings.

---

## Next Steps

Once the tables are created, we'll move to **Phase 3**: Creating the API service layer to interact with these tables.

