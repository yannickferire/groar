import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const MAX_CREDITED_EXPORTS_PER_DAY = 3;

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

    if (action === "login") {
      await handleLogin(session.user.id);
    } else if (action === "export") {
      await handleExport(session.user.id, body.template, body.backgroundId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("User stats error:", error);
    return NextResponse.json({ ok: true });
  }
}

function getLastActivity(lastLoginDate: string | null, lastExportDate: string | null): Date | null {
  const dates: Date[] = [];
  if (lastLoginDate) {
    const d = new Date(lastLoginDate);
    d.setUTCHours(0, 0, 0, 0);
    dates.push(d);
  }
  if (lastExportDate) {
    const d = new Date(lastExportDate);
    d.setUTCHours(0, 0, 0, 0);
    dates.push(d);
  }
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map(d => d.getTime())));
}

async function handleLogin(userId: string) {
  const result = await pool.query(
    `SELECT "totalLoginDays", "currentStreak", "longestStreak", "lastLoginDate", "lastExportDate",
            "creditedExportsCount", "uniqueTemplatesCount", "uniqueBackgroundsCount"
     FROM user_stats WHERE "userId" = $1`,
    [userId]
  );

  const stats = result.rows[0];
  if (!stats) return;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const lastLogin = stats.lastLoginDate ? new Date(stats.lastLoginDate) : null;
  if (lastLogin) lastLogin.setUTCHours(0, 0, 0, 0);

  // Already logged in today
  if (lastLogin && lastLogin.getTime() === today.getTime()) return;

  // Streak based on most recent activity (login OR export)
  const lastActivity = getLastActivity(stats.lastLoginDate, stats.lastExportDate);

  let newStreak = 1;
  if (lastActivity) {
    if (lastActivity.getTime() === today.getTime()) {
      // Already active today (via export) — keep streak, just add login day
      newStreak = stats.currentStreak;
    } else {
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      if (lastActivity.getTime() === yesterday.getTime()) {
        newStreak = stats.currentStreak + 1;
      }
    }
  }

  const newLongest = Math.max(stats.longestStreak, newStreak);
  const newLoginDays = stats.totalLoginDays + 1;

  const score = computeScore({
    totalLoginDays: newLoginDays,
    creditedExportsCount: stats.creditedExportsCount,
    uniqueTemplatesCount: stats.uniqueTemplatesCount,
    uniqueBackgroundsCount: stats.uniqueBackgroundsCount,
    longestStreak: newLongest,
  });

  await pool.query(
    `UPDATE user_stats SET
      "totalLoginDays" = $2,
      "currentStreak" = $3,
      "longestStreak" = $4,
      "lastLoginDate" = CURRENT_DATE,
      "score" = $5,
      "updatedAt" = NOW()
    WHERE "userId" = $1`,
    [userId, newLoginDays, newStreak, newLongest, score]
  );
}

async function handleExport(userId: string, template?: string, backgroundId?: string) {
  const result = await pool.query(
    `SELECT "totalLoginDays", "exportsCount", "creditedExportsCount",
            "uniqueTemplatesCount", "uniqueBackgroundsCount",
            "usedTemplates", "usedBackgrounds", "currentStreak", "longestStreak",
            "lastExportDate", "lastLoginDate", "exportsToday"
     FROM user_stats WHERE "userId" = $1`,
    [userId]
  );

  const stats = result.rows[0];
  if (!stats) return;

  // Always increment total exports (for display)
  const newExports = stats.exportsCount + 1;

  // Daily cap: only credit max 3 exports per day for score
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const lastExport = stats.lastExportDate ? new Date(stats.lastExportDate) : null;
  if (lastExport) lastExport.setUTCHours(0, 0, 0, 0);

  const isNewDay = !lastExport || lastExport.getTime() !== today.getTime();
  const newExportsToday = isNewDay ? 1 : stats.exportsToday + 1;
  const canCredit = newExportsToday <= MAX_CREDITED_EXPORTS_PER_DAY;
  const newCredited = canCredit ? stats.creditedExportsCount + 1 : stats.creditedExportsCount;

  // Streak based on most recent activity (login OR export)
  const lastActivity = getLastActivity(stats.lastLoginDate, stats.lastExportDate);

  let newStreak = stats.currentStreak;
  let newLongest = stats.longestStreak;

  if (!lastActivity || lastActivity.getTime() !== today.getTime()) {
    // First activity today — update streak
    newStreak = 1;
    if (lastActivity) {
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      if (lastActivity.getTime() === yesterday.getTime()) {
        newStreak = stats.currentStreak + 1;
      }
    }
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

  const score = computeScore({
    totalLoginDays: stats.totalLoginDays,
    creditedExportsCount: newCredited,
    uniqueTemplatesCount: newTemplateCount,
    uniqueBackgroundsCount: newBgCount,
    longestStreak: newLongest,
  });

  await pool.query(
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
      "updatedAt" = NOW()
    WHERE "userId" = $1`,
    [userId, newExports, newCredited, newExportsToday, newTemplateCount, newBgCount, usedTemplates, usedBackgrounds, newStreak, newLongest, score]
  );
}
