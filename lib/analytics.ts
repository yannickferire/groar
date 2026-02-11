// Analytics fetch helper - shared between manual and cron fetches
import { pool } from "@/lib/db";
import {
  getAuthenticatedUser,
  getUserTweets,
  aggregateTweetMetrics,
  isTokenExpired,
  isMissingScope,
} from "@/lib/x-api";

export type FetchType = "auto" | "manual";

export type FetchResult = {
  accountId: string;
  username?: string;
  success?: boolean;
  alreadyFetched?: boolean;
  fetchedAt?: string;
  message?: string;
  error?: string;
  tweetsAnalyzed?: number;
  tweetsError?: string;
  metrics?: {
    followers: number;
    followersGained: number;
    likes: number;
    reposts: number;
    replies: number;
    impressions: number;
    impressionsGained: number;
  };
};

// Fetch analytics for a single X account
export async function fetchAccountAnalytics(
  accountDbId: string,
  xUserId: string,
  accessToken: string,
  fetchType: FetchType
): Promise<FetchResult> {
  const today = new Date().toISOString().split("T")[0];

  // Check if already fetched today with this fetchType
  const existingSnapshot = await pool.query(
    `SELECT id, "createdAt" FROM x_analytics_snapshot
     WHERE "accountId" = $1 AND date = $2 AND "fetchType" = $3`,
    [accountDbId, today, fetchType]
  );

  if (existingSnapshot.rows.length > 0) {
    return {
      accountId: accountDbId,
      alreadyFetched: true,
      fetchedAt: existingSnapshot.rows[0].createdAt,
      message: fetchType === "manual"
        ? "Already refreshed manually today."
        : "Already auto-fetched today.",
    };
  }

  // Fetch user metrics from X API
  const userResult = await getAuthenticatedUser(accessToken);

  if ("error" in userResult) {
    if (isTokenExpired(userResult)) {
      return {
        accountId: accountDbId,
        error: "Token expired. Please reconnect your X account.",
      };
    } else if (isMissingScope(userResult)) {
      return {
        accountId: accountDbId,
        error: "Missing permissions. Please reconnect your X account.",
      };
    } else {
      return {
        accountId: accountDbId,
        error: userResult.error,
      };
    }
  }

  // Fetch recent tweets with metrics
  const tweetsResult = await getUserTweets(accessToken, xUserId);

  let tweetMetrics = {
    impressionsCount: 0,
    likesCount: 0,
    retweetsCount: 0,
    repliesCount: 0,
    quotesCount: 0,
    bookmarksCount: 0,
    profileClicksCount: 0,
    urlClicksCount: 0,
  };

  let tweetsError: string | undefined;
  let tweetsCount = 0;

  if ("error" in tweetsResult) {
    console.error("Failed to fetch tweets:", tweetsResult.error);
    tweetsError = tweetsResult.error;
  } else {
    tweetsCount = tweetsResult.length;
    console.log(`Fetched ${tweetsCount} tweets for aggregation`);
    if (tweetsCount > 0) {
      tweetMetrics = aggregateTweetMetrics(tweetsResult);
      console.log("Aggregated metrics:", tweetMetrics);
    }
  }

  // Get previous snapshot to calculate deltas
  const previousResult = await pool.query(
    `SELECT "followersCount", "impressionsCount"
     FROM x_analytics_snapshot
     WHERE "accountId" = $1 AND date <= $2
     ORDER BY date DESC, "createdAt" DESC LIMIT 1`,
    [accountDbId, today]
  );

  const previousSnapshot = previousResult.rows[0];
  const followersGained = previousSnapshot
    ? userResult.public_metrics.followers_count - previousSnapshot.followersCount
    : 0;
  const impressionsGained = previousSnapshot
    ? tweetMetrics.impressionsCount - previousSnapshot.impressionsCount
    : 0;

  // Insert new snapshot
  await pool.query(
    `INSERT INTO x_analytics_snapshot (
      "accountId", date, "fetchType",
      "followersCount", "followingCount", "tweetCount", "listedCount",
      "impressionsCount", "likesCount", "retweetsCount", "repliesCount",
      "quotesCount", "bookmarksCount", "profileClicksCount", "urlClicksCount",
      "followersGained", "impressionsGained"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT ("accountId", date, "fetchType") DO UPDATE SET
      "followersCount" = EXCLUDED."followersCount",
      "followingCount" = EXCLUDED."followingCount",
      "tweetCount" = EXCLUDED."tweetCount",
      "listedCount" = EXCLUDED."listedCount",
      "impressionsCount" = EXCLUDED."impressionsCount",
      "likesCount" = EXCLUDED."likesCount",
      "retweetsCount" = EXCLUDED."retweetsCount",
      "repliesCount" = EXCLUDED."repliesCount",
      "quotesCount" = EXCLUDED."quotesCount",
      "bookmarksCount" = EXCLUDED."bookmarksCount",
      "profileClicksCount" = EXCLUDED."profileClicksCount",
      "urlClicksCount" = EXCLUDED."urlClicksCount",
      "followersGained" = EXCLUDED."followersGained",
      "impressionsGained" = EXCLUDED."impressionsGained"`,
    [
      accountDbId,
      today,
      fetchType,
      userResult.public_metrics.followers_count,
      userResult.public_metrics.following_count,
      userResult.public_metrics.tweet_count,
      userResult.public_metrics.listed_count,
      tweetMetrics.impressionsCount,
      tweetMetrics.likesCount,
      tweetMetrics.retweetsCount,
      tweetMetrics.repliesCount,
      tweetMetrics.quotesCount,
      tweetMetrics.bookmarksCount,
      tweetMetrics.profileClicksCount,
      tweetMetrics.urlClicksCount,
      followersGained,
      impressionsGained,
    ]
  );

  return {
    accountId: accountDbId,
    username: userResult.username,
    success: true,
    tweetsAnalyzed: tweetsCount,
    tweetsError,
    metrics: {
      followers: userResult.public_metrics.followers_count,
      followersGained,
      likes: tweetMetrics.likesCount,
      reposts: tweetMetrics.retweetsCount,
      replies: tweetMetrics.repliesCount,
      impressions: tweetMetrics.impressionsCount,
      impressionsGained,
    },
  };
}

// Get all X accounts for a user
export async function getUserXAccounts(userId: string) {
  const result = await pool.query(
    `SELECT id, "accountId", "accessToken", "refreshToken"
     FROM account
     WHERE "userId" = $1 AND "providerId" = 'twitter'`,
    [userId]
  );
  return result.rows;
}

// Get all X accounts (for cron)
export async function getAllXAccounts() {
  const result = await pool.query(
    `SELECT a.id, a."accountId", a."accessToken", a."refreshToken", a."userId", u.email
     FROM account a
     JOIN "user" u ON a."userId" = u.id
     WHERE a."providerId" = 'twitter' AND a."accessToken" IS NOT NULL`
  );
  return result.rows;
}
