import { inngest } from "@/lib/inngest";
import { fetchAccountAnalytics, getAllXAccounts } from "@/lib/analytics";
import { fetchTrustMRRForUser, getUsersForTrustMRR } from "@/lib/trustmrr-analytics";
import { pool } from "@/lib/db";
import { sendEmail, trialEndingEmail, trialExpiredEmail, trialFollowUpEmail, secondChanceTrialEmail, hotLeadDiscountEmail } from "@/lib/email";
import { getPricingTierInfo } from "@/lib/plans-server";
import { TRIAL_DURATION_DAYS } from "@/lib/plans";

// X Analytics fetch + auto-post checks (uses latest TrustMRR data from DB)
export const dailyAnalyticsFetch = inngest.createFunction(
  {
    id: "daily-analytics-fetch",
    name: "Daily X Analytics Fetch",
    retries: 3,
  },
  { cron: "0 1,7,13,14,19 * * *" }, // 1am, 7am, 1pm, 2pm, 7pm UTC
  async ({ step, logger }) => {
    const accounts = await step.run("get-all-accounts", async () => {
      return await getAllXAccounts();
    });

    logger.info(`Found ${accounts.length} X accounts to fetch`);

    if (accounts.length === 0) {
      return { message: "No accounts to fetch", accounts: [] };
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const account of accounts) {
      const result = await step.run(
        `fetch-account-${account.id}`,
        async () => {
          try {
            const fetchResult = await fetchAccountAnalytics(
              account.id,
              account.accountId,
              account.accessToken,
              "auto",
              account.refreshToken
            );
            return {
              email: account.email,
              ...fetchResult,
            };
          } catch (error) {
            return {
              accountId: account.id,
              email: account.email,
              success: false as const,
              alreadyFetched: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }
      );

      results.push(result);

      if (result.success) {
        successCount++;
        logger.info(`Fetched analytics for ${result.username || result.accountId}`);
      } else if (result.alreadyFetched) {
        skippedCount++;
        logger.info(`Skipped ${result.accountId} - already fetched today`);
      } else if (result.error) {
        errorCount++;
        logger.error(`Error for ${result.email}: ${result.error}`);
      }
    }

    logger.info(
      `Completed: ${successCount} success, ${errorCount} errors, ${skippedCount} skipped`
    );

    // Cleanup old daily_points rows (older than 60 days) — piggyback on daily fetch
    const cleanup = await step.run("cleanup-old-daily-points", async () => {
      const result = await pool.query(
        `DELETE FROM daily_points WHERE date < CURRENT_DATE - 60`
      );
      return result.rowCount || 0;
    });

    if (cleanup > 0) {
      logger.info(`Daily points cleanup: ${cleanup} old rows deleted`);
    }

    return {
      success: true,
      date: new Date().toISOString().split("T")[0],
      fetchType: "auto",
      summary: {
        total: accounts.length,
        success: successCount,
        errors: errorCount,
        skipped: skippedCount,
      },
      accounts: results,
    };
  }
);

// TrustMRR fetch — runs 1h before each X analytics fetch to ensure fresh data
export const dailyTrustMRRFetch = inngest.createFunction(
  {
    id: "daily-trustmrr-fetch",
    name: "Daily TrustMRR Fetch",
    retries: 2,
  },
  { cron: "0 0,6,12,13,18 * * *" }, // 1h before analytics cron (1,7,13,14,19 UTC)
  async ({ step, logger }) => {
    const tmrrSummary = await step.run("fetch-all-trustmrr", async () => {
      const users = await getUsersForTrustMRR();
      let success = 0, errors = 0, skipped = 0;

      for (let i = 0; i < users.length; i++) {
        // 4s between each request = max 15 req/min (TrustMRR limit: 20/min)
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 4000));
        }

        try {
          const result = await fetchTrustMRRForUser(users[i].userId, users[i].xUsername, "auto");
          if ("success" in result && result.success) success++;
          else skipped++;
        } catch {
          errors++;
        }
      }

      return { total: users.length, success, errors, skipped };
    });

    logger.info(`TrustMRR: ${tmrrSummary.success} success, ${tmrrSummary.errors} errors, ${tmrrSummary.skipped} skipped`);

    return { success: true, ...tmrrSummary };
  }
);

