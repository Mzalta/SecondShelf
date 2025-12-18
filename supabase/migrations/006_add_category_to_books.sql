-- Add category column to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for faster category searches
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);

-- Add comment to explain the category field
COMMENT ON COLUMN books.category IS 'Auto-categorized academic subject category (e.g., STEM - Computer Science, Humanities - Literature)';
