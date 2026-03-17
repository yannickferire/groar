-- Temporary state storage for custom Twitter OAuth link flow
CREATE TABLE IF NOT EXISTS link_x_state (
  state TEXT PRIMARY KEY,
  "codeVerifier" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup old states (older than 10 minutes)
CREATE INDEX IF NOT EXISTS idx_link_x_state_created ON link_x_state ("createdAt");

-- Store profile image and username per account connection
ALTER TABLE account ADD COLUMN IF NOT EXISTS "profileImageUrl" TEXT;
ALTER TABLE account ADD COLUMN IF NOT EXISTS "username" TEXT;
