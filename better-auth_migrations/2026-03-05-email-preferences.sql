-- Add email preference columns for trial reminders and product updates
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailTrialReminders" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailProductUpdates" BOOLEAN NOT NULL DEFAULT TRUE;
