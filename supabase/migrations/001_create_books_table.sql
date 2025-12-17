-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  course TEXT NOT NULL,
  price TEXT NOT NULL,
  contact TEXT NOT NULL,
  poster TEXT,
  sold BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_course ON books(course);
CREATE INDEX IF NOT EXISTS idx_books_sold ON books(sold);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow anyone to read books (SELECT)
CREATE POLICY "Anyone can read books"
  ON books
  FOR SELECT
  USING (true);

-- Create policy: Allow authenticated users to insert books (INSERT)
CREATE POLICY "Authenticated users can insert books"
  ON books
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy: Users can only update their own books (UPDATE)
CREATE POLICY "Users can update their own books"
  ON books
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can only delete their own books (DELETE)
CREATE POLICY "Users can delete their own books"
  ON books
  FOR DELETE
  USING (auth.uid() = user_id);

