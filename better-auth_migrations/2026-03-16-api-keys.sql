CREATE TABLE IF NOT EXISTS api_key (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Default',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastUsedAt" TIMESTAMPTZ,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_api_key_key ON api_key (key);
CREATE INDEX IF NOT EXISTS idx_api_key_user ON api_key ("userId");

-- Add requestCount column if missing (for existing tables)
ALTER TABLE api_key ADD COLUMN IF NOT EXISTS "requestCount" INTEGER NOT NULL DEFAULT 0;
