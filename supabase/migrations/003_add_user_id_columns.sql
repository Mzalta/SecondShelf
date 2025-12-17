-- Migration to add user_id columns to existing tables
-- Run this if you already created the tables without user_id

-- Add user_id to books table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE books ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
  END IF;
END $$;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can insert books" ON books;
DROP POLICY IF EXISTS "Anyone can update books" ON books;
DROP POLICY IF EXISTS "Anyone can delete books" ON books;

-- Create new authenticated policies for books
CREATE POLICY "Authenticated users can insert books"
  ON books
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own books"
  ON books
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON books
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update favorites table if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'favorites'
  ) THEN
    -- Check if user_id column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'favorites' AND column_name = 'user_id'
    ) THEN
      -- Add user_id column
      ALTER TABLE favorites ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      
      -- Drop old unique constraint if it exists
      ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_book_id_key;
      
      -- Add new unique constraint on (user_id, book_id)
      ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_book_id_key UNIQUE(user_id, book_id);
      
      -- Create index
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
      
      -- Drop old policies
      DROP POLICY IF EXISTS "Anyone can read favorites" ON favorites;
      DROP POLICY IF EXISTS "Anyone can insert favorites" ON favorites;
      DROP POLICY IF EXISTS "Anyone can delete favorites" ON favorites;
      
      -- Create new user-specific policies
      CREATE POLICY "Users can read their own favorites"
        ON favorites
        FOR SELECT
        USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own favorites"
        ON favorites
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own favorites"
        ON favorites
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

