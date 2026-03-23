-- Track which quota threshold was last notified for API usage
-- notifiedThreshold: 0 (none), 80, 100, 120
-- notifiedMonth: which month the notification applies to (reset when month changes)
ALTER TABLE api_subscription ADD COLUMN IF NOT EXISTS "notifiedThreshold" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE api_subscription ADD COLUMN IF NOT EXISTS "notifiedMonth" DATE;
