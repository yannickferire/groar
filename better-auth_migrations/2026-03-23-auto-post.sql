-- Auto-post milestones to X
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "autoPostEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "autoPostTemplate" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "autoPostSettings" JSONB;

CREATE TABLE IF NOT EXISTS x_auto_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id),
  "accountId" TEXT NOT NULL,
  metric TEXT NOT NULL,
  milestone INT NOT NULL,
  "tweetId" TEXT,
  "tweetText" TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "postedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_x_auto_post_user_date ON x_auto_post ("userId", "createdAt" DESC);
