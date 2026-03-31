import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // All paying users (have externalCustomerId) with their conversion timeline
  const result = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u."xUsername",
      u."createdAt" as "signupAt",
      s."trialStart",
      s."trialEnd",
      s."billingPeriod",
      s."externalCustomerId",
      s."updatedAt" as "paidAt",
      s."secondTrialAt",
      COALESCE(us."exportsCount", 0)::int as "exportCount",
      -- Time from signup to payment (minutes)
      EXTRACT(EPOCH FROM (s."updatedAt" - u."createdAt")) / 60 as "minutesToPay",
      -- Time from trial start to payment (minutes), null if no trial
      CASE WHEN s."trialStart" IS NOT NULL
        THEN EXTRACT(EPOCH FROM (s."updatedAt" - s."trialStart")) / 60
        ELSE NULL
      END as "minutesTrialToPay",
      -- Did they trial first?
      (s."trialStart" IS NOT NULL) as "hadTrial"
    FROM "user" u
    JOIN subscription s ON s."userId" = u.id
    LEFT JOIN user_stats us ON us."userId" = u.id
    WHERE s."externalCustomerId" IS NOT NULL
      AND s.plan = 'pro'
      AND s."billingPeriod" = 'lifetime'
      AND s."trialStart" IS NOT NULL
    ORDER BY s."updatedAt" DESC
  `);

  const sales = result.rows;

  // Compute summary stats
  const withTrial = sales.filter((s: Record<string, unknown>) => s.hadTrial);
  const withoutTrial = sales.filter((s: Record<string, unknown>) => !s.hadTrial);

  // Buckets for time-to-pay from trial start
  const buckets = {
    "< 5 min": 0,
    "5-60 min": 0,
    "1h - 24h": 0,
    "1-3 days": 0,
    "3+ days": 0,
  };

  for (const sale of withTrial) {
    const mins = sale.minutesTrialToPay as number;
    if (mins < 5) buckets["< 5 min"]++;
    else if (mins < 60) buckets["5-60 min"]++;
    else if (mins < 1440) buckets["1h - 24h"]++;
    else if (mins < 4320) buckets["1-3 days"]++;
    else buckets["3+ days"]++;
  }

  // Billing period breakdown
  const monthly = sales.filter((s: Record<string, unknown>) => s.billingPeriod === "monthly").length;
  const lifetime = sales.filter((s: Record<string, unknown>) => s.billingPeriod === "lifetime").length;

  return NextResponse.json({
    total: sales.length,
    withTrial: withTrial.length,
    withoutTrial: withoutTrial.length,
    monthly,
    lifetime,
    conversionTimeBuckets: buckets,
    sales: sales.map((s: Record<string, unknown>) => ({
      name: s.name,
      email: s.email,
      xUsername: s.xUsername,
      signupAt: s.signupAt,
      trialStart: s.trialStart,
      paidAt: s.paidAt,
      billingPeriod: s.billingPeriod,
      hadTrial: s.hadTrial,
      minutesToPay: Math.round(s.minutesToPay as number),
      minutesTrialToPay: s.minutesTrialToPay != null ? Math.round(s.minutesTrialToPay as number) : null,
      exportCount: s.exportCount,
    })),
  });
}
