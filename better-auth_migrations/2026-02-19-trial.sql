-- Add trial columns to subscription table
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "trialStart" TIMESTAMPTZ;
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "trialEnd" TIMESTAMPTZ;
