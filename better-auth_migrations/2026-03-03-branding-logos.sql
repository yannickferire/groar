-- Create branding_logos table for multi-logo support
CREATE TABLE IF NOT EXISTS branding_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  url TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branding_logos_user ON branding_logos ("userId");

-- Migrate existing logos from user.brandingLogoUrl into the new table
INSERT INTO branding_logos ("userId", url)
SELECT id, "brandingLogoUrl"
FROM "user"
WHERE "brandingLogoUrl" IS NOT NULL
ON CONFLICT DO NOTHING;
