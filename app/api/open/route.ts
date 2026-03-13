import { pool } from "@/lib/db";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TREND_DAYS = 7;

export async function GET() {
  try {
    const [
      usersResult,
      dbExportsResult,
      trialsResult,
      lifetimeCount,
      proAccountsResult,
      exportsOverTimeResult,
      signupsOverTimeResult,
      anonymousExportsResult,
      revenueResult,
      // Trends (last 7 days vs previous 7 days)
      usersTrendResult,
      exportsTrendResult,
      proTrendResult,
      trialsTrendResult,
    ] = await Promise.all([
      // Total registered users
      pool.query(`SELECT COUNT(*)::int as count FROM "user"`),

      // Total DB exports
      pool.query(`SELECT COUNT(*)::int as count FROM "export"`),

      // Active trials
      pool.query(
        `SELECT COUNT(*)::int as count FROM subscription
         WHERE status = 'trialing' AND "trialEnd" > NOW()`
      ),

      // Lifetime deals actually sold (excludes friend plan)
      pool.query(
        `SELECT COUNT(*)::int as count FROM subscription
         WHERE status = 'active' AND plan = 'pro' AND "billingPeriod" = 'lifetime'`
      ),

      // Pro accounts (active pro + friend)
      pool.query(
        `SELECT COUNT(*)::int as count FROM subscription
         WHERE status = 'active' AND plan IN ('pro', 'friend')`
      ),

      // Exports over time (last 90 days)
      pool.query(
        `SELECT date_trunc('day', "createdAt")::date as day, COUNT(*)::int as count
         FROM "export"
         WHERE "createdAt" >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY day
         ORDER BY day`
      ),

      // Signups over time (last 90 days)
      pool.query(
        `SELECT date_trunc('day', "createdAt")::date as day, COUNT(*)::int as count
         FROM "user"
         WHERE "createdAt" >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY day
         ORDER BY day`
      ),

      // Anonymous export counter
      pool.query(
        `SELECT value FROM counter WHERE key = 'anonymous_exports'`
      ).catch(() => ({ rows: [] })),

      // Total revenue (in cents)
      pool.query(
        `SELECT value FROM counter WHERE key = 'total_revenue_cents'`
      ).catch(() => ({ rows: [] })),

      // Trend: new users last N days vs previous N days
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * INTERVAL '1 day')::int as current,
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day' AND "createdAt" < CURRENT_DATE - $1 * INTERVAL '1 day')::int as previous
         FROM "user"
         WHERE "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day'`,
        [TREND_DAYS]
      ),

      // Trend: exports last N days vs previous N days
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * INTERVAL '1 day')::int as current,
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day' AND "createdAt" < CURRENT_DATE - $1 * INTERVAL '1 day')::int as previous
         FROM "export"
         WHERE "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day'`,
        [TREND_DAYS]
      ),

      // Trend: new pro subscribers last N days vs previous N days
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * INTERVAL '1 day')::int as current,
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day' AND "createdAt" < CURRENT_DATE - $1 * INTERVAL '1 day')::int as previous
         FROM subscription
         WHERE status = 'active' AND plan IN ('pro', 'friend')
           AND "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day'`,
        [TREND_DAYS]
      ),

      // Trend: active trials last N days vs previous N days
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * INTERVAL '1 day')::int as current,
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day' AND "createdAt" < CURRENT_DATE - $1 * INTERVAL '1 day')::int as previous
         FROM subscription
         WHERE status = 'trialing'
           AND "createdAt" >= CURRENT_DATE - $1 * 2 * INTERVAL '1 day'`,
        [TREND_DAYS]
      ),
    ]);

    const anonymousExports = anonymousExportsResult.rows[0]?.value ?? 0;
    const totalExports = dbExportsResult.rows[0].count + anonymousExports;
    const totalRevenueCents = revenueResult.rows[0]?.value ?? 0;

    function computeTrend(current: number, previous: number): number | null {
      if (previous === 0) return current > 0 ? 100 : null;
      return Math.round(((current - previous) / previous) * 100);
    }

    return NextResponse.json(
      {
        totalUsers: usersResult.rows[0].count,
        totalExports,
        proAccounts: proAccountsResult.rows[0].count,
        proLifetime: Math.max(0, lifetimeCount.rows[0].count - 2),
        activeTrials: trialsResult.rows[0].count,
        totalRevenue: Math.round(totalRevenueCents / 100),
        trendDays: TREND_DAYS,
        trends: {
          users: computeTrend(usersTrendResult.rows[0].current, usersTrendResult.rows[0].previous),
          exports: computeTrend(exportsTrendResult.rows[0].current, exportsTrendResult.rows[0].previous),
          pro: computeTrend(proTrendResult.rows[0].current, proTrendResult.rows[0].previous),
          trials: computeTrend(trialsTrendResult.rows[0].current, trialsTrendResult.rows[0].previous),
        },
        exportsOverTime: exportsOverTimeResult.rows,
        signupsOverTime: signupsOverTimeResult.rows,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Open stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
