import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.image,
      u."xUsername",
      u."createdAt" as "userCreatedAt",
      s.plan,
      s.status,
      s."trialStart",
      s."trialEnd",
      s."externalId",
      s."externalCustomerId",
      s."currentPeriodStart",
      s."currentPeriodEnd",
      s."billingPeriod",
      s."createdAt" as "subscriptionCreatedAt",
      s."updatedAt" as "subscriptionUpdatedAt",
      COALESCE(us."exportsCount", (SELECT COUNT(*) FROM export WHERE "userId" = u.id)) as "exportCount",
      (SELECT string_agg(DISTINCT a2."providerId", ', ') FROM account a2 WHERE a2."userId" = u.id) as "providers",
      -- Credits used this month
      COALESCE((SELECT SUM(credits) FROM automation_credit ac
        WHERE ac."userId" = u.id
        AND ac."createdAt" >= date_trunc('month', CURRENT_DATE)), 0)::int as "creditsUsed",
      -- Latest analytics snapshot
      (SELECT json_build_object(
        'followersCount', xs."followersCount",
        'followingCount', xs."followingCount",
        'tweetCount', xs."tweetCount",
        'impressionsCount', xs."impressionsCount",
        'date', xs."date"
      ) FROM "x_analytics_snapshot" xs
        JOIN account a4 ON a4.id = xs."accountId"
        WHERE a4."userId" = u.id
        ORDER BY xs."date" DESC LIMIT 1
      ) as "xAnalytics"
    FROM "user" u
    LEFT JOIN subscription s ON s."userId" = u.id
    LEFT JOIN user_stats us ON us."userId" = u.id
    ORDER BY u."createdAt" DESC`
  );

  return NextResponse.json({ users: result.rows });
}
