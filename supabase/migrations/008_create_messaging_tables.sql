-- Create conversations table for messaging between buyers and sellers
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  listing_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- Prevent duplicate conversations for the same listing/buyer combination
  CONSTRAINT unique_listing_buyer UNIQUE (listing_id, buyer_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Users can view conversations where they are buyer or seller
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Users can insert conversations where they are the buyer
CREATE POLICY "Users can create conversations as buyer"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for messages
-- Users can view messages in conversations they participate in
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Users can insert messages if they are Pro and participant in conversation
CREATE POLICY "Users can send messages if Pro"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND user_has_active_subscription(auth.uid())
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Users can update messages to mark as read (only their own read_at)
-- We'll use a function to update read_at for messages in a conversation
CREATE OR REPLACE FUNCTION mark_conversation_messages_read(conv_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET read_at = timezone('utc'::text, now())
  WHERE conversation_id = conv_id
    AND read_at IS NULL
    AND sender_id != user_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = user_id OR conversations.seller_id = user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for conversations and messages
-- Note: In Supabase, Realtime is typically enabled via the dashboard
-- If you need to enable it via SQL, uncomment these lines:
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

