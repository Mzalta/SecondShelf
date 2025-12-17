-- Create purchases table to track Stripe payments
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, canceled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_book_id ON purchases(book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent_id ON purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own purchases
CREATE POLICY "Users can read their own purchases"
  ON purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own purchases (when creating payment intent)
CREATE POLICY "Users can insert their own purchases"
  ON purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: System can update purchases (for webhook updates)
-- Note: This allows service role to update, but we'll handle webhook auth separately
CREATE POLICY "Service role can update purchases"
  ON purchases
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add a function to mark book as sold when purchase succeeds
CREATE OR REPLACE FUNCTION mark_book_sold_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- When a purchase status changes to 'succeeded', mark the book as sold
  IF NEW.status = 'succeeded' AND OLD.status != 'succeeded' THEN
    UPDATE books
    SET sold = true
    WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically mark book as sold
CREATE TRIGGER mark_book_sold_on_successful_purchase
  AFTER UPDATE ON purchases
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded' AND OLD.status != 'succeeded')
  EXECUTE FUNCTION mark_book_sold_on_purchase();

