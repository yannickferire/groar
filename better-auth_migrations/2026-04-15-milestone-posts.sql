-- Bot-posted milestone celebrations
CREATE TABLE IF NOT EXISTS milestone_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  handle TEXT NOT NULL, -- X username without @
  metric TEXT NOT NULL, -- followers, mrr, revenue, etc.
  value INT NOT NULL, -- milestone value (e.g. 2000)
  slug TEXT NOT NULL, -- e.g. "2k-followers"
  bg TEXT NOT NULL DEFAULT 'noisy-lights', -- background preset
  font TEXT NOT NULL DEFAULT 'bricolage', -- font family
  emoji TEXT NOT NULL DEFAULT '🎉', -- milestone emoji
  "tweetId" TEXT, -- X tweet ID after posting
  "postedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", slug)
);

CREATE INDEX IF NOT EXISTS idx_milestone_post_handle ON milestone_post (handle);
CREATE INDEX IF NOT EXISTS idx_milestone_post_user ON milestone_post ("userId");

-- User opt-in for bot milestone posts
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "botMilestones" BOOLEAN DEFAULT false;
