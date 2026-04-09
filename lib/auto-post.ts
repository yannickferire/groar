import { pool } from "./db";
import { getUserPlanFromDB } from "./plans-server";
import { uploadMedia, postTweet, refreshAccessToken, isTokenExpired, XApiError, getAuthenticatedUser } from "./x-api";
import { fetchStartupByXHandle } from "./trustmrr";
import { getNextMilestone, getNextMilestoneAbove } from "./milestones";
import { sendEmail, automationPostedEmail } from "./email";
import {
  DEFAULT_TEMPLATES,
  FREQUENCY_HOURS,
  MONTHLY_CREDITS,
  CREDIT_COST_POST,
  METRIC_DISPLAY_LABELS,
  formatMilestoneNumber,
  DEFAULT_VISUAL_SETTINGS_SINGLE,
  pickRandom,
  parseTweetVariants,
  type MilestoneMetric,
  type AutoPostMetric,
  type AutoPostTrigger,
  type AutomationVisualSettings,
  type AutoPostCardTemplate,
} from "./auto-post-shared";

// Re-export everything from shared for server-side consumers
export * from "./auto-post-shared";

// ─── Helpers ────────────────────────────────────────────────────────

type AutomationRow = {
  id: string;
  metric: string; // single metric or JSON array for multi-metric
  trigger: AutoPostTrigger;
  cardTemplate: AutoPostCardTemplate;
  goal: number | null;
  tweetTemplate: string | null;
  visualSettings: AutomationVisualSettings;
  enabled: boolean;
  startDay: number | null;
  startDate: string | null;
  endDate: string | null;
  scheduleHour: number | null;
  scheduleDay: number | null;
};

/** Calculate the current day/week number from start date and start day */
function calculateDayNumber(startDay: number | null, startDate: string | null, trigger: AutoPostTrigger): number {
  const base = startDay ?? 1;
  if (!startDate) return base;
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (trigger === "weekly") return base + Math.floor(diffDays / 7);
  return base + diffDays;
}

/** Compute progress variables from start/end dates and current value */
function computeProgressVars(
  startDate: string | null,
  endDate: string | null,
  value: number,
  goal: number | null,
  delta: number | null
): ProgressVars {
  const now = new Date();
  let currentDay: number | undefined;
  let totalDays: number | undefined;
  let daysLeft: number | undefined;

  if (startDate) {
    const start = new Date(startDate);
    currentDay = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (endDate) {
      const end = new Date(endDate);
      totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // inclusive
      daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + 1); // inclusive
    }
  }

  const percent = goal && goal > 0 ? Math.min((value / goal) * 100, 100) : undefined;

  return { currentDay, totalDays, daysLeft, percent, delta: delta ?? undefined };
}

/** Get the delta (change since yesterday) from analytics snapshots, with fallback to last posted value */
async function getDelta(
  metric: string,
  currentValue: number,
  userId: string,
  accountId: string | null,
  automationId: string
): Promise<number | null> {
  // Map metric to the right snapshot source
  const xMetricColumns: Record<string, string> = {
    followers: '"followersCount"',
  };
  const trustmrrMetricColumns: Record<string, string> = {
    mrr: '"mrrCents"',
    revenue: '"revenueTotalCents"',
  };

  // Try analytics snapshots first (yesterday's value)
  if (accountId && xMetricColumns[metric]) {
    const col = xMetricColumns[metric];
    const result = await pool.query(
      `SELECT ${col} as value FROM x_analytics_snapshot
       WHERE "accountId" = $1 AND date = CURRENT_DATE - INTERVAL '1 day'
       ORDER BY "createdAt" DESC LIMIT 1`,
      [accountId]
    );
    if (result.rows.length > 0 && result.rows[0].value != null) {
      return currentValue - Number(result.rows[0].value);
    }
  }

  if (trustmrrMetricColumns[metric]) {
    const col = trustmrrMetricColumns[metric];
    const isCents = col.includes("Cents");
    const result = await pool.query(
      `SELECT ${col} as value FROM trustmrr_snapshot
       WHERE "userId" = $1 AND date = CURRENT_DATE - INTERVAL '1 day'
       ORDER BY "createdAt" DESC LIMIT 1`,
      [userId]
    );
    if (result.rows.length > 0 && result.rows[0].value != null) {
      const prevValue = isCents ? Math.floor(Number(result.rows[0].value) / 100) : Number(result.rows[0].value);
      return currentValue - prevValue;
    }
  }

  // Fallback: delta from last posted value
  const lastPost = await pool.query(
    `SELECT milestone FROM x_auto_post
     WHERE "automationId" = $1 AND status = 'posted'
     ORDER BY "postedAt" DESC LIMIT 1`,
    [automationId]
  );
  if (lastPost.rows.length > 0) {
    return currentValue - Number(lastPost.rows[0].milestone);
  }

  return null;
}

type ProgressVars = {
  currentDay?: number;
  totalDays?: number;
  daysLeft?: number;
  percent?: number;
  delta?: number;
};

