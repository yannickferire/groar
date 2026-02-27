-- Email preferences: milestone emails opt-in (default true)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailMilestones" BOOLEAN NOT NULL DEFAULT TRUE;
