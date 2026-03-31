// TrustMRR analytics fetch helper - shared between manual and cron fetches
import { pool } from "@/lib/db";
import { fetchStartupByXHandle } from "@/lib/trustmrr";
import { checkRevenueMilestones } from "@/lib/milestones";
import { checkScheduledAutoPost, processQueuedPosts } from "@/lib/auto-post";

export type FetchType = "auto" | "manual";

export type TrustMRRFetchResult = {
  userId: string;
  success?: boolean;
  alreadyFetched?: boolean;
  notFound?: boolean;
  fetchedAt?: string;
  message?: string;
  error?: string;
  metrics?: {
    mrrCents: number;
    mrrGained: number;
  };
};

const MAX_DAILY_MANUAL_REFRESHES = 3;
const AUTO_FETCH_COOLDOWN_MINUTES = 15;

export async function fetchTrustMRRForUser(
  userId: string,
  xHandle: string,
  fetchType: FetchType
): Promise<TrustMRRFetchResult> {
  const today = new Date().toISOString().split("T")[0];

  // Check if already fetched recently
  const existingSnapshot = await pool.query(
    `SELECT id, "createdAt", COALESCE("manualRefreshCount", 1) as "refreshCount"
     FROM trustmrr_snapshot
     WHERE "userId" = $1 AND date = $2 AND "fetchType" = $3`,
    [userId, today, fetchType]
  );

  if (fetchType === "manual" && existingSnapshot.rows.length > 0) {
    const refreshCount = parseInt(existingSnapshot.rows[0].refreshCount);
    if (refreshCount >= MAX_DAILY_MANUAL_REFRESHES) {
      return {
        userId,
        alreadyFetched: true,
        fetchedAt: existingSnapshot.rows[0].createdAt,
        message: "Daily refresh limit reached (3/3).",
      };
    }
  } else if (fetchType !== "manual") {
    const recentAuto = await pool.query(
      `SELECT id, "createdAt" FROM trustmrr_snapshot
       WHERE "userId" = $1 AND "fetchType" = 'auto'
       AND "createdAt" > NOW() - interval '${AUTO_FETCH_COOLDOWN_MINUTES} minutes'
       ORDER BY "createdAt" DESC LIMIT 1`,
      [userId]
    );
    if (recentAuto.rows.length > 0) {
      return {
        userId,
        alreadyFetched: true,
        fetchedAt: recentAuto.rows[0].createdAt,
        message: "Auto-fetched recently, skipping.",
      };
    }
  }

  // Fetch from TrustMRR API
  const result = await fetchStartupByXHandle(xHandle);

  if ("notFound" in result) {
    return { userId, notFound: true, message: "Startup not found on TrustMRR" };
  }

  if ("error" in result) {
    return { userId, error: result.error };
  }

  const { startup } = result;

  // Get previous snapshot to calculate MRR delta and check milestones
  const previousResult = await pool.query(
    `SELECT "mrrCents", "revenueTotalCents", customers
     FROM trustmrr_snapshot
     WHERE "userId" = $1 AND date <= $2
     ORDER BY date DESC, "createdAt" DESC LIMIT 1`,
    [userId, today]
  );

  const previousSnapshot = previousResult.rows[0];
  const mrrGained = previousSnapshot
    ? startup.revenue.mrrCents - previousSnapshot.mrrCents
    : 0;

  // Insert or update snapshot
  await pool.query(
    `INSERT INTO trustmrr_snapshot (
      "userId", date, "fetchType",
      "mrrCents", "revenueLast30dCents", "revenueTotalCents",
      customers, "activeSubscriptions", "growth30d", "mrrGained",
      "startupName", website
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT ("userId", date, "fetchType") DO UPDATE SET
      "mrrCents" = EXCLUDED."mrrCents",
      "revenueLast30dCents" = EXCLUDED."revenueLast30dCents",
      "revenueTotalCents" = EXCLUDED."revenueTotalCents",
      customers = EXCLUDED.customers,
      "activeSubscriptions" = EXCLUDED."activeSubscriptions",
      "growth30d" = EXCLUDED."growth30d",
      "mrrGained" = EXCLUDED."mrrGained",
      "startupName" = EXCLUDED."startupName",
      website = EXCLUDED.website,
      "manualRefreshCount" = COALESCE(trustmrr_snapshot."manualRefreshCount", 1) + 1,
      "createdAt" = NOW()`,
    [
      userId,
      today,
      fetchType,
      startup.revenue.mrrCents,
      startup.revenue.last30DaysCents,
      startup.revenue.totalCents,
      startup.customers,
      startup.activeSubscriptions,
      startup.growth30d,
      mrrGained,
      startup.name,
      startup.website,
    ]
  );

  // Backfill startup info on older snapshots if missing
  if (startup.name || startup.website) {
    pool.query(
      `UPDATE trustmrr_snapshot SET "startupName" = $2, website = $3
       WHERE "userId" = $1 AND "startupName" IS NULL`,
      [userId, startup.name, startup.website]
    ).catch(() => {});
  }

  // Check revenue milestones (convert cents to dollars)
  if (previousSnapshot) {
    try {
      await checkRevenueMilestones(
        userId,
        Math.floor(previousSnapshot.mrrCents / 100),
        Math.floor(startup.revenue.mrrCents / 100),
        Math.floor(previousSnapshot.revenueTotalCents / 100),
        Math.floor(startup.revenue.totalCents / 100),
        previousSnapshot.customers || 0,
        startup.customers || 0
      );
    } catch (e) {
      console.error("Failed to check revenue milestones:", e);
    }

    // Process any queued milestone posts whose schedule hour matches
    try {
      await processQueuedPosts(userId);
    } catch (e) {
      console.error("Queued auto-post error:", e);
    }

    // Check scheduled auto-posts (daily/weekly/monthly) for revenue metrics
    try {
      await checkScheduledAutoPost(userId, "mrr", Math.floor(startup.revenue.mrrCents / 100));
    } catch (e) {
      console.error("Scheduled auto-post (mrr) error:", e);
    }
    try {
      await checkScheduledAutoPost(userId, "revenue", Math.floor(startup.revenue.totalCents / 100));
    } catch (e) {
      console.error("Scheduled auto-post (revenue) error:", e);
    }
  }

  return {
    userId,
    success: true,
    metrics: {
      mrrCents: startup.revenue.mrrCents,
      mrrGained,
    },
  };
}

// Get all users with an X handle (for cron auto-fetch)
// Includes all users so leaderboard startup URLs stay populated
export async function getUsersForTrustMRR() {
  const result = await pool.query(
    `SELECT u.id as "userId", u."xUsername"
     FROM "user" u
     WHERE u."xUsername" IS NOT NULL`
  );
  return result.rows as { userId: string; xUsername: string }[];
}
