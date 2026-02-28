import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { checkAndAwardBadges } from "@/lib/check-badges";
import { NextRequest, NextResponse } from "next/server";

const MAX_CREDITED_EXPORTS_PER_DAY = 5;

type StatsForBadges = {
  exportsCount: number;
  uniqueTemplatesCount: number;
  uniqueBackgroundsCount: number;
  longestStreak: number;
  score: number;
};

type StatsResult = { pointsEarned: number; pointsToday: number; stats: StatsForBadges };

function computeScore(stats: {
  totalLoginDays: number;
  creditedExportsCount: number;
  uniqueTemplatesCount: number;
  uniqueBackgroundsCount: number;
  longestStreak: number;
}) {
  return (
    stats.totalLoginDays * 20 +
    stats.creditedExportsCount * 10 +
    stats.uniqueTemplatesCount * 50 +
    stats.uniqueBackgroundsCount * 20 +
    (stats.longestStreak >= 7 ? 50 : 0) +
    (stats.longestStreak >= 30 ? 100 : 0) +
    (stats.longestStreak >= 90 ? 300 : 0)
  );
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await req.json();
    const action = body.action;

    // Ensure user has a stats row
    await pool.query(
      `INSERT INTO user_stats ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING`,
      [session.user.id]
    );

    let result: StatsResult = {
      pointsEarned: 0,
      pointsToday: 0,
      stats: { exportsCount: 0, uniqueTemplatesCount: 0, uniqueBackgroundsCount: 0, longestStreak: 0, score: 0 },
    };

    if (action === "login") {
      result = await handleLogin(session.user.id);
    } else if (action === "export") {
      result = await handleExport(session.user.id, body.template, body.backgroundId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newBadges = await checkAndAwardBadges(
      session.user.id,
      result.stats,
      { action, exportHour: action === "export" ? body.localHour : undefined }
    );

    return NextResponse.json({
      ok: true,
      pointsEarned: result.pointsEarned,
      pointsToday: result.pointsToday,
      newBadges,
    });
  } catch (error) {
    console.error("User stats error:", error);
    return NextResponse.json({ ok: true, pointsEarned: 0, pointsToday: 0, newBadges: [] });
  }
}

// All date comparisons are done in SQL using CURRENT_DATE to avoid
// JavaScript Date timezone bugs with pg DATE columns.

async function handleLogin(userId: string): Promise<StatsResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT "totalLoginDays", "currentStreak", "longestStreak",
              "creditedExportsCount", "uniqueTemplatesCount", "uniqueBackgroundsCount",
              "exportsCount", "score", "pointsToday",
              ("lastLoginDate" = CURRENT_DATE) AS "loginToday",
              (GREATEST("lastLoginDate", "lastExportDate") = CURRENT_DATE) AS "hadActivityToday",
              (GREATEST("lastLoginDate", "lastExportDate") = CURRENT_DATE - 1) AS "hadActivityYesterday"
       FROM user_stats WHERE "userId" = $1 FOR UPDATE`,
      [userId]
    );

    const stats = result.rows[0];
    if (!stats) {
      await client.query("COMMIT");
      return { pointsEarned: 0, pointsToday: 0, stats: { exportsCount: 0, uniqueTemplatesCount: 0, uniqueBackgroundsCount: 0, longestStreak: 0, score: 0 } };
    }

    // Already logged in today — return current pointsToday
    if (stats.loginToday) {
      await client.query("COMMIT");
      return {
        pointsEarned: 0,
        pointsToday: stats.pointsToday,
        stats: {
          exportsCount: stats.exportsCount,
          uniqueTemplatesCount: stats.uniqueTemplatesCount,
          uniqueBackgroundsCount: stats.uniqueBackgroundsCount,
          longestStreak: stats.longestStreak,
          score: stats.score,
        },
      };
    }

    const isFirstActivityToday = !stats.hadActivityToday;

    let newStreak = 1;
    if (stats.hadActivityToday) {
      newStreak = stats.currentStreak;
    } else if (stats.hadActivityYesterday) {
      newStreak = stats.currentStreak + 1;
    }

    const newLongest = Math.max(stats.longestStreak, newStreak);
    const newLoginDays = stats.totalLoginDays + 1;

    const oldScore = stats.score;
    const newScore = computeScore({
      totalLoginDays: newLoginDays,
      creditedExportsCount: stats.creditedExportsCount,
      uniqueTemplatesCount: stats.uniqueTemplatesCount,
      uniqueBackgroundsCount: stats.uniqueBackgroundsCount,
      longestStreak: newLongest,
    });

    const pointsEarned = newScore - oldScore;
    const newPointsToday = (isFirstActivityToday ? 0 : stats.pointsToday) + pointsEarned;

    await client.query(
      `UPDATE user_stats SET
        "totalLoginDays" = $2,
        "currentStreak" = $3,
        "longestStreak" = $4,
        "lastLoginDate" = CURRENT_DATE,
        "score" = $5,
        "pointsToday" = $6,
        "updatedAt" = NOW()
      WHERE "userId" = $1`,
      [userId, newLoginDays, newStreak, newLongest, newScore, newPointsToday]
    );

    await client.query("COMMIT");

    return {
      pointsEarned,
      pointsToday: newPointsToday,
      stats: {
        exportsCount: stats.exportsCount,
        uniqueTemplatesCount: stats.uniqueTemplatesCount,
        uniqueBackgroundsCount: stats.uniqueBackgroundsCount,
        longestStreak: newLongest,
        score: newScore,
      },
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function handleExport(userId: string, template?: string, backgroundId?: string): Promise<StatsResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT "totalLoginDays", "exportsCount", "creditedExportsCount",
              "uniqueTemplatesCount", "uniqueBackgroundsCount",
              "usedTemplates", "usedBackgrounds", "currentStreak", "longestStreak",
              "exportsToday", "score", "pointsToday",
              ("lastExportDate" = CURRENT_DATE) AS "exportToday",
              (GREATEST("lastLoginDate", "lastExportDate") = CURRENT_DATE) AS "hadActivityToday",
              (GREATEST("lastLoginDate", "lastExportDate") = CURRENT_DATE - 1) AS "hadActivityYesterday"
       FROM user_stats WHERE "userId" = $1 FOR UPDATE`,
      [userId]
    );

    const stats = result.rows[0];
    if (!stats) {
      await client.query("COMMIT");
      return { pointsEarned: 0, pointsToday: 0, stats: { exportsCount: 0, uniqueTemplatesCount: 0, uniqueBackgroundsCount: 0, longestStreak: 0, score: 0 } };
    }

    // Always increment total exports (for display)
    const newExports = stats.exportsCount + 1;

    // Daily cap: only credit max 3 exports per day for score
    const isNewExportDay = !stats.exportToday;
    const newExportsToday = isNewExportDay ? 1 : stats.exportsToday + 1;
    const canCredit = newExportsToday <= MAX_CREDITED_EXPORTS_PER_DAY;
    const newCredited = canCredit ? stats.creditedExportsCount + 1 : stats.creditedExportsCount;

    // Streak based on most recent activity (login OR export)
    const isFirstActivityToday = !stats.hadActivityToday;

    let newStreak = stats.currentStreak;
    let newLongest = stats.longestStreak;

    if (isFirstActivityToday) {
      newStreak = stats.hadActivityYesterday ? stats.currentStreak + 1 : 1;
      newLongest = Math.max(stats.longestStreak, newStreak);
    }

    let newTemplateCount = stats.uniqueTemplatesCount;
    let newBgCount = stats.uniqueBackgroundsCount;
    let usedTemplates: string[] = stats.usedTemplates || [];
    let usedBackgrounds: string[] = stats.usedBackgrounds || [];

    if (template && !usedTemplates.includes(template)) {
      usedTemplates = [...usedTemplates, template];
      newTemplateCount++;
    }

    if (backgroundId && !usedBackgrounds.includes(backgroundId)) {
      usedBackgrounds = [...usedBackgrounds, backgroundId];
      newBgCount++;
    }

    const oldScore = stats.score;
    const newScore = computeScore({
      totalLoginDays: stats.totalLoginDays,
      creditedExportsCount: newCredited,
      uniqueTemplatesCount: newTemplateCount,
      uniqueBackgroundsCount: newBgCount,
      longestStreak: newLongest,
    });

    const pointsEarned = newScore - oldScore;
    const newPointsToday = (isFirstActivityToday ? 0 : stats.pointsToday) + pointsEarned;

    await client.query(
      `UPDATE user_stats SET
        "exportsCount" = $2,
        "creditedExportsCount" = $3,
        "exportsToday" = $4,
        "lastExportDate" = CURRENT_DATE,
        "uniqueTemplatesCount" = $5,
        "uniqueBackgroundsCount" = $6,
        "usedTemplates" = $7,
        "usedBackgrounds" = $8,
        "currentStreak" = $9,
        "longestStreak" = $10,
        "score" = $11,
        "pointsToday" = $12,
        "updatedAt" = NOW()
      WHERE "userId" = $1`,
      [userId, newExports, newCredited, newExportsToday, newTemplateCount, newBgCount, usedTemplates, usedBackgrounds, newStreak, newLongest, newScore, newPointsToday]
    );

    await client.query("COMMIT");

    return {
      pointsEarned,
      pointsToday: newPointsToday,
      stats: {
        exportsCount: newExports,
        uniqueTemplatesCount: newTemplateCount,
        uniqueBackgroundsCount: newBgCount,
        longestStreak: newLongest,
        score: newScore,
      },
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
