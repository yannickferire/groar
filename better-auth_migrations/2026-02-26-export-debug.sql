-- Add debug columns to export_usage for tracking device/font info
ALTER TABLE export_usage
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "handle" TEXT,
  ADD COLUMN IF NOT EXISTS "font" TEXT,
  ADD COLUMN IF NOT EXISTS "fontResolved" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "isWebkit" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "isIos" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "browser" TEXT,
  ADD COLUMN IF NOT EXISTS "os" TEXT,
  ADD COLUMN IF NOT EXISTS "deviceType" TEXT,
  ADD COLUMN IF NOT EXISTS "screenWidth" INTEGER,
  ADD COLUMN IF NOT EXISTS "screenHeight" INTEGER,
  ADD COLUMN IF NOT EXISTS "source" TEXT;

CREATE INDEX IF NOT EXISTS idx_export_usage_created ON export_usage ("createdAt" DESC);
