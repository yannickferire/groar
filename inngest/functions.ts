import { inngest } from "@/lib/inngest";
import { fetchAccountAnalytics, getAllXAccounts } from "@/lib/analytics";
import { fetchTrustMRRForUser, getUsersForTrustMRR } from "@/lib/trustmrr-analytics";
import { pool } from "@/lib/db";
import { sendEmail, trialEndingEmail, trialExpiredEmail, trialFollowUpEmail } from "@/lib/email";
import { getPricingTierInfo } from "@/lib/plans-server";

// Daily analytics fetch - runs at 1am UTC for all accounts
export const dailyAnalyticsFetch = inngest.createFunction(
  {
    id: "daily-analytics-fetch",
    name: "Daily X Analytics Fetch",
    retries: 3,
  },
  { cron: "0 1,7,13,19 * * *" }, // Every 6 hours: 1am, 7am, 1pm, 7pm UTC
  async ({ step, logger }) => {
    // Get all X accounts
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

    // Process each account
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

    return { userId, emailsSent: true };
  }
);

// Daily TrustMRR fetch — runs once per day at 2am UTC
export const dailyTrustMRRFetch = inngest.createFunction(
  {
    id: "daily-trustmrr-fetch",
    name: "Daily TrustMRR Fetch",
    retries: 2,
  },
  { cron: "0 2 * * *" },
  async ({ step, logger }) => {
    const users = await step.run("get-trustmrr-users", async () => {
      return await getUsersForTrustMRR();
    });

    logger.info(`Found ${users.length} users with TrustMRR data`);

    if (users.length === 0) {
      return { message: "No users with TrustMRR data", users: [] };
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Rate limit: TrustMRR allows 20 req/min, space out requests
      if (i > 0) {
        await step.sleep(`wait-${i}`, "4s");
      }

      const result = await step.run(
        `fetch-trustmrr-${user.userId}`,
        async () => {
          try {
            return await fetchTrustMRRForUser(
              user.userId,
              user.xUsername,
              "auto"
            );
          } catch (error) {
            return {
              userId: user.userId,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }
      );

      if ("success" in result && result.success) {
        successCount++;
      } else if ("alreadyFetched" in result && result.alreadyFetched) {
        skippedCount++;
      } else if ("notFound" in result && result.notFound) {
        skippedCount++;
      } else {
        errorCount++;
        if ("error" in result) {
          logger.error(`TrustMRR error for ${user.userId}: ${result.error}`);
        }
      }
    }

    logger.info(
      `TrustMRR: ${successCount} success, ${errorCount} errors, ${skippedCount} skipped`
    );

    return {
      success: true,
      summary: {
        total: users.length,
        success: successCount,
        errors: errorCount,
        skipped: skippedCount,
      },
    };
  }
);

// Cleanup old daily_points rows (older than 60 days) — runs 1st of each month
export const dailyPointsCleanup = inngest.createFunction(
  {
    id: "daily-points-cleanup",
    name: "Daily Points Cleanup",
    retries: 2,
  },
  { cron: "0 2 1 * *" },
  async ({ logger }) => {
    const result = await pool.query(
      `DELETE FROM daily_points WHERE date < CURRENT_DATE - 60`
    );
    logger.info(`Daily points cleanup: ${result.rowCount} old rows deleted`);
    return { success: true, rowsDeleted: result.rowCount };
  }
);

// Export all functions for the serve handler
export const functions = [dailyAnalyticsFetch, dailyTrustMRRFetch, dailyPointsCleanup, trialEmailSequence];
