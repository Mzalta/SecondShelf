-- Add additional fields to books table for enhanced listings
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS isbn TEXT,
ADD COLUMN IF NOT EXISTS edition TEXT,
ADD COLUMN IF NOT EXISTS condition_text TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING GIN(tags);

-- Add comments to explain the fields
COMMENT ON COLUMN books.isbn IS 'International Standard Book Number';
COMMENT ON COLUMN books.edition IS 'Book edition (e.g., 5th Edition, 2023 Edition)';
COMMENT ON COLUMN books.condition_text IS 'Detailed condition description (e.g., light highlighting, cover bent, no tears)';
COMMENT ON COLUMN books.description IS 'Full listing description';
COMMENT ON COLUMN books.tags IS 'Array of searchable tags/keywords';

