-- Add fetchType column to track auto vs manual fetches
-- Allows 1 auto (cron) + 1 manual fetch per day per account
ALTER TABLE "x_analytics_snapshot"
ADD COLUMN "fetchType" TEXT DEFAULT 'manual';

-- Update unique constraint to allow 1 auto + 1 manual per day
ALTER TABLE "x_analytics_snapshot" DROP CONSTRAINT "x_analytics_snapshot_accountId_date_key";
ALTER TABLE "x_analytics_snapshot" ADD CONSTRAINT "x_analytics_snapshot_accountId_date_fetchType_key" UNIQUE("accountId", "date", "fetchType");
