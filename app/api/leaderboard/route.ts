import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

const ADMIN_USER_ID = "gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const isAdmin = session.user.id === ADMIN_USER_ID;

  try {
    // Top 10 leaderboard (excluding admin)
    const result = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.image,
        u."xUsername",
        s."exportsCount",
        s."totalLoginDays",
        s."currentStreak",
        s."longestStreak",
        s."uniqueTemplatesCount",
        s."uniqueBackgroundsCount",
        s.score
      FROM "user" u
      INNER JOIN user_stats s ON s."userId" = u.id
      WHERE s.score > 0 AND u.id != $1
      ORDER BY s.score DESC, s."updatedAt" ASC
      LIMIT 10`,
      [ADMIN_USER_ID]
    );

    // Current user's rank + stats (exclude admin from ranking)
    const rankResult = await pool.query(
      `SELECT rank::INTEGER, score, "exportsCount", "currentStreak" FROM (
        SELECT
          u.id,
          s.score,
          s."exportsCount",
          s."currentStreak",
          RANK() OVER (ORDER BY s.score DESC, s."updatedAt" ASC) as rank
        FROM "user" u
        INNER JOIN user_stats s ON s."userId" = u.id
        WHERE s.score > 0 AND u.id != $2
      ) ranked
      WHERE id = $1`,
      [session.user.id, ADMIN_USER_ID]
    );

    // If admin, fetch their stats separately (not ranked)
    let adminStats = null;
    if (isAdmin) {
      const adminResult = await pool.query(
        `SELECT s.score, s."exportsCount", s."currentStreak"
         FROM user_stats s WHERE s."userId" = $1`,
        [session.user.id]
      );
      adminStats = adminResult.rows[0];
    }

    return NextResponse.json({
      leaderboard: result.rows,
      currentUserId: session.user.id,
      currentUserRank: isAdmin ? 0 : (rankResult.rows[0]?.rank ?? null),
      currentUserScore: isAdmin ? (adminStats?.score ?? 0) : (rankResult.rows[0]?.score ?? 0),
      currentUserExports: isAdmin ? (adminStats?.exportsCount ?? 0) : (rankResult.rows[0]?.exportsCount ?? 0),
      currentUserStreak: isAdmin ? (adminStats?.currentStreak ?? 0) : (rankResult.rows[0]?.currentStreak ?? 0),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
