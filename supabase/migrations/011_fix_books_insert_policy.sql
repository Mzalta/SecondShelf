-- Fix RLS INSERT policy on books table to ensure user_id must equal auth.uid()
-- This prevents users from creating listings with someone else's user_id

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;

-- Create new INSERT policy that enforces user_id must match auth.uid()
-- This ensures users can only create listings for themselves
CREATE POLICY "Users can create their own listings"
  ON books
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Note: The UPDATE and DELETE policies already correctly enforce ownership:
--   - UPDATE: USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
--   - DELETE: USING (auth.uid() = user_id)
-- These ensure users can only modify/delete their own listings
