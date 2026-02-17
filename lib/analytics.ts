// Analytics fetch helper - shared between manual and cron fetches
import { pool } from "@/lib/db";
import {
  getAuthenticatedUser,
  isTokenExpired,
  isMissingScope,
  refreshAccessToken,
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
  errorCode?: "TOKEN_EXPIRED" | "MISSING_SCOPE" | "REFRESH_FAILED";
  metrics?: {
    followers: number;
    followersGained: number;
  };
};

// Update tokens in database after refresh
async function updateAccountTokens(
  accountDbId: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  if (refreshToken) {
    await pool.query(
      `UPDATE account SET "accessToken" = $1, "refreshToken" = $2 WHERE id = $3`,
      [accessToken, refreshToken, accountDbId]
    );
  } else {
    await pool.query(
      `UPDATE account SET "accessToken" = $1 WHERE id = $2`,
      [accessToken, accountDbId]
    );
  }
  console.log(`Updated tokens for account ${accountDbId}`);
}

// Fetch analytics for a single X account
export async function fetchAccountAnalytics(
  accountDbId: string,
  xUserId: string,
  accessToken: string,
  fetchType: FetchType,
  refreshToken?: string
): Promise<FetchResult> {
  const today = new Date().toISOString().split("T")[0];
  let currentAccessToken = accessToken;

  // Check if already fetched today with this fetchType
  const existingSnapshot = await pool.query(
    `SELECT id, "createdAt", COALESCE("manualRefreshCount", 1) as "refreshCount" FROM x_analytics_snapshot
     WHERE "accountId" = $1 AND date = $2 AND "fetchType" = $3`,
    [accountDbId, today, fetchType]
  );

  const MAX_DAILY_MANUAL_REFRESHES = 3;
  if (fetchType === "manual" && existingSnapshot.rows.length > 0) {
    const refreshCount = parseInt(existingSnapshot.rows[0].refreshCount);
    if (refreshCount >= MAX_DAILY_MANUAL_REFRESHES) {
      return {
        accountId: accountDbId,
        alreadyFetched: true,
        fetchedAt: existingSnapshot.rows[0].createdAt,
        message: "Daily refresh limit reached (3/3).",
      };
    }
  } else if (fetchType !== "manual" && existingSnapshot.rows.length > 0) {
    return {
      accountId: accountDbId,
      alreadyFetched: true,
      fetchedAt: existingSnapshot.rows[0].createdAt,
      message: "Already auto-fetched today.",
    };
  }

  // Fetch user metrics from X API
  let userResult = await getAuthenticatedUser(currentAccessToken);

  // If token expired, try to refresh it
  if ("error" in userResult && isTokenExpired(userResult)) {
    if (refreshToken) {
      console.log("Access token expired, attempting refresh...");
      const refreshResult = await refreshAccessToken(refreshToken);

      if ("error" in refreshResult) {
        console.error("Token refresh failed:", refreshResult.error);
        return {
          accountId: accountDbId,
          error: "Session expired. Please reconnect your X account in Connections.",
          errorCode: "REFRESH_FAILED",
        };
      }

      // Update tokens in database
      await updateAccountTokens(
        accountDbId,
        refreshResult.access_token,
        refreshResult.refresh_token
      );

      // Retry with new token
      currentAccessToken = refreshResult.access_token;
      userResult = await getAuthenticatedUser(currentAccessToken);
    } else {
      return {
        accountId: accountDbId,
        error: "Session expired. Please reconnect your X account in Connections.",
        errorCode: "TOKEN_EXPIRED",
      };
    }
  }

  if ("error" in userResult) {
    if (isTokenExpired(userResult)) {
      return {
        accountId: accountDbId,
        error: "Session expired. Please reconnect your X account in Connections.",
        errorCode: "TOKEN_EXPIRED",
      };
    } else if (isMissingScope(userResult)) {
      return {
        accountId: accountDbId,
        error: "Missing permissions. Please reconnect your X account in Connections.",
        errorCode: "MISSING_SCOPE",
      };
    } else {
      return {
        accountId: accountDbId,
        error: userResult.error,
      };
    }
  }

  // Get previous snapshot to calculate followers delta
  const previousResult = await pool.query(
    `SELECT "followersCount"
     FROM x_analytics_snapshot
     WHERE "accountId" = $1 AND date <= $2
     ORDER BY date DESC, "createdAt" DESC LIMIT 1`,
    [accountDbId, today]
  );

  const previousSnapshot = previousResult.rows[0];
  const followersGained = previousSnapshot
    ? userResult.public_metrics.followers_count - previousSnapshot.followersCount
    : 0;

  // Insert new snapshot (only free API data: user profile metrics)
  await pool.query(
    `INSERT INTO x_analytics_snapshot (
      "accountId", date, "fetchType",
      "followersCount", "followingCount", "tweetCount", "listedCount",
      "followersGained"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT ("accountId", date, "fetchType") DO UPDATE SET
      "followersCount" = EXCLUDED."followersCount",
      "followingCount" = EXCLUDED."followingCount",
      "tweetCount" = EXCLUDED."tweetCount",
      "listedCount" = EXCLUDED."listedCount",
      "followersGained" = EXCLUDED."followersGained",
      "manualRefreshCount" = COALESCE(x_analytics_snapshot."manualRefreshCount", 1) + 1`,
    [
      accountDbId,
      today,
      fetchType,
      userResult.public_metrics.followers_count,
      userResult.public_metrics.following_count,
      userResult.public_metrics.tweet_count,
      userResult.public_metrics.listed_count,
      followersGained,
    ]
  );

  return {
    accountId: accountDbId,
    username: userResult.username,
    success: true,
    metrics: {
      followers: userResult.public_metrics.followers_count,
      followersGained,
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
