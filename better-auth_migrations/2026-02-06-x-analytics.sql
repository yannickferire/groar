-- X Analytics snapshots table for storing daily metrics
CREATE TABLE "x_analytics_snapshot" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "accountId" TEXT NOT NULL REFERENCES "account"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,

  -- User metrics (from /users/me)
  "followersCount" INTEGER NOT NULL DEFAULT 0,
  "followingCount" INTEGER NOT NULL DEFAULT 0,
  "tweetCount" INTEGER NOT NULL DEFAULT 0,
  "listedCount" INTEGER NOT NULL DEFAULT 0,

  -- Aggregated tweet metrics (sum of recent tweets)
  "impressionsCount" INTEGER DEFAULT 0,
  "likesCount" INTEGER DEFAULT 0,
  "retweetsCount" INTEGER DEFAULT 0,
  "repliesCount" INTEGER DEFAULT 0,
  "quotesCount" INTEGER DEFAULT 0,
  "bookmarksCount" INTEGER DEFAULT 0,
  "profileClicksCount" INTEGER DEFAULT 0,
  "urlClicksCount" INTEGER DEFAULT 0,

  -- Calculated deltas (compared to previous day)
  "followersGained" INTEGER DEFAULT 0,
  "impressionsGained" INTEGER DEFAULT 0,

  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- One snapshot per account per day
  UNIQUE("accountId", "date")
);

CREATE INDEX "x_analytics_accountId_idx" ON "x_analytics_snapshot" ("accountId");
CREATE INDEX "x_analytics_date_idx" ON "x_analytics_snapshot" ("date");
CREATE INDEX "x_analytics_accountId_date_idx" ON "x_analytics_snapshot" ("accountId", "date" DESC);
