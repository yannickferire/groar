import { inngest } from "@/lib/inngest";
import { fetchAccountAnalytics, getAllXAccounts } from "@/lib/analytics";
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

// Trial ending reminder — runs daily at 8am UTC
// Finds trials expiring in the next 24h and sends a reminder
export const trialEndingReminder = inngest.createFunction(
  {
    id: "trial-ending-reminder",
    name: "Trial Ending Reminder",
    retries: 2,
  },
  { cron: "0 8 * * *" },
  async ({ step, logger }) => {
    const [users, pricing] = await Promise.all([
      step.run("find-ending-trials", async () => {
        const result = await pool.query(
          `SELECT u.email, u.name, s."trialEnd"
           FROM subscription s
           JOIN "user" u ON u.id = s."userId"
           WHERE s.plan = 'pro'
             AND s."trialEnd" IS NOT NULL
             AND s."trialEnd" > NOW()
             AND s."trialEnd" <= NOW() + interval '1 day'
             AND s.status = 'trialing'
             AND s."externalCustomerId" IS NULL`
        );
        return result.rows as { email: string; name: string; trialEnd: string }[];
      }),
      step.run("fetch-pricing", async () => {
        const { proTier, lifetimeTier } = await getPricingTierInfo();
        return { monthlyPrice: proTier.price, lifetimePrice: lifetimeTier.price };
      }),
    ]);

    logger.info(`Found ${users.length} trials ending in 24h`);

    for (const user of users) {
      await step.run(`send-trial-ending-${user.email}`, async () => {
        const email = trialEndingEmail(user.name || "there", pricing);
        await sendEmail({ to: user.email, ...email });
      });
    }

    return { sent: users.length };
  }
);

// Trial expired — runs daily at 9am UTC
// Finds trials that expired in the last 24h and sends a follow-up
export const trialExpiredNotification = inngest.createFunction(
  {
    id: "trial-expired-notification",
    name: "Trial Expired Notification",
    retries: 2,
  },
  { cron: "0 9 * * *" },
  async ({ step, logger }) => {
    const [users, pricing] = await Promise.all([
      step.run("find-expired-trials", async () => {
        const result = await pool.query(
          `SELECT u.email, u.name
           FROM subscription s
           JOIN "user" u ON u.id = s."userId"
           WHERE s."trialEnd" IS NOT NULL
             AND s."trialEnd" <= NOW()
             AND s."trialEnd" > NOW() - interval '1 day'
             AND s.plan = 'pro'
             AND s.status = 'trialing'
             AND s."externalCustomerId" IS NULL`
        );
        return result.rows as { email: string; name: string }[];
      }),
      step.run("fetch-pricing-expired", async () => {
        const { lifetimeTier } = await getPricingTierInfo();
        return { lifetimePrice: lifetimeTier.price };
      }),
    ]);

    logger.info(`Found ${users.length} expired trials`);

    for (const user of users) {
      await step.run(`send-trial-expired-${user.email}`, async () => {
        const email = trialExpiredEmail(user.name || "there", pricing);
        await sendEmail({ to: user.email, ...email });
      });
    }

    return { sent: users.length };
  }
);

// Trial follow-up — runs daily at 10am UTC
// Finds trials that expired 5 days ago (J+5) and sends a gentle nudge
export const trialFollowUp = inngest.createFunction(
  {
    id: "trial-follow-up",
    name: "Trial Follow-Up (J+5)",
    retries: 2,
  },
  { cron: "0 10 * * *" },
  async ({ step, logger }) => {
    const [users, pricing] = await Promise.all([
      step.run("find-followup-trials", async () => {
        const result = await pool.query(
          `SELECT u.email, u.name
           FROM subscription s
           JOIN "user" u ON u.id = s."userId"
           WHERE s."trialEnd" IS NOT NULL
             AND s."trialEnd" <= NOW() - interval '4 days'
             AND s."trialEnd" > NOW() - interval '5 days'
             AND s.status = 'trialing'
             AND s."externalCustomerId" IS NULL`
        );
        return result.rows as { email: string; name: string }[];
      }),
      step.run("fetch-pricing-followup", async () => {
        const { proTier, lifetimeTier } = await getPricingTierInfo();
        return { monthlyPrice: proTier.price, lifetimePrice: lifetimeTier.price };
      }),
    ]);

    logger.info(`Found ${users.length} trials for J+5 follow-up`);

    for (const user of users) {
      await step.run(`send-trial-followup-${user.email}`, async () => {
        const email = trialFollowUpEmail(user.name || "there", pricing);
        await sendEmail({ to: user.email, ...email });
      });
    }

    return { sent: users.length };
  }
);

// Export all functions for the serve handler
export const functions = [dailyAnalyticsFetch, trialEndingReminder, trialExpiredNotification, trialFollowUp];
