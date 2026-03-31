-- Track automation credit usage (posts + AI variant generation)
CREATE TABLE IF NOT EXISTS automation_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'post' or 'variant'
  credits INTEGER NOT NULL,
  "automationId" TEXT, -- nullable, for variant generation not tied to specific automation
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_credit_user_month ON automation_credit ("userId", "createdAt" DESC);
