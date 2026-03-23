CREATE TABLE IF NOT EXISTS api_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE ("userId", date)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_daily_user_date ON api_usage_daily ("userId", date DESC);
