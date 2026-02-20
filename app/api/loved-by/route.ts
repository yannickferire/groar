import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Public avatars for landing page (top 5 users by followers, Twitter first)
export async function GET() {
  try {
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM "user"`
    );
    const totalUsers = parseInt(totalResult.rows[0].count, 10);

    // Prioritize Twitter accounts, then sort by highest follower count
    const avatarsResult = await pool.query(
      `SELECT DISTINCT ON (u."id")
         u."image", u."name",
         CASE WHEN a."providerId" = 'twitter' THEN 1 ELSE 0 END AS has_twitter,
         COALESCE(xs."followersCount", 0) AS followers
       FROM "user" u
       LEFT JOIN "account" a ON a."userId" = u."id" AND a."providerId" = 'twitter'
       LEFT JOIN LATERAL (
         SELECT "followersCount" FROM "x_analytics_snapshot"
         WHERE "accountId" = a."id"
         ORDER BY "date" DESC LIMIT 1
       ) xs ON true
       WHERE u."image" IS NOT NULL
         AND u."image" LIKE '%pbs.twimg.com%'
       ORDER BY u."id", has_twitter DESC
       LIMIT 5`
    );

    // Re-sort: Twitter accounts with most followers first
    const sorted = avatarsResult.rows.sort((a, b) => {
      if (a.has_twitter !== b.has_twitter) return b.has_twitter - a.has_twitter;
      return b.followers - a.followers;
    });

    return NextResponse.json({
      totalUsers,
      avatars: sorted.map(({ image, name }) => ({
        image: image.replace(/_normal\./, '_200x200.'),
        name,
      })),
    });
  } catch (error) {
    console.error("Loved-by error:", error);
    return NextResponse.json({
      totalUsers: 0,
      avatars: [],
    });
  }
}
