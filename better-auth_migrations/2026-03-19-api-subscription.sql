-- API tier subscription (separate from Pro plan subscription)
CREATE TABLE IF NOT EXISTS api_subscription (
  id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  "externalId" TEXT,
  "externalCustomerId" TEXT,
  "currentPeriodStart" TIMESTAMPTZ,
  "currentPeriodEnd" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE("userId")
);

CREATE INDEX IF NOT EXISTS idx_api_subscription_user ON api_subscription ("userId");
CREATE INDEX IF NOT EXISTS idx_api_subscription_external ON api_subscription ("externalId");