// Trial email sequence — triggered when a trial starts
// Sends emails at exact times: 24h before end, at expiry, and 5 days after
export const trialEmailSequence = inngest.createFunction(
  {
    id: "trial-email-sequence",
    name: "Trial Email Sequence",
    retries: 2,
    cancelOn: [
      // Cancel if user subscribes to a paid plan
      { event: "subscription/activated", match: "data.userId" },
    ],
  },
  { event: "trial/started" },
  async ({ event, step, logger }) => {
    const { userId, email, name, trialEnd } = event.data;
    const trialEndDate = new Date(trialEnd);

    // 1. Wait until 24h before trial ends, then send "ending soon" email
    const endingReminderTime = new Date(trialEndDate.getTime() - 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-ending-reminder", endingReminderTime);

    // Check if user still has an active trial and wants emails
    const shouldSendEnding = await step.run("check-trial-ending", async () => {
      const result = await pool.query(
        `SELECT s.status, s."externalCustomerId", u."emailTrialReminders"
         FROM subscription s
         JOIN "user" u ON u.id = s."userId"
         WHERE s."userId" = $1 AND s.status = 'trialing'`,
        [userId]
      );
      const row = result.rows[0];
      return row && !row.externalCustomerId && row.emailTrialReminders !== false;
    });

    if (shouldSendEnding) {
      await step.run("send-trial-ending", async () => {
        const { proTier, lifetimeTier } = await getPricingTierInfo();
        const emailContent = trialEndingEmail(name || "there", {
          monthlyPrice: proTier.price,
          lifetimePrice: lifetimeTier.price,
        });
        await sendEmail({ to: email, ...emailContent });
        logger.info(`Sent trial ending email to ${email}`);
      });
    }

    // 2. Wait until trial expires, then send "expired" email
    await step.sleepUntil("wait-for-expiry", trialEndDate);

    const shouldSendExpired = await step.run("check-trial-expired", async () => {
      const result = await pool.query(
        `SELECT s.status, s."externalCustomerId", u."emailTrialReminders"
         FROM subscription s
         JOIN "user" u ON u.id = s."userId"
         WHERE s."userId" = $1 AND s.status = 'trialing'`,
        [userId]
      );
      const row = result.rows[0];
      return row && !row.externalCustomerId && row.emailTrialReminders !== false;
    });

    if (shouldSendExpired) {
      await step.run("send-trial-expired", async () => {
        const { lifetimeTier } = await getPricingTierInfo();
        const emailContent = trialExpiredEmail(name || "there", {
          lifetimePrice: lifetimeTier.price,
        });
        await sendEmail({ to: email, ...emailContent });
        logger.info(`Sent trial expired email to ${email}`);
      });
    }

    // 3. Wait 5 days after expiry, then send follow-up
    await step.sleep("wait-for-followup", "5 days");

    const shouldSendFollowUp = await step.run("check-trial-followup", async () => {
      const result = await pool.query(
        `SELECT s.status, s."externalCustomerId", u."emailTrialReminders"
         FROM subscription s
         JOIN "user" u ON u.id = s."userId"
         WHERE s."userId" = $1 AND s.status = 'trialing'
           AND s."externalCustomerId" IS NULL`,
        [userId]
      );
      const row = result.rows[0];
      return row && row.emailTrialReminders !== false;
    });

    if (shouldSendFollowUp) {
      await step.run("send-trial-followup", async () => {
        const { proTier, lifetimeTier } = await getPricingTierInfo();
        const emailContent = trialFollowUpEmail(name || "there", {
          monthlyPrice: proTier.price,
          lifetimePrice: lifetimeTier.price,
        });
        await sendEmail({ to: email, ...emailContent });
        logger.info(`Sent trial follow-up email to ${email}`);
      });
    }

    // 4. Wait 2 more days (7 days after trial end), send 25% discount to hot leads
    await step.sleep("wait-for-discount", "2 days");

    const hotLeadCheck = await step.run("check-hot-lead", async () => {
      const result = await pool.query(
        `SELECT s.status, s."externalCustomerId", u."emailTrialReminders",
                u."brandingLogoUrl",
                COALESCE(us."exportsCount", 0)::int as "exportCount",
                EXISTS(SELECT 1 FROM account a WHERE a."userId" = $1 AND a."providerId" = 'twitter') as "hasX",
                EXISTS(SELECT 1 FROM trustmrr_snapshot t WHERE t."userId" = $1) as "hasTrustMRR"
         FROM subscription s
         JOIN "user" u ON u.id = s."userId"
         LEFT JOIN user_stats us ON us."userId" = s."userId"
         WHERE s."userId" = $1
           AND s.status = 'trialing'
           AND s."externalCustomerId" IS NULL`,
        [userId]
      );
      const row = result.rows[0];
      if (!row || row.emailTrialReminders === false) return { isHot: false, exportCount: 0 };
      // Hot = really engaged: >2 exports AND at least one deep signal (X, TrustMRR, or branding)
      const hasDeepSignal = row.hasX || row.hasTrustMRR || !!row.brandingLogoUrl;
      const isHot = row.exportCount > 2 && hasDeepSignal;
      return { isHot, exportCount: row.exportCount };
    });

    if (hotLeadCheck.isHot) {
      await step.run("send-hot-lead-discount", async () => {
        const { proTier, lifetimeTier } = await getPricingTierInfo();
        const discountCode = process.env.CREEM_DISCOUNT_CODE_25 || "HOTTIGER25";
        const emailContent = hotLeadDiscountEmail(name || "there", discountCode, 25, {
          monthlyPrice: proTier.price,
          lifetimePrice: lifetimeTier.price,
        });
        await sendEmail({ to: email, ...emailContent });
        await pool.query(
          `UPDATE subscription SET "discountSentAt" = NOW(), "updatedAt" = NOW() WHERE "userId" = $1`,
          [userId]
        );
        logger.info(`Sent 25% discount email to hot lead ${email}`);
      });
    }

    // 5. Wait 3 more days (10 days after trial end), send second chance if ≤1 export (cold leads)
    await step.sleep("wait-for-second-chance", "3 days");

    if (!hotLeadCheck.isHot && hotLeadCheck.exportCount <= 1) {
      const shouldSendSecondChance = await step.run("check-second-chance", async () => {
        const result = await pool.query(
          `SELECT s.status, s."externalCustomerId", u."emailTrialReminders"
           FROM subscription s
           JOIN "user" u ON u.id = s."userId"
           WHERE s."userId" = $1
             AND s.status = 'trialing'
             AND s."externalCustomerId" IS NULL`,
          [userId]
        );
        const row = result.rows[0];
        return row && row.emailTrialReminders !== false;
      });

      if (shouldSendSecondChance) {
        // Grant second trial automatically + flag it
        await step.run("grant-second-trial", async () => {
          const now = new Date();
          const newTrialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          await pool.query(
            `UPDATE subscription
             SET plan = 'pro', status = 'trialing',
                 "trialStart" = $2, "trialEnd" = $3,
                 "secondTrialAt" = $2, "updatedAt" = NOW()
             WHERE "userId" = $1`,
            [userId, now, newTrialEnd]
          );
          logger.info(`Granted second trial to ${email}, ends ${newTrialEnd.toISOString()}`);
        });

        await step.run("send-second-chance", async () => {
          const emailContent = secondChanceTrialEmail(name || "there");
          await sendEmail({ to: email, ...emailContent });
          logger.info(`Sent second chance trial email to ${email}`);
        });
      }
    }

    return { userId, emailsSent: true };
  }
);

// Batch re-engage old leads — triggered manually from admin funnel page
// Spaces out emails with 30s between each to avoid rate limits
export const batchReengage = inngest.createFunction(
  {
    id: "batch-reengage",
    name: "Batch Re-engage Old Leads",
    retries: 1,
  },
  { event: "admin/batch-reengage" },
  async ({ step, logger }) => {
    // Find old leads: trial expired > 10 days ago, never paid, no second trial yet
    const leads = await step.run("find-eligible-leads", async () => {
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
        LEFT JOIN user_stats us ON us."userId" = u.id
        WHERE s.status = 'trialing'
          AND s."trialEnd" < NOW() - INTERVAL '10 days'
          AND s."externalCustomerId" IS NULL
          AND s."secondTrialAt" IS NULL
          AND u."emailTrialReminders" IS DISTINCT FROM false
      `);
      return result.rows;
    });

    logger.info(`Batch re-engage: found ${leads.length} eligible old leads`);

    if (leads.length === 0) {
      return { success: true, total: 0, hot: 0, cold: 0, skipped: 0 };
    }

    const pricing = await step.run("get-pricing", async () => {
      const { proTier, lifetimeTier } = await getPricingTierInfo();
      return { monthlyPrice: proTier.price, lifetimePrice: lifetimeTier.price };
    });

    const discountCode = process.env.CREEM_DISCOUNT_CODE_25 || "HOTTIGER25";
    let hotCount = 0;
    let coldCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      // Space out emails: 30s between each
      if (i > 0) {
        await step.sleep(`wait-${i}`, "30s");
      }

      const result = await step.run(`process-lead-${lead.id}`, async () => {
        if (!lead.email) return "skipped" as const;

        const hasDeepSignal = lead.hasX || lead.hasTrustMRR || !!lead.brandingLogoUrl;
        const isHot = lead.exportCount > 2 && hasDeepSignal;
        const isCold = lead.exportCount <= 1;

        if (isHot) {
          const emailContent = hotLeadDiscountEmail(lead.name || "there", discountCode, 25, pricing);
          await sendEmail({ to: lead.email, ...emailContent });
          await pool.query(
            `UPDATE subscription SET "discountSentAt" = NOW(), "updatedAt" = NOW() WHERE "userId" = $1`,
            [lead.id]
          );
          return "hot" as const;
        } else if (isCold) {
          // Grant second trial
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

          return "cold" as const;
        }

        return "skipped" as const;
      });

      if (result === "hot") hotCount++;
      else if (result === "cold") coldCount++;
      else skippedCount++;

      logger.info(`Batch re-engage [${i + 1}/${leads.length}]: ${lead.email} → ${result}`);
    }

    logger.info(`Batch re-engage done: ${hotCount} hot, ${coldCount} cold, ${skippedCount} skipped`);

    return { success: true, total: leads.length, hot: hotCount, cold: coldCount, skipped: skippedCount };
  }
);

// Export all functions for the serve handler (max 5 on free Inngest plan — currently 4/5)
export const functions = [dailyAnalyticsFetch, dailyTrustMRRFetch, trialEmailSequence, batchReengage];
