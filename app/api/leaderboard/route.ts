import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

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
        s.score,
        CASE WHEN GREATEST(s."lastLoginDate", s."lastExportDate") = CURRENT_DATE THEN s."pointsToday" ELSE 0 END AS "pointsToday"
      FROM "user" u
      INNER JOIN user_stats s ON s."userId" = u.id
      WHERE s.score > 0 AND u.id != $1
      ORDER BY s.score DESC, s."updatedAt" ASC
      LIMIT 10`,
      [ADMIN_USER_ID]
    );

    // Current user's rank + stats (exclude admin from ranking)
    const rankResult = await pool.query(
      `SELECT rank::INTEGER, score, "exportsCount", "currentStreak", "pointsToday",
              "loggedInToday", "exportsToday" FROM (
        SELECT
          u.id,
          s.score,
          s."exportsCount",
          s."currentStreak",
          s."pointsToday",
          (s."lastLoginDate" = CURRENT_DATE) AS "loggedInToday",
          CASE WHEN s."lastExportDate" = CURRENT_DATE THEN s."exportsToday" ELSE 0 END AS "exportsToday",
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
        `SELECT s.score, s."exportsCount", s."currentStreak", s."pointsToday",
                (s."lastLoginDate" = CURRENT_DATE) AS "loggedInToday",
                CASE WHEN s."lastExportDate" = CURRENT_DATE THEN s."exportsToday" ELSE 0 END AS "exportsToday"
         FROM user_stats s WHERE s."userId" = $1`,
        [session.user.id]
      );
      adminStats = adminResult.rows[0];
    }

    const userStats = isAdmin ? null : rankResult.rows[0];

    // Fetch current user's badges
    const badgesResult = await pool.query(
      `SELECT "badgeId", "earnedAt" FROM user_badges WHERE "userId" = $1 ORDER BY "earnedAt" ASC`,
      [session.user.id]
    );

    return NextResponse.json({
      leaderboard: result.rows,
      currentUserId: session.user.id,
      currentUserRank: isAdmin ? 0 : (userStats?.rank ?? null),
      currentUserScore: isAdmin ? (adminStats?.score ?? 0) : (userStats?.score ?? 0),
      currentUserExports: isAdmin ? (adminStats?.exportsCount ?? 0) : (userStats?.exportsCount ?? 0),
      currentUserStreak: isAdmin ? (adminStats?.currentStreak ?? 0) : (userStats?.currentStreak ?? 0),
      currentUserPointsToday: isAdmin ? (adminStats?.pointsToday ?? 0) : (userStats?.pointsToday ?? 0),
      currentUserLoggedInToday: isAdmin ? (adminStats?.loggedInToday ?? false) : (userStats?.loggedInToday ?? false),
      currentUserExportsToday: isAdmin ? (adminStats?.exportsToday ?? 0) : (userStats?.exportsToday ?? 0),
      currentUserBadges: badgesResult.rows,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
