// TrustMRR analytics fetch helper - shared between manual and cron fetches
import { pool } from "@/lib/db";
import { fetchStartupByXHandle } from "@/lib/trustmrr";

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
const AUTO_FETCH_COOLDOWN_HOURS = 20; // once per day is enough for revenue data

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
       AND "createdAt" > NOW() - interval '${AUTO_FETCH_COOLDOWN_HOURS} hours'
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

  // Get previous snapshot to calculate MRR delta
  const previousResult = await pool.query(
    `SELECT "mrrCents"
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
      customers, "activeSubscriptions", "growth30d", "mrrGained"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT ("userId", date, "fetchType") DO UPDATE SET
      "mrrCents" = EXCLUDED."mrrCents",
      "revenueLast30dCents" = EXCLUDED."revenueLast30dCents",
      "revenueTotalCents" = EXCLUDED."revenueTotalCents",
      customers = EXCLUDED.customers,
      "activeSubscriptions" = EXCLUDED."activeSubscriptions",
      "growth30d" = EXCLUDED."growth30d",
      "mrrGained" = EXCLUDED."mrrGained",
      "manualRefreshCount" = COALESCE(trustmrr_snapshot."manualRefreshCount", 1) + 1`,
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
    ]
  );

  return {
    userId,
    success: true,
    metrics: {
      mrrCents: startup.revenue.mrrCents,
      mrrGained,
    },
  };
}

// Get all users who have at least one TrustMRR snapshot (for cron auto-fetch)
export async function getUsersWithTrustMRR() {
  const result = await pool.query(
    `SELECT DISTINCT t."userId", u."xUsername"
     FROM trustmrr_snapshot t
     JOIN "user" u ON u.id = t."userId"
     WHERE u."xUsername" IS NOT NULL`
  );
  return result.rows as { userId: string; xUsername: string }[];
}
