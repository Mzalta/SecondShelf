-- Create profiles table to track user Pro status and AI usage
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro BOOLEAN DEFAULT false,
  ai_enhancements_used INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON profiles(is_pro);
CREATE INDEX IF NOT EXISTS idx_profiles_last_reset ON profiles(last_reset);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy: Service role can manage all profiles (for webhooks)
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to sync is_pro from subscriptions table
CREATE OR REPLACE FUNCTION sync_profile_is_pro()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when subscription changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE profiles
    SET is_pro = (
      NEW.status IN ('active', 'trialing') 
      AND NEW.current_period_end > timezone('utc'::text, now())
    ),
    updated_at = timezone('utc'::text, now())
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET is_pro = false,
    updated_at = timezone('utc'::text, now())
    WHERE id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync is_pro from subscriptions
DROP TRIGGER IF EXISTS sync_profile_is_pro_trigger ON subscriptions;
CREATE TRIGGER sync_profile_is_pro_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_is_pro();

-- Function to reset daily AI usage counter
CREATE OR REPLACE FUNCTION reset_daily_ai_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET ai_enhancements_used = 0,
      last_reset = timezone('utc'::text, now())
  WHERE last_reset < timezone('utc'::text, now()) - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

