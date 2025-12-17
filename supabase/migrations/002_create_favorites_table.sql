-- Create favorites table
-- This table stores user favorites by book ID
-- Each favorite is linked to a specific user

CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_book_id ON favorites(book_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own favorites (SELECT)
CREATE POLICY "Users can read their own favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can only insert their own favorites (INSERT)
CREATE POLICY "Users can insert their own favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can only delete their own favorites (DELETE)
CREATE POLICY "Users can delete their own favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

