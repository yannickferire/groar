-- Track second chance trials
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "secondTrialAt" TIMESTAMPTZ;
