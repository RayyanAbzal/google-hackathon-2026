-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vouch_received', 'claim_verified', 'tier_changed', 'account_created')),
  title TEXT NOT NULL,
  detail TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for common queries
CREATE INDEX idx_notifications_user_created
ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_user_read
ON notifications(user_id, read);

-- RLS Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (auth.uid()::text = user_id::text OR (SELECT auth.uid()::text) IS NULL);

-- RLS Policy: Only service role can insert (via API routes)
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- RLS Policy: Users can update read status on their own notifications
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid()::text = user_id::text);
