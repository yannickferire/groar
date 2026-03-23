import { pool } from "./db";
import { sendEmail, milestoneEmail } from "./email";

/**
 * Milestone threshold strategy — repeating pattern per order of magnitude:
 *
 *   Within each decade (1×10^n to 10×10^n):
 *   - 1×, 1.5×, 2×, 2.5×, 3×, 4×, 5×, 6×, 7×, 7.5×, 9×
 *
 *   Concrete examples:
 *   10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 90,
 *   100, 150, 200, 250, 300, 400, 500, 600, 700, 750, 900,
 *   1K, 1.5K, 2K, 2.5K, 3K, 4K, 5K, 6K, 7K, 7.5K, 9K,
 *   10K, 15K, 20K, 25K, 30K, 40K, 50K, 60K, 70K, 75K, 90K, 100K, ...
 *
 *   This gives frequent celebrations at small numbers and
 *   progressively wider gaps at larger numbers.
 */
function generateThresholds(maxValue: number = 10_000_000): number[] {
  const multipliers = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 7.5, 9];
  const thresholds: number[] = [];

  for (let power = 1; power <= Math.log10(maxValue); power++) {
    const base = 10 ** power;
    for (const m of multipliers) {
      const value = Math.round(base * m);
      if (value <= maxValue) thresholds.push(value);
    }
  }

  return [...new Set(thresholds)].sort((a, b) => a - b);
}

const STAT_MILESTONES = generateThresholds();

// Export count milestones (smaller scale, specific)
const EXPORT_MILESTONES = [1, 10, 50, 100, 200, 500, 1_000];

// Revenue milestones in dollars (same pattern)
const REVENUE_MILESTONES = generateThresholds(10_000_000);

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
    `SELECT email, name, "emailMilestones" FROM "user" WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];

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
            highest.metric
          );
          await sendEmail({ to: user.email, ...email });
        } catch (e) {
          console.error("Failed to send milestone email:", e);
        }
      }
    }
  }
}
