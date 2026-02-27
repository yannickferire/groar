-- Notifications table for milestones, badges, and system events
CREATE TABLE IF NOT EXISTS notification (
  id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  type TEXT NOT NULL,           -- 'milestone' | 'badge' | 'system'
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}', -- flexible: { metric, value, previousValue, template, handle }
  read BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_unread ON notification ("userId", read) WHERE read = FALSE;
