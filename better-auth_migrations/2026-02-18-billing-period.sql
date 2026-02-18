-- Add billing period tracking to subscription table
ALTER TABLE "subscription" ADD COLUMN "currentPeriodStart" TIMESTAMPTZ;
ALTER TABLE "subscription" ADD COLUMN "billingPeriod" TEXT;
