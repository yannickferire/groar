-- Update schedule hours from old (1,7,13,19 UTC) to new (0,6,12,18 UTC)
UPDATE automation SET "scheduleHour" = 0 WHERE "scheduleHour" = 1;
UPDATE automation SET "scheduleHour" = 6 WHERE "scheduleHour" = 7;
UPDATE automation SET "scheduleHour" = 12 WHERE "scheduleHour" = 13;
UPDATE automation SET "scheduleHour" = 18 WHERE "scheduleHour" = 19;

-- Also update default for new automations
ALTER TABLE automation ALTER COLUMN "scheduleHour" SET DEFAULT 6;
