// Analytics fetch helper - shared between manual and cron fetches
import { pool } from "@/lib/db";
import {
  getAuthenticatedUser,
  isTokenExpired,
  isMissingScope,
  refreshAccessToken,
} from "@/lib/x-api";
import { checkMilestones } from "@/lib/milestones";
import { checkScheduledAutoPost, processQueuedPosts } from "@/lib/auto-post";

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
  autoPost?: Record<string, unknown>;
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

  // Check if already fetched recently
  const existingSnapshot = await pool.query(
    `SELECT id, "createdAt", COALESCE("manualRefreshCount", 1) as "refreshCount" FROM x_analytics_snapshot
     WHERE "accountId" = $1 AND date = $2 AND "fetchType" = $3`,
    [accountDbId, today, fetchType]
  );

  const MAX_DAILY_MANUAL_REFRESHES = 3;
  const AUTO_FETCH_COOLDOWN_MINUTES = 15;
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
  } else if (fetchType !== "manual") {
    // For auto-fetch, check if last auto-fetch was less than cooldown period ago
    const recentAuto = await pool.query(
      `SELECT id, "createdAt" FROM x_analytics_snapshot
       WHERE "accountId" = $1 AND "fetchType" = 'auto'
       AND "createdAt" > NOW() - interval '${AUTO_FETCH_COOLDOWN_MINUTES} minutes'
       ORDER BY "createdAt" DESC LIMIT 1`,
      [accountDbId]
    );
    if (recentAuto.rows.length > 0) {
      // Even when skipping the fetch, still check scheduled auto-posts
      // (they depend on the cron cycle, not on fresh data)
      try {
        const userRow = await pool.query(
          `SELECT "userId" FROM account WHERE id = $1`, [accountDbId]
        );
        const uid = userRow.rows[0]?.userId;
        if (uid) {
          const lastSnapshot = await pool.query(
            `SELECT "followersCount" FROM x_analytics_snapshot
             WHERE "accountId" = $1 ORDER BY date DESC, "createdAt" DESC LIMIT 1`,
            [accountDbId]
          );
          const followers = lastSnapshot.rows[0]?.followersCount;
          if (followers != null) {
            await processQueuedPosts(uid);
            await checkScheduledAutoPost(uid, "followers", followers);
          }
          // Also check MRR/revenue auto-posts from latest TrustMRR data
          const tmrr = await pool.query(
            `SELECT "mrrCents", "revenueTotalCents" FROM trustmrr_snapshot
             WHERE "userId" = $1 ORDER BY date DESC, "createdAt" DESC LIMIT 1`,
            [uid]
          );
          if (tmrr.rows[0]) {
            const mrr = Math.floor(tmrr.rows[0].mrrCents / 100);
            const revenue = Math.floor(tmrr.rows[0].revenueTotalCents / 100);
            if (mrr > 0) await checkScheduledAutoPost(uid, "mrr", mrr);
            if (revenue > 0) await checkScheduledAutoPost(uid, "revenue", revenue);
          }
        }
      } catch (e) {
        console.error("Auto-post check on skipped fetch:", e);
      }

      return {
        accountId: accountDbId,
        alreadyFetched: true,
        fetchedAt: recentAuto.rows[0].createdAt,
        message: "Auto-fetched recently, skipping.",
      };
    }
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
    `SELECT "followersCount", "tweetCount"
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
      "manualRefreshCount" = COALESCE(x_analytics_snapshot."manualRefreshCount", 1) + 1,
      "createdAt" = NOW()`,
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

  // Check for milestone crossings and create notifications
  if (previousSnapshot) {
    // Resolve userId from accountDbId
    const userResult2 = await pool.query(
      `SELECT "userId" FROM account WHERE id = $1`,
      [accountDbId]
    );
    const userId = userResult2.rows[0]?.userId;
    if (userId) {
      try {
        await checkMilestones(
          userId,
          userResult.username || "",
          previousSnapshot.followersCount,
          userResult.public_metrics.followers_count,
          previousSnapshot.tweetCount || 0,
          userResult.public_metrics.tweet_count
        );
      } catch (e) {
        console.error("Milestone check failed:", e);
      }

      // Process any queued milestone posts whose schedule hour matches
      try {
        await processQueuedPosts(userId);
      } catch (e) {
        console.error("Queued auto-post error:", e);
      }

      // Check scheduled auto-posts (daily/weekly) for X metrics
      const autoPostDebug: Record<string, unknown> = {};
      try {
        autoPostDebug.followers = await checkScheduledAutoPost(userId, "followers", userResult.public_metrics.followers_count);
      } catch (e) {
        autoPostDebug.followers = { error: String(e) };
      }

      // Check scheduled auto-posts for MRR/revenue using latest TrustMRR data from DB
      try {
        const tmrr = await pool.query(
          `SELECT "mrrCents", "revenueTotalCents" FROM trustmrr_snapshot
           WHERE "userId" = $1 ORDER BY date DESC, "createdAt" DESC LIMIT 1`,
          [userId]
        );
        if (tmrr.rows[0]) {
          const mrr = Math.floor(tmrr.rows[0].mrrCents / 100);
          const revenue = Math.floor(tmrr.rows[0].revenueTotalCents / 100);
          if (mrr > 0) autoPostDebug.mrr = await checkScheduledAutoPost(userId, "mrr", mrr);
          if (revenue > 0) autoPostDebug.revenue = await checkScheduledAutoPost(userId, "revenue", revenue);
        } else {
          autoPostDebug.trustmrr = "no_snapshot";
        }
      } catch (e) {
        autoPostDebug.mrr_revenue = { error: String(e) };
      }

      return {
        accountId: accountDbId,
        username: userResult.username,
        success: true,
        metrics: {
          followers: userResult.public_metrics.followers_count,
          followersGained,
        },
        autoPost: autoPostDebug,
      };
    }
  }

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
