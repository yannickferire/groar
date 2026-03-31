-- Add email preference for automation post notifications
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailAutomation" BOOLEAN DEFAULT true;
