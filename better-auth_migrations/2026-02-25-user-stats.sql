-- User stats table for leaderboard tracking
-- Drop old version if it exists (schema changed)
DROP TABLE IF EXISTS user_stats;

CREATE TABLE user_stats (
  "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
  "exportsCount" INTEGER NOT NULL DEFAULT 0,
  "creditedExportsCount" INTEGER NOT NULL DEFAULT 0,
  "exportsToday" INTEGER NOT NULL DEFAULT 0,
  "lastExportDate" DATE,
  "totalLoginDays" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastLoginDate" DATE,
  "uniqueTemplatesCount" INTEGER NOT NULL DEFAULT 0,
  "uniqueBackgroundsCount" INTEGER NOT NULL DEFAULT 0,
  "usedTemplates" TEXT[] NOT NULL DEFAULT '{}',
  "usedBackgrounds" TEXT[] NOT NULL DEFAULT '{}',
  "score" INTEGER NOT NULL DEFAULT 0,
  "pointsToday" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_stats_score ON user_stats (score DESC);

-- Backfill from existing export table
-- creditedExportsCount = exportsCount for backfill (existing users had few exports)
INSERT INTO user_stats (
  "userId", "exportsCount", "creditedExportsCount",
  "uniqueTemplatesCount", "uniqueBackgroundsCount",
  "usedTemplates", "usedBackgrounds",
  "score", "createdAt", "updatedAt"
)
SELECT
  e."userId",
  COUNT(*)::INTEGER,
  COUNT(*)::INTEGER,
  COUNT(DISTINCT e.metrics->>'template')::INTEGER,
  COUNT(DISTINCT e.metrics->'background'->>'presetId')::INTEGER,
  ARRAY(SELECT DISTINCT t FROM unnest(ARRAY_AGG(e.metrics->>'template')) t WHERE t IS NOT NULL),
  ARRAY(SELECT DISTINCT b FROM unnest(ARRAY_AGG(e.metrics->'background'->>'presetId')) b WHERE b IS NOT NULL),
  -- Score: creditedExports*10 + templates*50 + backgrounds*20
  COUNT(*)::INTEGER * 10
    + COUNT(DISTINCT e.metrics->>'template')::INTEGER * 50
    + COUNT(DISTINCT e.metrics->'background'->>'presetId')::INTEGER * 20,
  MIN(e."createdAt"),
  NOW()
FROM export e
GROUP BY e."userId"
ON CONFLICT ("userId") DO UPDATE SET
  "exportsCount" = EXCLUDED."exportsCount",
  "creditedExportsCount" = EXCLUDED."creditedExportsCount",
  "uniqueTemplatesCount" = EXCLUDED."uniqueTemplatesCount",
  "uniqueBackgroundsCount" = EXCLUDED."uniqueBackgroundsCount",
  "usedTemplates" = EXCLUDED."usedTemplates",
  "usedBackgrounds" = EXCLUDED."usedBackgrounds",
  "score" = EXCLUDED."score",
  "updatedAt" = NOW();

-- Backfill streaks from export dates (gaps-and-islands)
WITH export_days AS (
  SELECT DISTINCT "userId", ("createdAt" AT TIME ZONE 'UTC')::DATE AS d
  FROM export
),
numbered AS (
  SELECT "userId", d,
    d - (ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY d))::INTEGER AS grp
  FROM export_days
),
streak_groups AS (
  SELECT "userId", COUNT(*)::INTEGER AS streak_len, MAX(d) AS streak_end
  FROM numbered
  GROUP BY "userId", grp
),
user_streaks AS (
  SELECT "userId",
    COALESCE(MAX(CASE WHEN streak_end >= CURRENT_DATE - 1 THEN streak_len END), 0) AS current_streak,
    MAX(streak_len) AS longest_streak,
    MAX(streak_end) AS last_export
  FROM streak_groups
  GROUP BY "userId"
)
UPDATE user_stats SET
  "currentStreak" = us.current_streak,
  "longestStreak" = us.longest_streak,
  "lastExportDate" = us.last_export,
  "score" = user_stats."creditedExportsCount" * 10
    + user_stats."uniqueTemplatesCount" * 50
    + user_stats."uniqueBackgroundsCount" * 20
    + CASE WHEN us.longest_streak >= 7 THEN 50 ELSE 0 END
    + CASE WHEN us.longest_streak >= 30 THEN 100 ELSE 0 END
    + CASE WHEN us.longest_streak >= 90 THEN 300 ELSE 0 END
FROM user_streaks us
WHERE user_stats."userId" = us."userId";
