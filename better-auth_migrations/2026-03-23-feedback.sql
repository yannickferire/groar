-- User feedback from dashboard
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id),
  type TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  page TEXT,
  "userAgent" TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback("userId");
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
