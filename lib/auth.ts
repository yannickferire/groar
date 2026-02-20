import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";
import { PLAN_LIMITS, PlanType, PLANS } from "@/lib/plans";

// Get user plan from database (inline to avoid circular imports)
async function getUserPlan(userId: string): Promise<PlanType> {
  try {
    const result = await pool.query(
      `SELECT plan FROM subscription WHERE "userId" = $1`,
      [userId]
    );
    const plan = result.rows[0]?.plan as PlanType | undefined;
    if (plan && plan in PLANS) {
      return plan;
    }
    return "free";
  } catch {
    return "free";
  }
}

export const auth = betterAuth({
  database: pool,
  user: {
    additionalFields: {
      xUsername: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      // Scopes needed for X API v2 analytics access
      // tweet.read: Access tweets and metrics
      // users.read: Access user profile and public_metrics
      // offline.access: Get refresh token for background fetching
      scope: ["tweet.read", "users.read", "offline.access"],
    },
  },
  databaseHooks: {
    account: {
      create: {
        before: async (account) => {
          // Skip limit check for Google (auth provider only)
          if (account.providerId === "google") {
            return;
          }

          // Count existing accounts for this provider
          const countResult = await pool.query(
            `SELECT COUNT(*) FROM account
             WHERE "userId" = $1 AND "providerId" = $2`,
            [account.userId, account.providerId]
          );
          const currentCount = parseInt(countResult.rows[0].count);

          // Always allow the first account link (needed for signup/signin)
          if (currentCount === 0) {
            return;
          }

          // Check connection limit for additional connections (analytics)
          const plan = await getUserPlan(account.userId);
          const maxConnections = PLAN_LIMITS[plan].maxConnectionsPerProvider;

          if (currentCount >= maxConnections) {
            throw new Error(
              `Connection limit reached. Your ${plan} plan allows ${maxConnections} connection(s) per platform.`
            );
          }
        },
        after: async (account) => {
          if (account.providerId === "twitter" && account.accessToken) {
            try {
              // Fetch username from Twitter API
              const response = await fetch("https://api.twitter.com/2/users/me", {
                headers: {
                  Authorization: `Bearer ${account.accessToken}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                const username = data.data?.username;

                if (username) {
                  // Update user with xUsername
                  await pool.query(
                    `UPDATE "user" SET "xUsername" = $1 WHERE id = $2`,
                    [username, account.userId]
                  );
                  console.log(`Updated xUsername to @${username} for user ${account.userId}`);
                }
              } else {
                console.error("Failed to fetch Twitter user:", await response.text());
              }
            } catch (error) {
              console.error("Error fetching Twitter username:", error);
            }
          }
        },
      },
    },
  },
});