function buildTweetText(
  metric: AutoPostMetric,
  trigger: AutoPostTrigger,
  tweetTemplate: string | null,
  milestone: number,
  value: number,
  goal?: number,
  dayNumber?: number,
  progressVars?: ProgressVars
): string {
  // Parse variants from stored JSON array (or legacy plain string)
  const variants = parseTweetVariants(tweetTemplate);
  const defaults = DEFAULT_TEMPLATES[trigger]?.[metric] || DEFAULT_TEMPLATES.milestone[metric];
  // Pick a random variant, or fall back to a random default
  const template = variants.length > 0
    ? pickRandom(variants, variants[0])
    : pickRandom(defaults, defaults[0]);

  const formattedMilestone = formatMilestoneNumber(milestone);
  const formattedValue = formatMilestoneNumber(value);
  const formattedGoal = goal ? formatMilestoneNumber(goal) : "";
  const pv = progressVars || {};

  return template
    .replace(/\{milestone\}/g, formattedMilestone)
    .replace(/\{metric\}/g, METRIC_DISPLAY_LABELS[metric] || metric)
    .replace(/\{value\}/g, formattedValue)
    .replace(/\{goal\}/g, formattedGoal)
    .replace(/\{period\}/g, dayNumber != null ? String(dayNumber) : "")
    .replace(/\{day\}/g, dayNumber != null ? String(dayNumber) : "")
    .replace(/\{week\}/g, dayNumber != null ? String(dayNumber) : "")
    .replace(/\{currentDay\}/g, pv.currentDay != null ? String(pv.currentDay) : "")
    .replace(/\{totalDays\}/g, pv.totalDays != null ? String(pv.totalDays) : "")
    .replace(/\{daysLeft\}/g, pv.daysLeft != null ? String(pv.daysLeft) : "")
    .replace(/\{percent\}/g, pv.percent != null ? String(Math.round(pv.percent)) : "")
    .replace(/\{delta\}/g, pv.delta != null ? formatMilestoneNumber(Math.abs(pv.delta)) : "");
}

// ─── Card image generation ──────────────────────────────────────────

function mapMetricType(metric: MilestoneMetric): string {
  if (metric === "customers") return "builders";
  return metric;
}

async function generateCardImage(
  metric: MilestoneMetric,
  value: number,
  handle: string,
  visual: AutomationVisualSettings,
  cardTemplate: AutoPostCardTemplate,
  goal?: number,
  extraMetrics?: { metric: string; value: number }[],
  dayNumber?: number,
  userId?: string,
  accountId?: string | null,
): Promise<Buffer | null> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";
  const metricType = mapMetricType(metric);

  // Merge with defaults, then randomize from arrays
  const vs = { ...DEFAULT_VISUAL_SETTINGS_SINGLE, ...visual };
  const bg = pickRandom(vs.backgrounds, vs.background || "noisy-lights");
  const font = pickRandom(vs.fonts, vs.font || "bricolage");
  const emoji = pickRandom(vs.emojis, { emoji: vs.milestoneEmoji || "🎉", unified: vs.milestoneEmojiUnified || "1f389", name: vs.milestoneEmojiName || "Party Popper" });

  // Build metrics array — primary + extras
  const metricsArr = [{ type: metricType, value }];
  if (extraMetrics) {
    for (const em of extraMetrics) {
      metricsArr.push({ type: mapMetricType(em.metric as MilestoneMetric), value: em.value });
    }
  }

  const baseSettings = {
    handle: handle ? `@${handle}` : "",
    aspectRatio: vs.aspectRatio || "post",
    background: { presetId: bg },
    textColor: vs.textColor,
    font,
    abbreviateNumbers: vs.abbreviateNumbers !== false,
    metricsLayout: vs.metricsLayout || "stack",
    ...(dayNumber != null ? { heading: { type: "day", day: dayNumber } } : {}),
    ...(vs.logoUrl ? { branding: { logoUrl: vs.logoUrl, position: vs.logoPosition || "center", logoSize: vs.logoSize ?? 30, enabled: true } } : {}),
  };

  let settings;

  if (cardTemplate === "progress") {
    settings = {
      ...baseSettings,
      template: "progress",
      metrics: metricsArr,
      goal: goal || value * 2,
      progressDisplay: vs.progressDisplay || "bar",
      progressBarColor: vs.progressBarColor,
      progressBarAuto: vs.progressBarAuto,
    };
  } else if (cardTemplate === "metrics") {
    // Inject previousValue for trending when enabled
    if (vs.showTrending && userId) {
      for (const m of metricsArr) {
        const delta = await getDelta(m.type, m.value, userId, accountId || null, "");
        if (delta !== null) {
          (m as Record<string, unknown>).previousValue = m.value - delta;
        }
      }
    }
    settings = {
      ...baseSettings,
      template: "metrics",
      metrics: metricsArr,
      showTrending: vs.showTrending,
    };
  } else {
    // Milestone template
    settings = {
      ...baseSettings,
      template: "milestone",
      metrics: metricsArr,
      milestoneEmoji: emoji.emoji,
      milestoneEmojiUnified: emoji.unified,
      milestoneEmojiName: emoji.name,
      milestoneEmojiCount: vs.milestoneEmojiCount,
    };
  }

  const settingsB64 = Buffer.from(JSON.stringify(settings)).toString("base64");

  try {
    const res = await fetch(`${siteUrl}/api/card?s=${settingsB64}`, {
      headers: { Referer: siteUrl },
    });

    if (!res.ok) {
      console.error("Card generation failed:", res.status, await res.text());
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Failed to generate card:", err);
    return null;
  }
}

