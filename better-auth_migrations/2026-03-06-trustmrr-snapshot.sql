CREATE TABLE IF NOT EXISTS trustmrr_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  "fetchType" TEXT NOT NULL DEFAULT 'auto',
  "mrrCents" INTEGER,
  "revenueLast30dCents" INTEGER,
  "revenueTotalCents" INTEGER,
  customers INTEGER,
  "activeSubscriptions" INTEGER,
  "growth30d" NUMERIC(6,2),
  "mrrGained" INTEGER,
  "manualRefreshCount" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", date, "fetchType")
);

CREATE INDEX IF NOT EXISTS idx_trustmrr_snapshot_user_date ON trustmrr_snapshot ("userId", date DESC);
