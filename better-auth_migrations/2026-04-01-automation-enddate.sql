-- End date for progress goal period
ALTER TABLE automation ADD COLUMN IF NOT EXISTS "endDate" DATE;