// ─── X account helpers ──────────────────────────────────────────────

async function getXAccount(userId: string): Promise<{
  id: string;
  accountId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  scope: string;
} | null> {
  const result = await pool.query(
    `SELECT id, "accountId", username, "accessToken", "refreshToken", scope
     FROM account
     WHERE "userId" = $1 AND "providerId" = 'twitter' AND "accessToken" IS NOT NULL
     ORDER BY "updatedAt" DESC NULLS LAST
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function ensureValidToken(account: {
  id: string;
  accessToken: string;
  refreshToken: string;
}): Promise<string | null> {
  if (!account.refreshToken) return account.accessToken;

  const refreshResult = await refreshAccessToken(account.refreshToken);
  if ("error" in refreshResult) {
    console.error("Token refresh failed for account", account.id, refreshResult.error);
    // Mark token as invalid so the user gets a reconnect prompt
    await pool.query(
      `UPDATE account SET "refreshToken" = NULL, "updatedAt" = NOW() WHERE id = $1`,
      [account.id]
    );
    return null;
  }

  await pool.query(
    `UPDATE account SET
       "accessToken" = $1,
       "refreshToken" = COALESCE($2, "refreshToken"),
       "accessTokenExpiresAt" = $3,
       "updatedAt" = NOW()
     WHERE id = $4`,
    [
      refreshResult.access_token,
      refreshResult.refresh_token || null,
      refreshResult.expires_in
        ? new Date(Date.now() + refreshResult.expires_in * 1000)
        : null,
      account.id,
    ]
  );

  return refreshResult.access_token;
}

export function hasWriteScope(scope: string | null): boolean {
  if (!scope) return false;
  return scope.includes("tweet.write");
}

// ─── Plan check ─────────────────────────────────────────────────────

/** Check if user has an active Pro/Friend plan */
async function isProUser(userId: string): Promise<boolean> {
  const plan = await getUserPlanFromDB(userId);
  return plan === "pro" || plan === "friend";
}

// ─── Credits system ─────────────────────────────────────────────────

/** Get total credits used this calendar month */
export async function getCreditsUsedThisMonth(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COALESCE(SUM(credits), 0)::int AS total
     FROM automation_credit
     WHERE "userId" = $1
       AND "createdAt" >= date_trunc('month', CURRENT_DATE)`,
    [userId]
  );
  return result.rows[0].total;
}

/** Get remaining credits for this month */
export async function getRemainingCredits(userId: string): Promise<number> {
  const used = await getCreditsUsedThisMonth(userId);
  return Math.max(0, MONTHLY_CREDITS - used);
}

/** Check if user has enough credits for an action */
export async function hasEnoughCredits(userId: string, cost: number): Promise<boolean> {
  const remaining = await getRemainingCredits(userId);
  return remaining >= cost;
}

/** Deduct credits for an action */
export async function deductCredits(userId: string, type: "post" | "variant", credits: number, automationId?: string): Promise<void> {
  await pool.query(
    `INSERT INTO automation_credit ("userId", type, credits, "automationId")
     VALUES ($1, $2, $3, $4)`,
    [userId, type, credits, automationId || null]
  );
}

/** Cooldown for scheduled posts (daily/weekly) — prevent double-posting in the same time slot */
async function canScheduledPostNow(userId: string, automationId: string, requiredHours: number): Promise<boolean> {
  const result = await pool.query(
    `SELECT "postedAt" FROM x_auto_post
     WHERE "userId" = $1 AND "automationId" = $2 AND status = 'posted'
     ORDER BY "postedAt" DESC
     LIMIT 1`,
    [userId, automationId]
  );

  if (result.rows.length === 0) return true;

  const lastPosted = new Date(result.rows[0].postedAt);
  const hoursSince = (Date.now() - lastPosted.getTime()) / (1000 * 60 * 60);
  return hoursSince >= requiredHours;
}

