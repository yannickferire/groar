-- Make startDate nullable with no default so new progress automations start blank
ALTER TABLE automation ALTER COLUMN "startDate" DROP DEFAULT;
