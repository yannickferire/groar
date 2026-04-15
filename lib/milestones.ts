import { pool } from "./db";
import { sendEmail, milestoneEmail } from "./email";
import { autoPostMilestone } from "./auto-post";

/**
 * Milestone threshold strategy — progressively wider gaps:
 *
 *   10, 25, 50, then 100–1000 every 100,
 *   1000–2000 every 100, 2000–5000 every 200,
 *   5000–10000 every 500, 10000–20000 every 1000,
 *   20000–50000 every 2000, 50000–100000 every 5000,
 *   then continues doubling the step with each range doubling.
 */
function generateThresholds(maxValue: number = 10_000_000): number[] {
  const thresholds: number[] = [10, 25, 50];

  // 100 to 1000, step 100
  for (let v = 100; v <= 1000; v += 100) thresholds.push(v);

  // Repeating pattern: range doubles, step doubles
  // [from, to, step]
  const ranges: [number, number, number][] = [
    [1000, 2000, 100],
    [2000, 5000, 200],
    [5000, 10_000, 500],
    [10_000, 20_000, 1000],
    [20_000, 50_000, 2000],
    [50_000, 100_000, 5000],
    [100_000, 200_000, 10_000],
    [200_000, 500_000, 20_000],
    [500_000, 1_000_000, 50_000],
    [1_000_000, 2_000_000, 100_000],
    [2_000_000, 5_000_000, 200_000],
    [5_000_000, 10_000_000, 500_000],
  ];

  for (const [from, to, step] of ranges) {
    for (let v = from + step; v <= to && v <= maxValue; v += step) {
      thresholds.push(v);
    }
  }

  return thresholds;
}

export const STAT_MILESTONES = generateThresholds();

// Export count milestones (smaller scale, specific)
const EXPORT_MILESTONES = [1, 10, 50, 100, 200, 500, 1_000];

// Revenue milestones in dollars (same pattern)
export const REVENUE_MILESTONES = generateThresholds(10_000_000);

/**
 * Get the next milestone threshold above the given value for a metric.
 */
export function getNextMilestone(
  metric: "followers" | "posts" | "mrr" | "revenue" | "customers",
  currentMilestone: number
): number | null {
  const thresholds = metric === "mrr" || metric === "revenue" ? REVENUE_MILESTONES : STAT_MILESTONES;
  const idx = thresholds.indexOf(currentMilestone);
  if (idx === -1 || idx >= thresholds.length - 1) return null;
  return thresholds[idx + 1];
}

/**
 * Get the first milestone threshold strictly above the given value.
 */
export function getNextMilestoneAbove(
  metric: "followers" | "posts" | "mrr" | "revenue" | "customers",
  currentValue: number
): number | null {
  const thresholds = metric === "mrr" || metric === "revenue" ? REVENUE_MILESTONES : STAT_MILESTONES;
  for (const t of thresholds) {
    if (t > currentValue) return t;
  }
  return null;
}

type MilestoneHit = {
  metric: "followers" | "posts" | "exports" | "mrr" | "revenue" | "customers";
  value: number;
  milestone: number;
};

function detectCrossedMilestones(
  metric: MilestoneHit["metric"],
  previousValue: number,
  currentValue: number
): MilestoneHit[] {
  const thresholds =
    metric === "exports" ? EXPORT_MILESTONES
    : metric === "mrr" || metric === "revenue" ? REVENUE_MILESTONES
    : STAT_MILESTONES;
  const hits: MilestoneHit[] = [];

  for (const threshold of thresholds) {
    if (previousValue < threshold && currentValue >= threshold) {
      hits.push({ metric, value: currentValue, milestone: threshold });
    }
  }

  return hits;
}

function formatMilestone(n: number): string {
  return n.toLocaleString("en-US");
}

const MILESTONE_EMOJIS = ["🎉", "⭐", "🚀", "🔥", "🏆"];

function randomEmoji(): string {
  return MILESTONE_EMOJIS[Math.floor(Math.random() * MILESTONE_EMOJIS.length)];
}

/**
 * Check for milestones after an analytics fetch and create notifications.
 */
export async function checkMilestones(
  userId: string,
  handle: string,
  previousFollowers: number,
  currentFollowers: number,
  previousPosts: number,
  currentPosts: number
): Promise<MilestoneHit[]> {
  const allHits = [
    ...detectCrossedMilestones("followers", previousFollowers, currentFollowers),
    ...detectCrossedMilestones("posts", previousPosts, currentPosts),
  ];

  if (allHits.length === 0) return [];

  await insertMilestoneNotifications(userId, handle, allHits);
  return allHits;
}

/**
 * Check for export count milestones. Called after each export.
 */
export async function checkExportMilestones(
  userId: string,
  previousCount: number,
  currentCount: number
): Promise<MilestoneHit[]> {
  const hits = detectCrossedMilestones("exports", previousCount, currentCount);
  if (hits.length === 0) return [];

  await insertMilestoneNotifications(userId, "", hits);
  return hits;
}

/**
 * Check for revenue milestones after a TrustMRR fetch.
 * MRR and revenue values are in dollars (converted from cents before calling).
 */
export async function checkRevenueMilestones(
  userId: string,
  previousMrrDollars: number,
  currentMrrDollars: number,
  previousRevenueDollars: number,
  currentRevenueDollars: number,
  previousCustomers: number,
  currentCustomers: number
): Promise<MilestoneHit[]> {
  const allHits = [
    ...detectCrossedMilestones("mrr", previousMrrDollars, currentMrrDollars),
    ...detectCrossedMilestones("revenue", previousRevenueDollars, currentRevenueDollars),
    ...detectCrossedMilestones("customers", previousCustomers, currentCustomers),
  ];

  if (allHits.length === 0) return [];

  await insertMilestoneNotifications(userId, "", allHits);
  return allHits;
}

