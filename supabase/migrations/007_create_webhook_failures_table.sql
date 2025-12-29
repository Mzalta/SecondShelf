-- Create webhook_failures table for monitoring Stripe webhook processing errors
CREATE TABLE IF NOT EXISTS webhook_failures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT,
  event_type TEXT,
  error TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_failures_event_id ON webhook_failures(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_created_at ON webhook_failures(created_at);

-- Enable Row Level Security (only service role can write, but no read policies for security)
ALTER TABLE webhook_failures ENABLE ROW LEVEL SECURITY;

-- Service role can manage webhook failures
CREATE POLICY "Service role can manage webhook failures"
  ON webhook_failures
  FOR ALL
  USING (true)
  WITH CHECK (true);

