-- ============================================
-- MESSAGES TABLE FOR LIVE CHAT
-- ============================================

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'admin')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND sender = 'client');

-- Policy: Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can insert admin messages
CREATE POLICY "Admins can insert admin messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender = 'admin' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can update message read status
CREATE POLICY "Admins can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM messages
  WHERE user_id = p_user_id 
    AND sender = 'admin' 
    AND read = false;
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
