import { inngest } from "@/lib/inngest";
import { fetchAccountAnalytics, getAllXAccounts } from "@/lib/analytics";

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
              accountId: account.id,
              email: account.email,
              ...fetchResult,
            };
          } catch (error) {
            return {
              accountId: account.id,
              email: account.email,
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

// Export all functions for the serve handler
export const functions = [dailyAnalyticsFetch];
