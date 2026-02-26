-- User badges/achievements table
CREATE TABLE IF NOT EXISTS user_badges (
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "badgeId" TEXT NOT NULL,
  "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("userId", "badgeId")
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges ("userId");

-- Backfill computed badges from existing user_stats
INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'first-roar', s."updatedAt"
FROM user_stats s WHERE s."exportsCount" >= 1
ON CONFLICT DO NOTHING;

INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'template-explorer', s."updatedAt"
FROM user_stats s WHERE s."uniqueTemplatesCount" >= 3
ON CONFLICT DO NOTHING;

INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'background-hunter', s."updatedAt"
FROM user_stats s WHERE s."uniqueBackgroundsCount" >= 10
ON CONFLICT DO NOTHING;

INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'week-warrior', s."updatedAt"
FROM user_stats s WHERE s."longestStreak" >= 7
ON CONFLICT DO NOTHING;

INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'month-master', s."updatedAt"
FROM user_stats s WHERE s."longestStreak" >= 30
ON CONFLICT DO NOTHING;

INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'legend', s."updatedAt"
FROM user_stats s WHERE s."longestStreak" >= 90
ON CONFLICT DO NOTHING;

INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'rising-star', s."updatedAt"
FROM user_stats s WHERE s."score" >= 500
ON CONFLICT DO NOTHING;

INSERT INTO user_badges ("userId", "badgeId", "earnedAt")
SELECT s."userId", 'groar-elite', s."updatedAt"
FROM user_stats s WHERE s."score" >= 1000
ON CONFLICT DO NOTHING;
