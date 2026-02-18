-- Add branding logo URL column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "brandingLogoUrl" TEXT;
