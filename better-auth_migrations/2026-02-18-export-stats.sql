CREATE TABLE IF NOT EXISTS export_usage (
  id SERIAL PRIMARY KEY,
  "backgroundId" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_export_usage_background ON export_usage ("backgroundId");
CREATE INDEX IF NOT EXISTS idx_export_usage_template ON export_usage ("template");