/** Increment the user's export count (auto-post counts as an export) */
async function incrementExportCount(userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_stats ("userId", "exportsCount") VALUES ($1, 1)
     ON CONFLICT ("userId") DO UPDATE SET "exportsCount" = user_stats."exportsCount" + 1`,
    [userId]
  );
}

// ─── Post execution ──────────────────────────────────────────────────

async function executePost(
  userId: string,
  automationId: string,
  metric: string,
  trigger: AutoPostTrigger,
  value: number,
  tweetText: string,
  imageBuffer: Buffer | null,
  account: { id: string; accountId: string; accessToken: string; refreshToken: string },
  existingPublishingId?: string
): Promise<void> {
  let accessToken = account.accessToken;
  let tweetId: string | null = null;
  let error: string | null = null;

  // Reuse existing publishing row or create one
  let publishingId = existingPublishingId;
  if (!publishingId) {
    const publishingRow = await pool.query(
      `INSERT INTO x_auto_post ("userId", "accountId", metric, milestone, "tweetText", status, "automationId")
       VALUES ($1, $2, $3, $4, $5, 'publishing', $6) RETURNING id`,
      [userId, account.accountId, metric, value, tweetText, automationId]
    );
    publishingId = publishingRow.rows[0]?.id;
  }

  try {
    let mediaIds: string[] | undefined;
    if (imageBuffer) {
      const mediaResult = await uploadMedia(accessToken, imageBuffer, "image/png");

      if (typeof mediaResult === "object" && "error" in mediaResult && isTokenExpired(mediaResult as XApiError)) {
        const newToken = await ensureValidToken(account);
        if (!newToken) { error = "Failed to refresh token"; throw new Error(error); }
        accessToken = newToken;
        const retryMedia = await uploadMedia(accessToken, imageBuffer, "image/png");
        if (typeof retryMedia === "object" && "error" in retryMedia) {
          error = (retryMedia as XApiError).error; throw new Error(error);
        }
        mediaIds = [retryMedia as string];
      } else if (typeof mediaResult === "object" && "error" in mediaResult) {
        error = (mediaResult as XApiError).error; throw new Error(error);
      } else {
        mediaIds = [mediaResult as string];
      }
    }

    const tweetResult = await postTweet(accessToken, tweetText, mediaIds);

    if ("error" in tweetResult) {
      if (isTokenExpired(tweetResult)) {
        const newToken = await ensureValidToken(account);
        if (!newToken) { error = "Failed to refresh token"; throw new Error(error); }
        const retryTweet = await postTweet(newToken, tweetText, mediaIds);
        if ("error" in retryTweet) { error = retryTweet.error; throw new Error(error); }
        tweetId = retryTweet.tweetId;
      } else {
        error = tweetResult.error; throw new Error(error);
      }
    } else {
      tweetId = tweetResult.tweetId;
    }

    await pool.query(
      `UPDATE x_auto_post SET status = 'posted', "tweetId" = $2, "postedAt" = NOW() WHERE id = $1`,
      [publishingId, tweetId]
    );

    // Deduct credits
    await deductCredits(userId, "post", CREDIT_COST_POST, automationId);

    // Count as an export (fire & forget)
    incrementExportCount(userId).catch((e) => {
      console.error("Auto-post export count failed:", e);
    });

    console.log(`Auto-posted ${metric}=${value} for user ${userId}, automation ${automationId}, tweet ${tweetId}`);

    // Send email notification (fire & forget)
    if (tweetId) {
      sendAutoPostEmail(userId, metric, value, tweetId, trigger).catch((e) => {
        console.error("Auto-post email failed:", e);
      });
    }
  } catch (err) {
    const errorMsg = error || String(err);
    await pool.query(
      `UPDATE x_auto_post SET status = 'failed', error = $2 WHERE id = $1`,
      [publishingId, errorMsg]
    );
    console.error(`Auto-post failed for user ${userId}, automation ${automationId}:`, err);

    // Send failure email to admin (fire & forget)
    sendAutoPostFailureAdminEmail(userId, automationId, metric, value, errorMsg, trigger, tweetText).catch((e) => {
      console.error("Auto-post failure admin email failed:", e);
    });
  }
}

// ─── Email notification ──────────────────────────────────────────────

async function sendAutoPostEmail(
  userId: string,
  metric: string,
  value: number,
  tweetId: string,
  trigger: AutoPostTrigger
): Promise<void> {
  const userResult = await pool.query(
    `SELECT email, name, "emailAutomation" FROM "user" WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user?.email || user.emailAutomation === false) return;

  const isRevenue = metric === "mrr" || metric === "revenue";
  const formatted = isRevenue
    ? `$${formatMilestoneNumber(value)}`
    : formatMilestoneNumber(value);
  const tweetUrl = `https://x.com/i/web/status/${tweetId}`;
  const emailTrigger = trigger === "milestone" ? "milestone" : trigger === "weekly" ? "weekly" : "daily";

  const email = automationPostedEmail(user.name || "there", metric, formatted, tweetUrl, emailTrigger);
  await sendEmail({ to: user.email, ...email });
}

const ADMIN_EMAIL = "yannick.ferire@gmail.com";

