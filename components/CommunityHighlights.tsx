import { pool } from "@/lib/db";
import { ADMIN_USER_ID } from "@/lib/api-auth";
import CommunityHighlightsClient from "./CommunityHighlightsClient";

type LeaderboardUser = {
  name: string | null;
  image: string | null;
  xUsername: string | null;
  score: number;
  startupWebsite: string | null;
};

type FastestBuyer = {
  name: string | null;
  image: string | null;
  xUsername: string | null;
  secondsToBuy: number;
  startupWebsite: string | null;
};

async function getTopLeaderboard(): Promise<LeaderboardUser[]> {
  try {
    const result = await pool.query(
      `SELECT
        u.name, u.image, u."xUsername",
        COALESCE(dp.score, 0)::int AS "score",
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
      LIMIT 3`,
      [ADMIN_USER_ID]
    );
    return result.rows;
  } catch {
    return [];
  }
}

async function getFastestBuyers(): Promise<FastestBuyer[]> {
  try {
    const result = await pool.query(
      `SELECT
        u.name, u.image, u."xUsername",
        EXTRACT(EPOCH FROM (s."updatedAt" - s."trialStart"))::int as "secondsToBuy",
        tmrr.website AS "startupWebsite"
      FROM "user" u
      JOIN subscription s ON s."userId" = u.id
      LEFT JOIN LATERAL (
        SELECT "startupName", website FROM trustmrr_snapshot
        WHERE "userId" = u.id AND "startupName" IS NOT NULL
        ORDER BY date DESC, "createdAt" DESC LIMIT 1
      ) tmrr ON true
      WHERE s."externalCustomerId" IS NOT NULL
        AND s.plan = 'pro'
        AND s."billingPeriod" = 'lifetime'
        AND s."trialStart" IS NOT NULL
        AND u.id != $1
      ORDER BY (s."updatedAt" - s."trialStart") ASC
      LIMIT 3`,
      [ADMIN_USER_ID]
    );
    return result.rows;
  } catch {
    return [];
  }
}

export default async function CommunityHighlights() {
  const [leaderboard, fastestBuyers] = await Promise.all([
    getTopLeaderboard(),
    getFastestBuyers(),
  ]);

  // Strip data: URLs from images to avoid serializing MB of base64 in RSC payload
  const cleanImage = (img: string | null) => img && !img.startsWith("data:") ? img : null;
  const cleanLeaderboard = leaderboard.map((u) => ({ ...u, image: cleanImage(u.image) }));
  const cleanBuyers = fastestBuyers.map((b) => ({ ...b, image: cleanImage(b.image) }));

  return (
    <CommunityHighlightsClient
      leaderboard={cleanLeaderboard}
      fastestBuyers={cleanBuyers}
    />
  );
}
