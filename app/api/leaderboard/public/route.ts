import { ADMIN_USER_ID } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const excludeId = ADMIN_USER_ID;

  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.image,
        u."xUsername",
        s."exportsCount",
        s."currentStreak",
        COALESCE(dp.score, 0) AS "score",
        CASE WHEN GREATEST(s."lastLoginDate", s."lastExportDate") = CURRENT_DATE THEN s."pointsToday" ELSE 0 END AS "pointsToday",
        tmrr."startupName",
        tmrr.website AS "startupWebsite"
      FROM "user" u
      INNER JOIN user_stats s ON s."userId" = u.id
      LEFT JOIN LATERAL (
        SELECT SUM(points) AS score FROM daily_points
        WHERE "userId" = u.id AND date > CURRENT_DATE - 30
      ) dp ON true
      LEFT JOIN LATERAL (
        SELECT "startupName", website FROM trustmrr_snapshot
        WHERE "userId" = u.id AND "startupName" IS NOT NULL
        ORDER BY date DESC, "createdAt" DESC LIMIT 1
      ) tmrr ON true
      WHERE COALESCE(dp.score, 0) > 0 AND u.id != $1
      ORDER BY dp.score DESC, s."updatedAt" ASC
      LIMIT 10`,
      [excludeId]
    );

    return NextResponse.json({
      leaderboard: result.rows,
    });
  } catch (error) {
    console.error("Public leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
