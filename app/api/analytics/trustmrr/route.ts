import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlanFromDB } from "@/lib/plans-server";
import { fetchTrustMRRForUser } from "@/lib/trustmrr-analytics";

const FRESHNESS_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

// Get stored TrustMRR analytics for the current user
// Auto-fetches from TrustMRR API if data is stale (> 15 min)
export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);
    const today = new Date().toISOString().split("T")[0];

    // Check freshness of latest snapshot
    const freshnessResult = await pool.query(
      `SELECT MAX("createdAt") as latest_fetch FROM trustmrr_snapshot WHERE "userId" = $1`,
      [session.user.id]
    );
    const latestFetch = freshnessResult.rows[0]?.latest_fetch;
    const isStale = !latestFetch || (Date.now() - new Date(latestFetch).getTime()) > FRESHNESS_THRESHOLD_MS;

    // Auto-fetch if data is stale
    if (isStale) {
      const userResult = await pool.query(
        `SELECT "xUsername" FROM "user" WHERE id = $1`,
        [session.user.id]
      );
      const xHandle = userResult.rows[0]?.xUsername;
      if (xHandle) {
        await fetchTrustMRRForUser(session.user.id, xHandle, "auto").catch(() => {});
      }
    }

    // Check manual refresh count for today
    const MAX_DAILY_REFRESHES = 3;
    const manualFetchResult = await pool.query(
      `SELECT COALESCE("manualRefreshCount", 1) as count
       FROM trustmrr_snapshot
       WHERE "userId" = $1 AND date = $2 AND "fetchType" = 'manual'`,
      [session.user.id, today]
    );
    const manualRefreshCount = manualFetchResult.rows[0]
      ? parseInt(manualFetchResult.rows[0].count)
      : 0;

    // Get snapshots for the last N days
    const snapshotsResult = await pool.query(
      `SELECT DISTINCT ON (date)
        date,
        "mrrCents",
        "revenueLast30dCents",
        "revenueTotalCents",
        customers,
        "activeSubscriptions",
        "growth30d",
        "mrrGained",
        "startupName",
        website,
        "createdAt"
       FROM trustmrr_snapshot
       WHERE "userId" = $1
         AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
       ORDER BY date DESC, "createdAt" DESC`,
      [session.user.id, days]
    );

    if (snapshotsResult.rows.length === 0) {
      return NextResponse.json({
        hasData: false,
        canManualRefresh: manualRefreshCount < MAX_DAILY_REFRESHES,
      });
    }

    const latest = snapshotsResult.rows[0];

    return NextResponse.json({
      hasData: true,
      canManualRefresh: manualRefreshCount < MAX_DAILY_REFRESHES,
      latest,
      snapshots: snapshotsResult.rows,
      period: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error fetching TrustMRR analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
