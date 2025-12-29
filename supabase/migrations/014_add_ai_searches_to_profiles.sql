-- Add AI searches tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_searches_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_searches_last_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ai_searches_last_reset ON profiles(ai_searches_last_reset);

-- Comment on the columns
COMMENT ON COLUMN profiles.ai_searches_used IS 'Number of AI-powered searches used today (resets daily)';
COMMENT ON COLUMN profiles.ai_searches_last_reset IS 'Timestamp of last daily reset for AI searches counter';

