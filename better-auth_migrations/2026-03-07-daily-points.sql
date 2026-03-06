CREATE TABLE IF NOT EXISTS daily_points (
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  points INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("userId", date)
);
CREATE INDEX IF NOT EXISTS idx_daily_points_date ON daily_points (date DESC);

-- Seed existing users: attribute their current score to today so the leaderboard isn't empty
INSERT INTO daily_points ("userId", date, points)
SELECT "userId", CURRENT_DATE, score
FROM user_stats
WHERE score > 0
ON CONFLICT ("userId", date) DO NOTHING;
