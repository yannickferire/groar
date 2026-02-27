import { pool } from "./db";
import { sendEmail, milestoneEmail } from "./email";

// Generate follower/following/post thresholds dynamically
function generateThresholds(): number[] {
  const thresholds: number[] = [];
  // Every 100 up to 2,000
  for (let i = 100; i <= 2_000; i += 100) thresholds.push(i);
  // Every 200 up to 5,000
  for (let i = 2_200; i <= 5_000; i += 200) thresholds.push(i);
  // Every 500 up to 10,000
  for (let i = 5_500; i <= 10_000; i += 500) thresholds.push(i);
  // Every 1,000 up to 20,000
  for (let i = 11_000; i <= 20_000; i += 1_000) thresholds.push(i);
  // Every 2,000 up to 50,000
  for (let i = 22_000; i <= 50_000; i += 2_000) thresholds.push(i);
  // Every 5,000 up to 100,000
  for (let i = 55_000; i <= 100_000; i += 5_000) thresholds.push(i);
  // Every 10,000 up to 1,000,000
  for (let i = 110_000; i <= 1_000_000; i += 10_000) thresholds.push(i);
  return thresholds;
}

const STAT_MILESTONES = generateThresholds();

// Export count milestones
const EXPORT_MILESTONES = [1, 10, 50, 100, 200, 500, 1_000];

type MilestoneHit = {
  metric: "followers" | "posts" | "exports";
  value: number;
  milestone: number;
};

function detectCrossedMilestones(
  metric: MilestoneHit["metric"],
  previousValue: number,
  currentValue: number
): MilestoneHit[] {
  const thresholds = metric === "exports" ? EXPORT_MILESTONES : STAT_MILESTONES;
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

  for (const hit of hits) {
    const emoji = randomEmoji();
    const formatted = formatMilestone(hit.milestone);
    const metricLabel =
      hit.metric === "followers" ? "followers"
      : hit.metric === "posts" ? "posts"
      : "exports";

    const title = `${emoji} ${formatted} ${metricLabel}!`;
    const body =
      hit.metric === "followers"
        ? `You just hit ${hit.value.toLocaleString()} followers. Time to share the milestone!`
        : hit.metric === "posts"
          ? `You just reached ${hit.value.toLocaleString()} posts. Keep the momentum going!`
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

    // Send email for follower milestones only (if user opted in)
    if (hit.metric === "followers" && user?.email && user.emailMilestones !== false) {
      try {
        const email = milestoneEmail(
          user.name || "there",
          formatted,
          hit.metric
        );
        await sendEmail({ to: user.email, ...email });
      } catch (e) {
        console.error("Failed to send milestone email:", e);
      }
    }
  }
}
