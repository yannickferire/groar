import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";

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
    },
  },
  databaseHooks: {
    account: {
      create: {
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