async function sendAutoPostFailureAdminEmail(
  userId: string,
  automationId: string | null,
  metric: string,
  value: number,
  errorMessage: string,
  trigger: AutoPostTrigger,
  tweetText: string | null
): Promise<void> {
  const userResult = await pool.query(
    `SELECT email, name, "xUsername" FROM "user" WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];

  const isRevenue = metric === "mrr" || metric === "revenue";
  const formatted = isRevenue
    ? `$${formatMilestoneNumber(value)}`
    : formatMilestoneNumber(value);

  const details = [
    `<strong>User:</strong> ${user?.name || "?"} (${user?.email || "?"})`,
    `<strong>User ID:</strong> ${userId}`,
    `<strong>X handle:</strong> @${user?.xUsername || "?"}`,
    `<strong>Automation ID:</strong> ${automationId || "N/A"}`,
    `<strong>Trigger:</strong> ${trigger}`,
    `<strong>Metric:</strong> ${metric}`,
    `<strong>Value:</strong> ${formatted}`,
    `<strong>Tweet text:</strong> <pre style="white-space:pre-wrap;font-size:12px;background:#1a1a1a;padding:8px;border-radius:4px;margin:4px 0;">${tweetText || "N/A"}</pre>`,
    `<strong>Error:</strong> <pre style="white-space:pre-wrap;font-size:12px;background:#2d1111;color:#fca5a5;padding:8px;border-radius:4px;margin:4px 0;">${errorMessage}</pre>`,
    `<strong>Time:</strong> ${new Date().toISOString()}`,
  ].join("<br>");

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Groar] Auto-post FAILED — ${user?.name || userId} — ${metric} ${formatted}`,
    html: `<div style="font-family:monospace;font-size:13px;color:#e5e5e5;background:#111;padding:20px;border-radius:8px;">${details}</div>`,
  });
}

// ─── Fresh metric fetch ─────────────────────────────────────────────

/**
 * Fetch the current live value for a metric, directly from the source API.
 * Returns null if the fetch fails (we don't cancel the post on fetch errors).
 */
async function fetchFreshMetricValue(
  metric: AutoPostMetric,
  accessToken: string,
  xUsername: string
): Promise<number | null> {
  try {
    if (metric === "followers") {
      const user = await getAuthenticatedUser(accessToken);
      if ("error" in user) return null;
      return user.public_metrics.followers_count;
    }

    if (metric === "mrr" || metric === "revenue") {
      const result = await fetchStartupByXHandle(xUsername);
      if ("error" in result || "notFound" in result) return null;
      return metric === "mrr"
        ? Math.floor(result.startup.revenue.mrrCents / 100)
        : Math.floor(result.startup.revenue.totalCents / 100);
    }

    return null;
  } catch (err) {
    console.error(`Failed to fetch fresh ${metric} value:`, err);
    return null;
  }
}

/** Get the highest milestone already posted for a user+metric (never go below this) */
async function getHighestPostedMilestone(userId: string, metric: string): Promise<number> {
  const result = await pool.query(
    `SELECT MAX(milestone) as highest FROM x_auto_post
     WHERE "userId" = $1 AND metric = $2 AND status = 'posted'`,
    [userId, metric]
  );
  return result.rows[0]?.highest ?? 0;
}

// ─── Queue management ───────────────────────────────────────────────

// ─── Milestone auto-post (event-driven) ─────────────────────────────

/**
 * Auto-post milestones to X. Checks credits before posting.
 * If scheduleHour is set and doesn't match, queues the post for later.
 */
export async function autoPostMilestone(
  userId: string,
  metric: MilestoneMetric,
  milestone: number,
  value: number
): Promise<void> {
  // Check credits
  if (!(await hasEnoughCredits(userId, CREDIT_COST_POST))) {
    console.log(`No credits left for user ${userId}, skipping milestone ${metric}=${milestone}`);
    return;
  }

  // Find all enabled milestone automations that include this metric
  const result = await pool.query(
    `SELECT id, metric, trigger, "cardTemplate", goal, "tweetTemplate", "visualSettings", "startDay", "startDate", "scheduleHour", "scheduleDay"
     FROM automation
     WHERE "userId" = $1 AND trigger = 'milestone' AND enabled = true
       AND (metric = $2 OR (metric LIKE '[%' AND metric::jsonb ? $2))`,
    [userId, metric]
  );

  if (result.rows.length === 0) return;

  const auto: AutomationRow = result.rows[0];

  // Never announce a milestone lower than or equal to one already posted
  const highestPosted = await getHighestPostedMilestone(userId, metric);
  if (milestone <= highestPosted) {
    console.log(`Skipping milestone ${metric}=${milestone} for user ${userId}: already posted ${highestPosted}`);
    return;
  }

  // If scheduleHour is set, only post during that window — otherwise post immediately
  if (auto.scheduleHour != null) {
    const currentUtcHour = new Date().getUTCHours();
    if (auto.scheduleHour !== currentUtcHour) {
      // Queue for the scheduled hour
      await pool.query(
        `DELETE FROM x_auto_post WHERE "userId" = $1 AND status = 'queued'`,
        [userId]
      );
      await pool.query(
        `INSERT INTO x_auto_post ("userId", "accountId", metric, milestone, status, "automationId")
         VALUES ($1, '', $2, $3, 'queued', $4)`,
        [userId, metric, milestone, auto.id]
      );
      console.log(`Queued milestone ${metric}=${milestone} for user ${userId} (scheduled for ${auto.scheduleHour}h UTC)`);
      return;
    }
  }

  const account = await getXAccount(userId);
  if (!account || !hasWriteScope(account.scope)) return;

  const tweetText = buildTweetText(metric as AutoPostMetric, auto.trigger, auto.tweetTemplate, milestone, value, auto.goal || undefined);
  const imageBuffer = await generateCardImage(metric, milestone, account.username || "", auto.visualSettings, auto.cardTemplate, auto.goal || undefined, undefined, undefined, userId, account.accountId);

  await executePost(userId, auto.id, metric, auto.trigger, milestone, tweetText, imageBuffer, account);
}

