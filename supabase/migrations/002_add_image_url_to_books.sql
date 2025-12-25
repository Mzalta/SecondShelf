-- Add image_url column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS image_url TEXT;

