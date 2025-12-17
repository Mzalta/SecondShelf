-- Create subscriptions table to track Stripe subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, unpaid, trialing
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own subscription
CREATE POLICY "Users can read their own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Service role can insert/update subscriptions (for webhook)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add a function to check if user has active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_uuid
    AND status IN ('active', 'trialing')
    AND current_period_end > timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