// ─── Process queued milestone posts ──────────────────────────────────

/**
 * Process queued milestone posts whose scheduleHour now matches.
 * Called from the analytics cron alongside checkScheduledAutoPost.
 */
export async function processQueuedPosts(userId: string): Promise<void> {
  // Only Pro users can auto-post
  if (!(await isProUser(userId))) return;

  if (!(await hasEnoughCredits(userId, CREDIT_COST_POST))) {
    // Cancel all queued posts if no credits left (don't let them pile up forever)
    await pool.query(
      `UPDATE x_auto_post SET status = 'skipped_limit', error = 'No credits remaining'
       WHERE "userId" = $1 AND status = 'queued'`,
      [userId]
    );
    return;
  }

  const currentUtcHour = new Date().getUTCHours();

  const queued = await pool.query(
    `SELECT xp.id, xp."automationId", xp.metric, xp.milestone
     FROM x_auto_post xp
     JOIN automation a ON a.id = xp."automationId"
     WHERE xp."userId" = $1 AND xp.status = 'queued'
       AND (a."scheduleHour" IS NULL OR a."scheduleHour" = $2)
     ORDER BY xp."createdAt" DESC
     LIMIT 1`,
    [userId, currentUtcHour]
  );

  if (queued.rows.length === 0) return;

  const entry = queued.rows[0];

  const autoResult = await pool.query(
    `SELECT id, metric, trigger, "cardTemplate", goal, "tweetTemplate", "visualSettings", "startDay", "startDate", "scheduleHour", "scheduleDay"
     FROM automation WHERE id = $1 AND enabled = true`,
    [entry.automationId]
  );

  if (autoResult.rows.length === 0) {
    await pool.query(`DELETE FROM x_auto_post WHERE id = $1`, [entry.id]);
    return;
  }

  const auto: AutomationRow = autoResult.rows[0];
  const account = await getXAccount(userId);
  if (!account || !hasWriteScope(account.scope)) return;

  // Validate: fetch fresh metric value and check if milestone is still valid
  const freshToken = await ensureValidToken(account);
  const tokenForFetch = freshToken || account.accessToken;
  const currentValue = await fetchFreshMetricValue(entry.metric, tokenForFetch, account.username);

  let milestoneToPost = entry.milestone;

  if (currentValue !== null) {
    // Find the highest milestone the current value still passes
    // (may be lower than queued if value dropped, or higher if it climbed)
    // Find the highest milestone <= currentValue by walking up from 0
    const metricKey = entry.metric as Parameters<typeof getNextMilestoneAbove>[0];
    let highest = 0;
    let candidate = getNextMilestone(metricKey, 0);
    while (candidate && candidate <= currentValue) {
      highest = candidate;
      candidate = getNextMilestone(metricKey, candidate);
    }

    // Never go below the highest milestone already announced
    const highestPosted = await getHighestPostedMilestone(userId, entry.metric);

    if (highest === 0 || highest <= highestPosted) {
      // Value dropped below what we've already announced — cancel
      await pool.query(
        `UPDATE x_auto_post SET status = 'skipped_limit', error = $2 WHERE id = $1`,
        [entry.id, highest === 0
          ? `Metric at ${currentValue.toLocaleString()}, below first milestone`
          : `Milestone ${highest} already posted (highest posted: ${highestPosted})`]
      );
      console.log(`Cancelled queued post for user ${userId}: ${entry.metric}=${highest}, highest posted=${highestPosted}`);
      return;
    }

    if (highest !== entry.milestone) {
      console.log(`Adjusted queued post for user ${userId}: ${entry.metric} ${entry.milestone} → ${highest} (current: ${currentValue})`);
    }
    milestoneToPost = highest;
  }

  const tweetText = buildTweetText(entry.metric, auto.trigger, auto.tweetTemplate, milestoneToPost, milestoneToPost, auto.goal || undefined);

  // Switch queued → publishing so UI shows progress
  await pool.query(
    `UPDATE x_auto_post SET status = 'publishing', milestone = $2, "tweetText" = $3 WHERE id = $1`,
    [entry.id, milestoneToPost, tweetText]
  );

  const imageBuffer = await generateCardImage(entry.metric as MilestoneMetric, milestoneToPost, account.username || "", auto.visualSettings, auto.cardTemplate, auto.goal || undefined, undefined, undefined, userId, account.accountId);

  // Re-fetch account to get the latest token (ensureValidToken may have consumed the old refresh token)
  const freshAccount = await getXAccount(userId);
  if (!freshAccount || !hasWriteScope(freshAccount.scope)) return;

  await executePost(userId, auto.id, entry.metric, auto.trigger, milestoneToPost, tweetText, imageBuffer, freshAccount, entry.id);
  console.log(`Processed queued milestone for user ${userId}: ${entry.metric}=${milestoneToPost}`);
}

