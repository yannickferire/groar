CREATE TABLE IF NOT EXISTS export (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "imageUrl" TEXT NOT NULL,
  "metrics" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_export_user_created ON export ("userId", "createdAt" DESC);
