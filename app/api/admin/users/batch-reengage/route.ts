import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendEmail, hotLeadDiscountEmail, secondChanceTrialEmail } from "@/lib/email";
import { getPricingTierInfo } from "@/lib/plans-server";
import { inngest } from "@/lib/inngest";
import { TRIAL_DURATION_DAYS } from "@/lib/plans";

export async function POST() {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find old leads: trial expired > 10 days ago, never paid, no second trial yet, emails allowed
  const result = await pool.query(`
    SELECT
      u.id, u.name, u.email,
      u."brandingLogoUrl",
      s."trialEnd",
      COALESCE(us."exportsCount", 0)::int as "exportCount",
      EXISTS(SELECT 1 FROM account a WHERE a."userId" = u.id AND a."providerId" = 'twitter') as "hasX",
      EXISTS(SELECT 1 FROM trustmrr_snapshot t WHERE t."userId" = u.id) as "hasTrustMRR"
    FROM "user" u
    JOIN subscription s ON s."userId" = u.id
    WHERE s.status = 'trialing'
      AND s."trialEnd" < NOW() - INTERVAL '10 days'
      AND s."externalCustomerId" IS NULL
      AND s."secondTrialAt" IS NULL
      AND u."emailTrialReminders" IS DISTINCT FROM false
  `);

  const leads = result.rows;
  if (leads.length === 0) {
    return NextResponse.json({ success: true, hot: 0, cold: 0, skipped: 0, total: 0 });
  }

  const { proTier, lifetimeTier } = await getPricingTierInfo();
  const discountCode = process.env.CREEM_DISCOUNT_CODE_25 || "HOTTIGER25";

  let hotCount = 0;
  let coldCount = 0;
  let skippedCount = 0;

  for (const lead of leads) {
    if (!lead.email) {
      skippedCount++;
      continue;
    }

    const hasDeepSignal = lead.hasX || lead.hasTrustMRR || !!lead.brandingLogoUrl;
    const isHot = lead.exportCount > 2 && hasDeepSignal;
    const isCold = lead.exportCount <= 1;

    if (isHot) {
      // Send 25% discount email
      const emailContent = hotLeadDiscountEmail(lead.name || "there", discountCode, 25, {
        monthlyPrice: proTier.price,
        lifetimePrice: lifetimeTier.price,
      });
      await sendEmail({ to: lead.email, ...emailContent });
      hotCount++;
    } else if (isCold) {
      // Grant second trial + send email
      const now = new Date();
      const newTrialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
      await pool.query(
        `UPDATE subscription
         SET plan = 'pro', status = 'trialing',
             "trialStart" = $2, "trialEnd" = $3,
             "secondTrialAt" = $2, "updatedAt" = NOW()
         WHERE "userId" = $1`,
        [lead.id, now, newTrialEnd]
      );

      const emailContent = secondChanceTrialEmail(lead.name || "there");
      await sendEmail({ to: lead.email, ...emailContent });

      // Trigger trial email sequence for the new trial
      await inngest.send({
        name: "trial/started",
        data: {
          userId: lead.id,
          email: lead.email,
          name: lead.name || "",
          trialEnd: newTrialEnd.toISOString(),
        },
      });

      coldCount++;
    } else {
      // Warm leads (2+ exports but no deep signal) — skip for now
      skippedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    total: leads.length,
    hot: hotCount,
    cold: coldCount,
    skipped: skippedCount,
  });
}
