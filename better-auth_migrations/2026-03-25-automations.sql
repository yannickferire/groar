-- Individual automation configurations (replaces per-metric settings in user.autoPostSettings)
CREATE TABLE IF NOT EXISTS automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled',
  metric TEXT NOT NULL, -- followers, posts, mrr, revenue
  trigger TEXT NOT NULL DEFAULT 'milestone',
  "cardTemplate" TEXT NOT NULL DEFAULT 'milestone',
  goal INT,
  "tweetTemplate" TEXT,
  "visualSettings" JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT false,
  "scheduleHour" INT DEFAULT 7, -- UTC hour for scheduled posts (1, 7, 13, 19)
  "scheduleDay" INT DEFAULT 1, -- 0-6 (Mon-Sun) for weekly posts
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_user ON automation ("userId", enabled);
CREATE INDEX IF NOT EXISTS idx_automation_metric ON automation ("userId", metric, enabled);

-- Ensure schedule columns exist (in case table was created before they were added)
ALTER TABLE automation ADD COLUMN IF NOT EXISTS "scheduleHour" INT DEFAULT 7;
ALTER TABLE automation ADD COLUMN IF NOT EXISTS "scheduleDay" INT DEFAULT 1;

-- Link auto-post history to specific automation
ALTER TABLE x_auto_post ADD COLUMN IF NOT EXISTS "automationId" UUID REFERENCES automation(id) ON DELETE SET NULL;
