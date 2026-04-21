import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";
import { PLAN_LIMITS, PlanType, PLANS } from "@/lib/plans";
import { sendEmail, welcomeEmail } from "@/lib/email";

// Get user plan from database (inline to avoid circular imports)
async function getUserPlan(userId: string): Promise<PlanType> {
  try {
    const result = await pool.query(
      `SELECT plan, status, "trialEnd" FROM subscription WHERE "userId" = $1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row || !(row.plan in PLANS)) return "free";

    // Expired trials should be treated as free
    if (row.status === "trialing" && row.trialEnd && new Date(row.trialEnd) < new Date()) {
      return "free";
    }

    return row.plan as PlanType;
  } catch {
    return "free";
  }
}

export const auth = betterAuth({
  database: pool,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["twitter"],
      allowDifferentEmails: true,
    },
  },
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
      // Scopes needed for X API v2 analytics + auto-posting
      // tweet.read: Access tweets and metrics
      // tweet.write: Post tweets on behalf of user
      // media.write: Upload media (images) for tweets
      // users.read: Access user profile and public_metrics
      // offline.access: Get refresh token for background fetching
      scope: ["tweet.read", "tweet.write", "media.write", "users.read", "offline.access"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.email) {
            const email = welcomeEmail(user.name || "there");
            sendEmail({ to: user.email, ...email }).catch(console.error);
          }
        },
      },
    },
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
              const response = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
                headers: {
                  Authorization: `Bearer ${account.accessToken}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                const username = data.data?.username;
                const profileImageUrl = data.data?.profile_image_url?.replace("_normal", "_400x400") || null;

                if (username) {
                  await pool.query(
                    `UPDATE "user" SET "xUsername" = $1 WHERE id = $2`,
                    [username, account.userId]
                  );
                  // Store username and profile image on the account row
                  await pool.query(
                    `UPDATE account SET username = $1, "profileImageUrl" = $2 WHERE id = $3`,
                    [username, profileImageUrl, account.id]
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
