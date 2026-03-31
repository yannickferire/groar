-- Day counter for daily/weekly automations
-- startDay: the day/week number on the reference date (e.g. 13 means "Day 13" on startDate)
-- startDate: the reference date for the counter
ALTER TABLE automation ADD COLUMN IF NOT EXISTS "startDay" INT DEFAULT 1;
ALTER TABLE automation ADD COLUMN IF NOT EXISTS "startDate" DATE DEFAULT CURRENT_DATE;
