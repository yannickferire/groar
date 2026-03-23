import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { API_TIERS, getApiGraceLimit, getNextApiTier } from "@/lib/plans";
import { getUserApiTierFromDB } from "@/lib/plans-server";

// GET — current month API usage for the authenticated user
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session.user.id;

  const tier = await getUserApiTierFromDB(userId);
  const tierInfo = API_TIERS[tier];
  const limit = tierInfo.limit;
  const graceLimit = getApiGraceLimit(tier);
  const nextTier = getNextApiTier(tier);

  // Usage for current calendar month
  const monthResult = await pool.query(
    `SELECT COALESCE(SUM(count), 0)::int AS total
     FROM api_usage_daily
     WHERE "userId" = $1
       AND date >= date_trunc('month', CURRENT_DATE)`,
    [userId]
  );

  // Daily breakdown for current month
  const dailyResult = await pool.query(
    `SELECT date, count
     FROM api_usage_daily
     WHERE "userId" = $1
       AND date >= date_trunc('month', CURRENT_DATE)
     ORDER BY date ASC`,
    [userId]
  );

  // Reset date = first day of next month
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split("T")[0];

  return NextResponse.json({
    used: monthResult.rows[0].total,
    limit,
    graceLimit,
    tier,
    tierName: tierInfo.name,
    watermark: tierInfo.watermark,
    nextTier: nextTier ? { tier: nextTier, ...API_TIERS[nextTier] } : null,
    resetDate,
    daily: dailyResult.rows,
  });
}
