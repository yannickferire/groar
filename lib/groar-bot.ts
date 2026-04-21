import crypto from "crypto";
import { pool } from "@/lib/db";
import { BACKGROUNDS } from "@/lib/backgrounds";

const FONTS = ["bricolage", "inter", "space-grotesk"];
// Only include emojis that exist in /api/card EMOJI_IMAGES (app/api/card/route.tsx)
const EMOJIS = ["🎉", "🚀", "🔥", "✨", "🎯", "🎈"];
const ENCOURAGEMENTS = [
  "Keep building!",
  "Big things ahead.",
  "On to the next one!",
  "Momentum is real.",
  "Onwards and upwards.",
  "The grind pays off.",
  "Built different.",
  "Just the beginning.",
  "Let's keep going!",
  "Crushing it.",
  "Stack those wins.",
  "More to come.",
];
const COLORS: Record<string, string> = {
  "noisy-lights": "#f0e6ff",
  "northern-lights": "#d4ffd6",
  "tokyo-streets": "#ffd6e8",
  "bled-lakes": "#d6ecff",
  "orangeblue": "#ffe0c2",
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── OAuth 1.0a signature for bot account ──────────────────────────

const BOT_API_KEY = process.env.GROAR_BOT_API_KEY!;
const BOT_API_SECRET = process.env.GROAR_BOT_API_SECRET!;
const BOT_ACCESS_TOKEN = process.env.GROAR_BOT_ACCESS_TOKEN!;
const BOT_ACCESS_SECRET = process.env.GROAR_BOT_ACCESS_SECRET!;

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

function buildOAuthHeader(method: string, url: string): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: BOT_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: BOT_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, BOT_API_SECRET, BOT_ACCESS_SECRET);
  oauthParams.oauth_signature = signature;

  const headerString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${headerString}`;
}

// ─── Post tweet as bot ─────────────────────────────────────────────

async function postTweetAsBot(text: string, mediaId?: string): Promise<{ tweetId: string } | { error: string }> {
  const url = "https://api.x.com/2/tweets";

  const body: Record<string, unknown> = { text };
  if (mediaId) {
    body.media = { media_ids: [mediaId] };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: buildOAuthHeader("POST", url),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[groar-bot] Post failed:", response.status, errorText);
      return { error: `Post failed: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    return { tweetId: data.data?.id };
  } catch (error) {
    console.error("[groar-bot] Post error:", error);
    return { error: String(error) };
  }
}

// ─── Milestone slug helpers ────────────────────────────────────────

function formatMilestoneSlug(value: number, metric: string): string {
  let short: string;
  if (value >= 1_000_000) short = `${value / 1_000_000}m`;
  else if (value >= 1_000) short = `${value / 1_000}k`;
  else short = String(value);
  return `${short}-${metric}`;
}

function formatMilestoneDisplay(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${(value / 1_000).toLocaleString("en-US")}K`;
  return value.toLocaleString("en-US");
}

function formatMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    followers: "followers",
    mrr: "MRR",
    revenue: "revenue",
    customers: "customers",
    posts: "posts",
  };
  return labels[metric] || metric;
}

function isCurrencyMetric(metric: string): boolean {
  return metric === "mrr" || metric === "revenue";
}

// ─── Main: post milestone as bot ───────────────────────────────────

export async function postMilestoneAsBot(
  userId: string,
  handle: string, // X username without @
  metric: string,
  value: number
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const slug = formatMilestoneSlug(value, metric);
  const display = formatMilestoneDisplay(value);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";
  const milestoneUrl = `${siteUrl}/m/${handle}/${slug}`;

  // Check if already posted
  const existing = await pool.query(
    `SELECT id FROM milestone_post WHERE "userId" = $1 AND slug = $2`,
    [userId, slug]
  );
  if (existing.rows.length > 0) {
    return { success: false, error: "Already posted" };
  }

  // Randomize visual style (stored so it's stable across page loads)
  const allBgs = BACKGROUNDS.map((b) => b.id);
  const bg = pickRandom(allBgs);
  const font = pickRandom(FONTS);
  const emoji = pickRandom(EMOJIS);
  const encouragement = pickRandom(ENCOURAGEMENTS);

  // Build tweet text — currency metrics get a $ prefix, label is human-readable
  const formattedValue = isCurrencyMetric(metric) ? `$${display}` : display;
  const label = formatMetricLabel(metric);
  const text = `${emoji} @${handle} just hit ${formattedValue} ${label}!\n\n${encouragement}\n\n${milestoneUrl}`;

  // Post
  const result = await postTweetAsBot(text);

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  // Save to DB with visual style
  await pool.query(
    `INSERT INTO milestone_post ("userId", handle, metric, value, slug, bg, font, emoji, "tweetId")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [userId, handle, metric, value, slug, bg, font, emoji, result.tweetId]
  );

  console.log(`[groar-bot] Posted milestone: @${handle} ${display} ${metric} (tweet: ${result.tweetId})`);
  return { success: true, tweetId: result.tweetId };
}