// ─── Scheduled auto-post (daily/weekly/monthly) ─────────────────────

/** Parse metric field: single string or JSON array */
function parseMetrics(raw: string): AutoPostMetric[] {
  if (raw.startsWith("[")) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch { /* fallback */ }
  }
  return [raw as AutoPostMetric];
}

/**
 * Check and execute scheduled auto-posts for a user+metric.
 * Queries all enabled automations for this metric with non-milestone triggers.
 * Supports multi-metric automations (metric stored as JSON array).
 */
export async function checkScheduledAutoPost(
  userId: string,
  metric: AutoPostMetric,
  currentValue: number
): Promise<{ skipped?: string; posted?: boolean; automations?: unknown[] }> {
  // Only Pro users can auto-post
  if (!(await isProUser(userId))) {
    return { skipped: "not_pro" };
  }

  // Check credits
  if (!(await hasEnoughCredits(userId, CREDIT_COST_POST))) {
    return { skipped: "no_credits" };
  }

  // Only run automations scheduled for the current UTC hour
  const currentUtcHour = new Date().getUTCHours();
  const currentUtcDay = (new Date().getUTCDay() + 6) % 7; // 0=Mon, 6=Sun (matching our scheduleDay)

  const result = await pool.query(
    `SELECT *
     FROM automation
     WHERE "userId" = $1 AND trigger != 'milestone' AND enabled = true
       AND "scheduleHour" = $3
       AND (metric = $2 OR (metric LIKE '[%' AND metric::jsonb ? $2))`,
    [userId, metric, currentUtcHour]
  );

  if (result.rows.length === 0) {
    // Debug: return what automations exist for this user
    const allAutos = await pool.query(
      `SELECT id, metric, trigger, enabled, "scheduleHour", "scheduleDay"
       FROM automation WHERE "userId" = $1 AND trigger != 'milestone'`,
      [userId]
    );
    return { skipped: `no_matching_automations (hour=${currentUtcHour}, metric=${metric})`, automations: allAutos.rows };
  }

  const account = await getXAccount(userId);
  if (!account || !hasWriteScope(account.scope)) {
    return { skipped: account ? "no_write_scope" : "no_x_account" };
  }

  for (const row of result.rows) {
    const auto: AutomationRow = row;

    // For weekly automations, check if today is the scheduled day
    if (auto.trigger === "weekly" && auto.scheduleDay != null && auto.scheduleDay !== currentUtcDay) {
      continue;
    }

    // Auto-disable progress automations that have passed their end date
    if (auto.endDate) {
      const end = new Date(auto.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      if (today > end) {
        await pool.query(
          `UPDATE automation SET enabled = false, "updatedAt" = NOW() WHERE id = $1`,
          [auto.id]
        );
        console.log(`Auto-disabled automation ${auto.id}: endDate ${auto.endDate} has passed`);
        continue;
      }
    }

    // No cooldown — credits already limit posting frequency

    const dayNumber = calculateDayNumber(auto.startDay, auto.startDate, auto.trigger);
    const allMetrics = parseMetrics(auto.metric);
    const primaryMetric = allMetrics[0];

    // Fetch fresh values for all metrics in this automation
    const freshToken = await ensureValidToken(account);
    const tokenForFetch = freshToken || account.accessToken;
    let primaryValue = primaryMetric === metric ? currentValue : (await fetchFreshMetricValue(primaryMetric, tokenForFetch, account.username)) ?? 0;

    const extraMetrics: { metric: string; value: number }[] = [];
    for (const m of allMetrics.slice(1)) {
      const val = m === metric ? currentValue : (await fetchFreshMetricValue(m, tokenForFetch, account.username));
      extraMetrics.push({ metric: m, value: val ?? 0 });
    }

    // Skip if all metric values are unchanged from the last successful post (except progress template — always post daily updates)
    if (auto.cardTemplate !== "progress") {
      const lastPost = await pool.query(
        `SELECT milestone FROM x_auto_post
         WHERE "automationId" = $1 AND status = 'posted'
         ORDER BY "postedAt" DESC LIMIT 1`,
        [auto.id]
      );
      if (lastPost.rows.length > 0 && lastPost.rows[0].milestone === primaryValue) {
        return { skipped: `value_unchanged (automation=${auto.id}, value=${primaryValue}, lastPosted=${lastPost.rows[0].milestone}, types=${typeof primaryValue}/${typeof lastPost.rows[0].milestone})` };
      }
    }

    // Compute progress variables for progress template
    let progressVars: ProgressVars | undefined;
    if (auto.cardTemplate === "progress") {
      const delta = await getDelta(primaryMetric, primaryValue, userId, account.accountId, auto.id);
      progressVars = computeProgressVars(auto.startDate, auto.endDate, primaryValue, auto.goal, delta);
    }

    const tweetText = buildTweetText(primaryMetric, auto.trigger, auto.tweetTemplate, primaryValue, primaryValue, auto.goal || undefined, dayNumber, progressVars);

    // Insert "publishing" row early so UI shows progress while image generates
    const pubRow = await pool.query(
      `INSERT INTO x_auto_post ("userId", "accountId", metric, milestone, "tweetText", status, "automationId")
       VALUES ($1, $2, $3, $4, $5, 'publishing', $6) RETURNING id`,
      [userId, account.accountId, primaryMetric, primaryValue, tweetText, auto.id]
    );
    const publishingId = pubRow.rows[0]?.id;

    const imageBuffer = await generateCardImage(primaryMetric as MilestoneMetric, primaryValue, account.username || "", auto.visualSettings, auto.cardTemplate, auto.goal || undefined, extraMetrics.length > 0 ? extraMetrics : undefined, dayNumber, userId, account.accountId);

    // Re-fetch account to get the latest token (ensureValidToken may have consumed the old refresh token)
    const freshAccount = await getXAccount(userId);
    if (!freshAccount || !hasWriteScope(freshAccount.scope)) break;

    await executePost(userId, auto.id, metric, auto.trigger, primaryValue, tweetText, imageBuffer, freshAccount, publishingId);
    return { posted: true };
  }
  return { skipped: "all_automations_filtered" };
}

// ─── Test trigger (bypasses schedule, still deducts credits) ─────────

export async function testAutoPost(userId: string, automationId: string): Promise<{ success: boolean; error?: string; tweetId?: string }> {
  const autoResult = await pool.query(
    `SELECT * FROM automation WHERE id = $1 AND "userId" = $2`,
    [automationId, userId]
  );

  if (autoResult.rows.length === 0) return { success: false, error: "Automation not found" };

  const auto: AutomationRow = autoResult.rows[0];
  const account = await getXAccount(userId);
  if (!account || !hasWriteScope(account.scope)) return { success: false, error: "X account not connected or missing write scope" };

  const allMetrics = parseMetrics(auto.metric);
  const primaryMetric = allMetrics[0];

  // Fetch fresh value (refresh token if needed)
  const freshToken = await ensureValidToken(account);
  const tokenForFetch = freshToken || account.accessToken;
  const currentValue = await fetchFreshMetricValue(primaryMetric, tokenForFetch, account.username) ?? 0;

  const extraMetrics: { metric: string; value: number }[] = [];
  for (const m of allMetrics.slice(1)) {
    const val = await fetchFreshMetricValue(m, tokenForFetch, account.username);
    extraMetrics.push({ metric: m, value: val ?? 0 });
  }

  let value = currentValue;
  if (auto.trigger === "milestone") {
    value = getNextMilestoneAbove(primaryMetric as Parameters<typeof getNextMilestoneAbove>[0], currentValue) ?? currentValue;
  }

  const dayNumber = auto.trigger !== "milestone" ? calculateDayNumber(auto.startDay, auto.startDate, auto.trigger) : undefined;

  let testProgressVars: ProgressVars | undefined;
  if (auto.cardTemplate === "progress") {
    const delta = await getDelta(primaryMetric, currentValue, userId, account.accountId, auto.id);
    testProgressVars = computeProgressVars(auto.startDate, auto.endDate, currentValue, auto.goal, delta);
  }

  const tweetText = buildTweetText(primaryMetric, auto.trigger, auto.tweetTemplate, value, currentValue, auto.goal || undefined, dayNumber, testProgressVars);
  const imageBuffer = await generateCardImage(
    primaryMetric as MilestoneMetric, value, account.username || "", auto.visualSettings, auto.cardTemplate,
    auto.goal || undefined, extraMetrics.length > 0 ? extraMetrics : undefined, dayNumber, userId, account.accountId
  );

  // Re-fetch account to get the latest refresh token (ensureValidToken may have consumed the old one)
  const freshAccount = await getXAccount(userId);
  if (!freshAccount) return { success: false, error: "X account not found after token refresh" };

  try {
    await executePost(userId, auto.id, primaryMetric, auto.trigger, value, tweetText, imageBuffer, freshAccount);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