async function insertMilestoneNotifications(
  userId: string,
  handle: string,
  hits: MilestoneHit[]
): Promise<void> {
  const userResult = await pool.query(
    `SELECT u.email, u.name, u."emailMilestones", u."xUsername", u."botMilestones", s.plan, s.status, s."externalCustomerId"
     FROM "user" u
     LEFT JOIN subscription s ON s."userId" = u.id
     WHERE u.id = $1`,
    [userId]
  );
  const user = userResult.rows[0];
  const isPro = user && (
    (user.plan === "pro" && user.status === "active") ||
    (user.plan === "pro" && user.status === "trialing") ||
    user.plan === "friend"
  );

  // When multiple milestones of the same metric are crossed in one call,
  // only create a notification for the highest one per metric
  const highestPerMetric = new Map<string, MilestoneHit>();
  for (const hit of hits) {
    const existing = highestPerMetric.get(hit.metric);
    if (!existing || hit.milestone > existing.milestone) {
      highestPerMetric.set(hit.metric, hit);
    }
  }

  for (const hit of highestPerMetric.values()) {
    const emoji = randomEmoji();
    const formatted = formatMilestone(hit.milestone);
    const isRevenue = hit.metric === "mrr" || hit.metric === "revenue";
    const metricLabel =
      hit.metric === "followers" ? "followers"
      : hit.metric === "posts" ? "posts"
      : hit.metric === "mrr" ? "MRR"
      : hit.metric === "revenue" ? "revenue"
      : hit.metric === "customers" ? "customers"
      : "exports";

    const title = isRevenue
      ? `${emoji} $${formatted} ${metricLabel}!`
      : `${emoji} ${formatted} ${metricLabel}!`;

    const body =
      hit.metric === "followers"
        ? `You just hit ${hit.value.toLocaleString()} followers. Time to share the milestone!`
        : hit.metric === "posts"
          ? `You just reached ${hit.value.toLocaleString()} posts. Keep the momentum going!`
          : hit.metric === "mrr"
            ? `Your MRR just crossed $${hit.milestone.toLocaleString()}. Time to celebrate!`
            : hit.metric === "revenue"
              ? `Your total revenue just passed $${hit.milestone.toLocaleString()}. Keep building!`
              : hit.metric === "customers"
                ? `You just reached ${hit.milestone.toLocaleString()} customers. Growing strong!`
                : hit.milestone === 1
                  ? `You just made your first export. Welcome to the jungle!`
                  : `You've created ${hit.value.toLocaleString()} visuals. You're on fire!`;

    // Avoid duplicates
    const existing = await pool.query(
      `SELECT id FROM notification
       WHERE "userId" = $1 AND type = 'milestone'
       AND metadata->>'metric' = $2
       AND (metadata->>'milestone')::int = $3`,
      [userId, hit.metric, hit.milestone]
    );

    if (existing.rows.length > 0) continue;

    await pool.query(
      `INSERT INTO notification ("userId", type, title, body, metadata)
       VALUES ($1, 'milestone', $2, $3, $4)`,
      [
        userId,
        title,
        body,
        JSON.stringify({
          metric: hit.metric,
          value: hit.value,
          milestone: hit.milestone,
          handle: handle || undefined,
        }),
      ]
    );

  }

  // Send a single email for the highest milestone per category (if user opted in)
  if (user?.email && user.emailMilestones !== false) {
    const emailableMetrics: MilestoneHit["metric"][] = ["followers", "mrr", "revenue"];
    for (const metric of emailableMetrics) {
      const metricHits = hits.filter((h) => h.metric === metric);
      if (metricHits.length > 0) {
        const highest = metricHits[metricHits.length - 1];
        const isRevenue = metric === "mrr" || metric === "revenue";
        const formattedValue = isRevenue
          ? `$${formatMilestone(highest.milestone)}`
          : formatMilestone(highest.milestone);
        try {
          const email = milestoneEmail(
            user.name || "there",
            formattedValue,
            highest.metric,
            isPro
          );
          await sendEmail({ to: user.email, ...email });
        } catch (e) {
          console.error("Failed to send milestone email:", e);
        }
      }
    }
  }

  // Auto-post to X for Pro users (fire & forget, errors are logged in x_auto_post table)
  if (isPro) {
    const autoPostMetrics: MilestoneHit["metric"][] = ["followers", "mrr", "revenue"];
    for (const hit of highestPerMetric.values()) {
      if (autoPostMetrics.includes(hit.metric)) {
        autoPostMilestone(userId, hit.metric, hit.milestone, hit.value).catch((e) => {
          console.error("Auto-post error:", e);
        });
      }
    }
  }

  // Bot milestone post for opted-in Pro users
  // Default opt-in: only false explicitly disables it
  const BOT_METRICS: MilestoneHit["metric"][] = ["followers", "mrr"];
  if (isPro && user.botMilestones !== false && user.xUsername) {
    for (const hit of highestPerMetric.values()) {
      if (BOT_METRICS.includes(hit.metric)) {
        import("./groar-bot").then(({ postMilestoneAsBot }) => {
          postMilestoneAsBot(userId, user.xUsername, hit.metric, hit.milestone).catch((e) => {
            console.error("[groar-bot] Error:", e);
          });
        });
      }
    }
  }
}
