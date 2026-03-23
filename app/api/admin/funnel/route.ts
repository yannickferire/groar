import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.image,
      u."xUsername",
      u."createdAt" as "userCreatedAt",
      u."brandingLogoUrl",
      s.plan,
      s.status,
      s."trialStart",
      s."trialEnd",
      s."billingPeriod",
      s."secondTrialAt",
      COALESCE(us."exportsCount", 0)::int as "exportCount",
      COALESCE(us."currentStreak", 0)::int as "currentStreak",
      COALESCE(us."longestStreak", 0)::int as "longestStreak",
      COALESCE(us.score, 0)::int as "leaderboardScore",
      COALESCE(us."lastLoginDate", NULL) as "lastLoginDate",
      COALESCE(us."totalLoginDays", 0)::int as "totalLoginDays",
      COALESCE(us."uniqueTemplatesCount", 0)::int as "uniqueTemplatesCount",
      COALESCE(us."uniqueBackgroundsCount", 0)::int as "uniqueBackgroundsCount",
      (SELECT string_agg(DISTINCT a2."providerId", ', ') FROM account a2 WHERE a2."userId" = u.id) as "providers",
      -- Has X connected (twitter provider)
      EXISTS(SELECT 1 FROM account a3 WHERE a3."userId" = u.id AND a3."providerId" = 'twitter') as "hasX",
      -- Has TrustMRR data
      EXISTS(SELECT 1 FROM trustmrr_snapshot t WHERE t."userId" = u.id) as "hasTrustMRR",
      -- Has API key
      EXISTS(SELECT 1 FROM api_key ak WHERE ak."userId" = u.id AND ak.enabled = true) as "hasApiKey",
      -- Has card templates
      (SELECT COUNT(*)::int FROM card_template ct WHERE ct."userId" = u.id) as "templateCount",
      -- Has presets
      (SELECT COUNT(*)::int FROM user_presets up WHERE up."userId" = u.id) as "presetCount",
      -- Has branding
      (u."brandingLogoUrl" IS NOT NULL) as "hasBranding",
      -- Badge count
      (SELECT COUNT(*)::int FROM user_badges ub WHERE ub."userId" = u.id) as "badgeCount",
      -- Feedback count
      (SELECT COUNT(*)::int FROM feedback fb WHERE fb."userId" = u.id) as "feedbackCount",
      -- First export date
      (SELECT MIN("createdAt") FROM export e WHERE e."userId" = u.id) as "firstExportAt",
      -- Last export date
      (SELECT MAX("createdAt") FROM export e WHERE e."userId" = u.id) as "lastExportAt"
    FROM "user" u
    LEFT JOIN subscription s ON s."userId" = u.id
    LEFT JOIN user_stats us ON us."userId" = u.id
    ORDER BY u."createdAt" DESC
  `);

  return NextResponse.json({ users: result.rows });
}
