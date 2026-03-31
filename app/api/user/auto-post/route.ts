import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { hasWriteScope, mergeSettings } from "@/lib/auto-post";

// GET: Fetch auto-post settings + connected X account info + recent history
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const userResult = await pool.query(
      `SELECT "autoPostSettings" FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const user = userResult.rows[0];
    const settings = mergeSettings(user?.autoPostSettings);

    const accountResult = await pool.query(
      `SELECT "accountId", username, "profileImageUrl", scope
       FROM account
       WHERE "userId" = $1 AND "providerId" = 'twitter'
       ORDER BY "updatedAt" DESC NULLS LAST
       LIMIT 1`,
      [session.user.id]
    );
    const xAccount = accountResult.rows[0];

    const historyResult = await pool.query(
      `SELECT id, metric, milestone, "tweetId", "tweetText", status, error, "postedAt", "createdAt"
       FROM x_auto_post
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      [session.user.id]
    );

    const statsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'posted') as "postsThisMonth",
         COUNT(*) FILTER (WHERE status = 'failed') as "failedThisMonth",
         COUNT(*) FILTER (WHERE status = 'skipped_limit') as "skippedThisMonth"
       FROM x_auto_post
       WHERE "userId" = $1
         AND "createdAt" >= date_trunc('month', CURRENT_DATE)`,
      [session.user.id]
    );

    return NextResponse.json({
      settings,
      xAccount: xAccount ? {
        accountId: xAccount.accountId,
        username: xAccount.username,
        profileImageUrl: xAccount.profileImageUrl,
        hasWriteScope: hasWriteScope(xAccount.scope),
      } : null,
      history: historyResult.rows,
      stats: statsResult.rows[0] || { postsThisMonth: 0, failedThisMonth: 0, skippedThisMonth: 0 },
    });
  } catch (error) {
    console.error("Auto-post settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch auto-post settings" }, { status: 500 });
  }
}

// PATCH: Update auto-post settings (full or partial)
export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await request.json();

    // Load current settings
    const userResult = await pool.query(
      `SELECT "autoPostSettings" FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const current = mergeSettings(userResult.rows[0]?.autoPostSettings);

    // Merge incoming changes
    if (body.metrics) {
      for (const [key, val] of Object.entries(body.metrics)) {
        if (key in current.metrics) {
          current.metrics[key as keyof typeof current.metrics] = {
            ...current.metrics[key as keyof typeof current.metrics],
            ...(val as object),
          };
        }
      }
    }
    if (body.visual) {
      current.visual = { ...current.visual, ...body.visual };
    }

    // Also sync autoPostEnabled for backward compat (true if any metric is enabled)
    const anyEnabled = Object.values(current.metrics).some((m) => m.enabled);

    await pool.query(
      `UPDATE "user" SET "autoPostSettings" = $1, "autoPostEnabled" = $2 WHERE id = $3`,
      [JSON.stringify(current), anyEnabled, session.user.id]
    );

    return NextResponse.json({ success: true, settings: current });
  } catch (error) {
    console.error("Auto-post settings update error:", error);
    return NextResponse.json({ error: "Failed to update auto-post settings" }, { status: 500 });
  }
}
