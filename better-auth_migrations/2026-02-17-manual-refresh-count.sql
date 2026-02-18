ALTER TABLE x_analytics_snapshot ADD COLUMN IF NOT EXISTS "manualRefreshCount" integer DEFAULT 1;
