import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserPlanFromDB } from "@/lib/plans-server";
import { pool } from "@/lib/db";
import { DEFAULT_VISUAL_SETTINGS_SINGLE, getDefaultTemplate, MONTHLY_CREDITS, CREDIT_COST_POST, CREDIT_COST_VARIANT } from "@/lib/auto-post-shared";
import { getCreditsUsedThisMonth } from "@/lib/auto-post";
import type { AutoPostMetric, AutoPostTrigger } from "@/lib/auto-post-shared";
import { getNextMilestoneAbove } from "@/lib/milestones";

// GET — list user's automations + X account info + stats + history
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const [automationsResult, accountResult, historyResult, statsResult, trustmrrResult, xAnalyticsResult, trustmrrLatestResult] = await Promise.all([
    pool.query(
      `SELECT id, name, metric, trigger, "cardTemplate", goal, "tweetTemplate",
              "visualSettings", enabled, "scheduleHour", "scheduleDay", "startDay", "startDate", "createdAt", "updatedAt"
       FROM automation
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC`,
      [session.user.id]
    ),
    pool.query(
      `SELECT a."accountId", a.username, a."profileImageUrl", a.scope, a."refreshToken", u.name as "displayName"
       FROM account a
       JOIN "user" u ON u.id = a."userId"
       WHERE a."userId" = $1 AND a."providerId" = 'twitter'
       ORDER BY a."updatedAt" DESC NULLS LAST
       LIMIT 1`,
      [session.user.id]
    ),
    pool.query(
      `SELECT id, metric, milestone, "tweetId", "tweetText", status, error, "postedAt", "createdAt", "automationId"
       FROM x_auto_post
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      [session.user.id]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'posted') as "postsThisMonth",
         COUNT(*) FILTER (WHERE status = 'failed') as "failedThisMonth",
         COUNT(*) FILTER (WHERE status = 'skipped_limit') as "skippedThisMonth"
       FROM x_auto_post
       WHERE "userId" = $1
         AND "createdAt" >= date_trunc('month', CURRENT_DATE)`,
      [session.user.id]
    ),
    pool.query(
      `SELECT EXISTS(SELECT 1 FROM trustmrr_snapshot WHERE "userId" = $1) as "connected"`,
      [session.user.id]
    ),
    // Latest X analytics for followers/posts
    pool.query(
      `SELECT "followersCount", "tweetCount"
       FROM x_analytics_snapshot
       WHERE "accountId" IN (SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'twitter')
       ORDER BY date DESC LIMIT 1`,
      [session.user.id]
    ),
    // Latest TrustMRR for mrr/revenue
    pool.query(
      `SELECT "mrrCents", "revenueTotalCents"
       FROM trustmrr_snapshot
       WHERE "userId" = $1
       ORDER BY date DESC LIMIT 1`,
      [session.user.id]
    ),
  ]);

  const xAccount = accountResult.rows[0];
  const hasWriteScope = xAccount?.scope?.includes("tweet.write") ?? false;
  const hasMediaScope = xAccount?.scope?.includes("media.write") ?? false;
  const tokenExpired = xAccount && !xAccount.refreshToken;

  // Build current metric values and next milestones
  const xAnalytics = xAnalyticsResult.rows[0];
  const trustmrrLatest = trustmrrLatestResult.rows[0];
  const currentMetrics: Record<string, number> = {
    followers: xAnalytics?.followersCount ?? 0,
    mrr: trustmrrLatest ? Math.round(trustmrrLatest.mrrCents / 100) : 0,
    revenue: trustmrrLatest ? Math.round(trustmrrLatest.revenueTotalCents / 100) : 0,
  };
  const nextMilestones: Record<string, number | null> = {};
  for (const metric of ["followers", "mrr", "revenue"] as const) {
    nextMilestones[metric] = getNextMilestoneAbove(metric, currentMetrics[metric]);
  }

  const creditsUsed = await getCreditsUsedThisMonth(session.user.id);

  return NextResponse.json({
    automations: automationsResult.rows,
    xAccount: xAccount
      ? {
          accountId: xAccount.accountId,
          username: xAccount.username,
          displayName: xAccount.displayName || xAccount.username,
          profileImageUrl: xAccount.profileImageUrl,
          hasWriteScope,
          hasMediaScope,
          tokenExpired: !!tokenExpired,
        }
      : null,
    history: historyResult.rows,
    stats: statsResult.rows[0] || { postsThisMonth: 0, failedThisMonth: 0, skippedThisMonth: 0 },
    credits: {
      used: creditsUsed,
      total: MONTHLY_CREDITS,
      remaining: Math.max(0, MONTHLY_CREDITS - creditsUsed),
      costPost: CREDIT_COST_POST,
      costVariant: CREDIT_COST_VARIANT,
    },
    trustmrrConnected: trustmrrResult.rows[0]?.connected ?? false,
    currentMetrics,
    nextMilestones,
  });
}

// POST — create a new automation
export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  // Limit to 10 automations per user
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM automation WHERE "userId" = $1`,
    [session.user.id]
  );
  if (parseInt(countResult.rows[0].count) >= 10) {
    return NextResponse.json(
      { error: "Maximum 10 automations per account" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const metric = (body.metric || "followers") as AutoPostMetric;
  const trigger = (body.trigger || "milestone") as AutoPostTrigger;

  const nextNumber = parseInt(countResult.rows[0].count) + 1;
  const name = body.name || `Automation ${nextNumber}`;

  const result = await pool.query(
    `INSERT INTO automation (
      "userId", name, metric, trigger, "cardTemplate", "tweetTemplate", "visualSettings", enabled
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, false)
    RETURNING *`,
    [
      session.user.id,
      name,
      metric,
      trigger,
      trigger === "milestone" ? "milestone" : "metrics",
      getDefaultTemplate(trigger, metric, trigger === "milestone" ? "milestone" : "metrics"),
      JSON.stringify(DEFAULT_VISUAL_SETTINGS_SINGLE),
    ]
  );

  return NextResponse.json({ automation: result.rows[0] }, { status: 201 });
}
