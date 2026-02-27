import { pool } from "@/lib/db";
import { BadgeId } from "@/lib/badges";

const ADMIN_USER_ID = "gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc";

type UserStats = {
  exportsCount: number;
  uniqueTemplatesCount: number;
  uniqueBackgroundsCount: number;
  longestStreak: number;
  score: number;
};

type CheckContext = {
  action: "login" | "export";
  exportHour?: number;
};

function computeEligibleBadges(stats: UserStats, ctx: CheckContext): BadgeId[] {
  const eligible: BadgeId[] = [];

  if (stats.exportsCount >= 1) eligible.push("first-roar");
  if (stats.uniqueTemplatesCount >= 3) eligible.push("template-explorer");
  if (stats.uniqueBackgroundsCount >= 10) eligible.push("background-hunter");
  if (stats.longestStreak >= 7) eligible.push("week-warrior");
  if (stats.longestStreak >= 30) eligible.push("month-master");
  if (stats.longestStreak >= 90) eligible.push("legend");
  if (stats.score >= 500) eligible.push("rising-star");
  if (stats.score >= 1000) eligible.push("groar-elite");

  if (ctx.action === "export" && ctx.exportHour !== undefined) {
    if (ctx.exportHour >= 0 && ctx.exportHour < 5) eligible.push("night-owl");
    if (ctx.exportHour >= 5 && ctx.exportHour < 8) eligible.push("early-bird");
  }

  return eligible;
}

async function isRankOne(userId: string): Promise<boolean> {
  // Admin (rank #0) always qualifies
  if (userId === ADMIN_USER_ID) return true;

  const result = await pool.query(
    `SELECT "userId" FROM user_stats
     WHERE score > 0 AND "userId" != $1
     ORDER BY score DESC, "updatedAt" ASC
     LIMIT 1`,
    [ADMIN_USER_ID]
  );
  return result.rows.length > 0 && result.rows[0].userId === userId;
}

export async function checkAndAwardBadges(
  userId: string,
  stats: UserStats,
  ctx: CheckContext
): Promise<BadgeId[]> {
  const eligible = computeEligibleBadges(stats, ctx);

  // Check rank #1 for jungle-king badge
  if (stats.score > 0 && await isRankOne(userId)) {
    eligible.push("jungle-king");
  }

  if (eligible.length === 0) return [];

  const existing = await pool.query(
    `SELECT "badgeId" FROM user_badges WHERE "userId" = $1`,
    [userId]
  );
  const existingSet = new Set(existing.rows.map((r: { badgeId: string }) => r.badgeId));

  const newBadges = eligible.filter((id) => !existingSet.has(id));
  if (newBadges.length === 0) return [];

  await pool.query(
    `INSERT INTO user_badges ("userId", "badgeId")
     VALUES ${newBadges.map((_, i) => `($1, $${i + 2})`).join(", ")}
     ON CONFLICT DO NOTHING`,
    [userId, ...newBadges]
  );

  return newBadges;
}
