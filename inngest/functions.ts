import { inngest } from "@/lib/inngest";
import { fetchAccountAnalytics, getAllXAccounts } from "@/lib/analytics";
import { pool } from "@/lib/db";
import { sendEmail, trialEndingEmail, trialExpiredEmail } from "@/lib/email";

// Daily analytics fetch - runs at 1am UTC for all accounts
export const dailyAnalyticsFetch = inngest.createFunction(
  {
    id: "daily-analytics-fetch",
    name: "Daily X Analytics Fetch",
    retries: 3,
  },
  { cron: "0 1 * * *" }, // 1am UTC daily
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
              "auto"
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
    const users = await step.run("find-ending-trials", async () => {
      const result = await pool.query(
        `SELECT u.email, u.name, s."trialEnd"
         FROM subscription s
         JOIN "user" u ON u.id = s."userId"
         WHERE s.plan = 'pro'
           AND s."trialEnd" IS NOT NULL
           AND s."trialEnd" > NOW()
           AND s."trialEnd" <= NOW() + interval '1 day'
           AND s.status = 'active'`
      );
      return result.rows as { email: string; name: string; trialEnd: string }[];
    });

    logger.info(`Found ${users.length} trials ending in 24h`);

    for (const user of users) {
      await step.run(`send-trial-ending-${user.email}`, async () => {
        const email = trialEndingEmail(user.name || "there");
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
    const users = await step.run("find-expired-trials", async () => {
      const result = await pool.query(
        `SELECT u.email, u.name
         FROM subscription s
         JOIN "user" u ON u.id = s."userId"
         WHERE s."trialEnd" IS NOT NULL
           AND s."trialEnd" <= NOW()
           AND s."trialEnd" > NOW() - interval '1 day'
           AND s.plan = 'free'`
      );
      return result.rows as { email: string; name: string }[];
    });

    logger.info(`Found ${users.length} expired trials`);

    for (const user of users) {
      await step.run(`send-trial-expired-${user.email}`, async () => {
        const email = trialExpiredEmail(user.name || "there");
        await sendEmail({ to: user.email, ...email });
      });
    }

    return { sent: users.length };
  }
);

// Export all functions for the serve handler
export const functions = [dailyAnalyticsFetch, trialEndingReminder, trialExpiredNotification];
