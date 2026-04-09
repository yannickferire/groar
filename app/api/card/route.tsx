import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { METRIC_LABELS, MetricType } from "@/components/editor/types";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";
import { AspectRatioType } from "@/components/editor/types";
import { pool } from "@/lib/db";
import sharp from "sharp";
import { METRIC_ICONS } from "@/lib/metric-icons";
import { API_TIERS, getApiGraceLimit } from "@/lib/plans";
import type { ApiTier } from "@/lib/plans";
import { getUserApiTierFromDB, checkAndUpdateQuotaThreshold } from "@/lib/plans-server";
import { sendEmail, apiQuota80Email, apiQuota100Email, apiQuota120Email } from "@/lib/email";

// ─── Font loading ───────────────────────────────────────────────────────────

const GOOGLE_FONT_URLS: Record<string, string> = {
  bricolage: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&display=swap",
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
  "space-grotesk": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
  "dm-mono": "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap",
  "averia-serif-libre": "https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:wght@400;700&display=swap",
  "dm-serif-display": "https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400&display=swap",
};

const GOOGLE_FONT_FAMILIES: Record<string, string> = {
  bricolage: "Bricolage Grotesque",
  inter: "Inter",
  "space-grotesk": "Space Grotesk",
  "dm-mono": "DM Mono",
  "averia-serif-libre": "Averia Serif Libre",
  "dm-serif-display": "DM Serif Display",
};

const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(fontId: string, weight: number = 400): Promise<ArrayBuffer> {
  const cacheKey = `${fontId}-${weight}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const cssUrl = GOOGLE_FONT_URLS[fontId];
  if (!cssUrl) throw new Error(`Unknown font: ${fontId}`);

  const cssRes = await fetch(cssUrl);
  const css = await cssRes.text();

  // Split CSS into @font-face blocks and find the one matching the requested weight
  const blocks = css.split(/(?=@font-face)/);
  let fontUrl: string | null = null;

  for (const block of blocks) {
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const blockWeight = weightMatch ? parseInt(weightMatch[1]) : 400;
    if (blockWeight !== weight) continue;
    const ttfMatch = block.match(/src:\s*url\(([^)]+\.ttf)\)/);
    const woffMatch = block.match(/src:\s*url\(([^)]+\.woff)\)/);
    const woff2Match = block.match(/src:\s*url\(([^)]+\.woff2)\)/);
    fontUrl = ttfMatch?.[1] || woffMatch?.[1] || woff2Match?.[1] || null;
    if (fontUrl) break;
  }

  // Fallback: take first font URL if specific weight not found
  if (!fontUrl) {
    const ttfMatch = css.match(/src:\s*url\(([^)]+\.ttf)\)/);
    const woffMatch = css.match(/src:\s*url\(([^)]+\.woff)\)/);
    const woff2Match = css.match(/src:\s*url\(([^)]+\.woff2)\)/);
    fontUrl = ttfMatch?.[1] || woffMatch?.[1] || woff2Match?.[1] || null;
  }

  if (!fontUrl) throw new Error(`No font file found for ${fontId}`);

  const fontRes = await fetch(fontUrl);
  const buffer = await fontRes.arrayBuffer();
  fontCache.set(cacheKey, buffer);
  return buffer;
}

// ─── Background conversion (webp → png for Satori) ─────────────────────────

const bgCache = new Map<string, string>();

async function convertBgToPngDataUrl(imagePath: string, origin: string): Promise<string> {
  const cached = bgCache.get(imagePath);
  if (cached) return cached;

  try {
    const res = await fetch(`${origin}${imagePath}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const pngBuffer = await sharp(buffer).png({ compressionLevel: 1 }).toBuffer();
    const dataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    bgCache.set(imagePath, dataUrl);
    return dataUrl;
  } catch {
    return `${origin}${imagePath}`;
  }
}

// ─── Logo conversion to data URL for Satori ─────────────────────────────────

const logoCache = new Map<string, string>();

async function convertLogoToDataUrl(logoUrl: string): Promise<string | null> {
  const cached = logoCache.get(logoUrl);
  if (cached) return cached;

  try {
    console.log("[card] Fetching logo:", logoUrl);
    const res = await fetch(logoUrl);
    if (!res.ok) {
      console.log("[card] Logo fetch failed:", res.status, res.statusText);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    console.log("[card] Logo fetched, size:", buffer.length, "bytes");
    const contentType = res.headers.get("content-type") || "image/png";
    // Convert to PNG for Satori compatibility (handles SVG, WebP, etc.)
    const pngBuffer = contentType.includes("svg")
      ? await sharp(buffer).png().toBuffer()
      : await sharp(buffer).png({ compressionLevel: 1 }).toBuffer();
    const dataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    logoCache.set(logoUrl, dataUrl);
    console.log("[card] Logo converted to data URL, length:", dataUrl.length);
    return dataUrl;
  } catch (err) {
    console.error("[card] Logo conversion error:", err);
    return null;
  }
}

// ─── Metric formatting ──────────────────────────────────────────────────────

function formatNumber(value: number, abbreviate: boolean): string {
  if (!abbreviate) return value.toLocaleString("en-US");
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return value.toLocaleString("en-US");
}

function fmtMetric(type: string, value: number, abbreviate: boolean, prefix?: string): string {
  if (type === "engagementRate" || type === "churnRate" || type === "redditUpvoteRatio") {
    return `${value}%`;
  }
  if (type === "mrr" || type === "arr" || type === "valuation" || type === "revenue" || type === "ltv") {
    const f = formatNumber(value, abbreviate);
    return prefix ? `${prefix}$${f}` : `$${f}`;
  }
  const f = formatNumber(value, abbreviate);
  return prefix ? `${prefix}${f}` : f;
}

// ─── Auth & rate limiting ───────────────────────────────────────────────────

const keyCache = new Map<string, { valid: boolean; userId: string | null; ts: number }>();
const KEY_CACHE_TTL = 5 * 60 * 1000;

async function validateAndTrackKey(key: string | null, skipTracking = false): Promise<{ valid: boolean; userId: string | null }> {
  if (!key || !key.startsWith("groar_")) return { valid: false, userId: null };
  const cached = keyCache.get(key);
  if (cached && Date.now() - cached.ts < KEY_CACHE_TTL) {
    if (!skipTracking && cached.valid && cached.userId) {
      pool.query(
        `INSERT INTO api_usage_daily ("userId", date, count) VALUES ($1, CURRENT_DATE, 1)
         ON CONFLICT ("userId", date) DO UPDATE SET count = api_usage_daily.count + 1`,
        [cached.userId]
      ).catch((err) => console.error("Failed to track daily usage:", err));
    }
    return { valid: cached.valid, userId: cached.userId };
  }
  try {
    const result = await pool.query(
      `UPDATE api_key SET "lastUsedAt" = NOW(), "requestCount" = "requestCount" + 1 WHERE key = $1 AND enabled = true RETURNING id, "userId"`,
      [key]
    );
    const valid = result.rows.length > 0;
    const userId = valid ? result.rows[0].userId : null;
    keyCache.set(key, { valid, userId, ts: Date.now() });
    // Track daily usage (fire-and-forget) — skip for internal requests
    if (!skipTracking && valid && userId) {
      pool.query(
        `INSERT INTO api_usage_daily ("userId", date, count) VALUES ($1, CURRENT_DATE, 1)
         ON CONFLICT ("userId", date) DO UPDATE SET count = api_usage_daily.count + 1`,
        [userId]
      ).catch((err) => console.error("Failed to track daily usage:", err));
    }
    return { valid, userId };
  } catch {
    return { valid: false, userId: null };
  }
}

const RATE_WINDOW = 60 * 1000;
const rateWindows = new Map<string, number[]>();

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const recent = (rateWindows.get(key) || []).filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= limit) return false;
  recent.push(now);
  rateWindows.set(key, recent);
  return true;
}

// ─── Monthly usage enforcement ──────────────────────────────────────────────

/** Get user's API tier from DB */
async function getUserApiTier(userId: string): Promise<ApiTier> {
  return getUserApiTierFromDB(userId);
}

/** Check if user has exceeded their grace limit (limit + 20%) */
async function checkMonthlyUsage(userId: string): Promise<{ allowed: boolean; used: number; limit: number; graceLimit: number; tier: ApiTier }> {
  const tier = await getUserApiTier(userId);
  const limit = API_TIERS[tier].limit;
  const graceLimit = getApiGraceLimit(tier);

  const result = await pool.query(
    `SELECT COALESCE(SUM(count), 0)::int AS total
     FROM api_usage_daily
     WHERE "userId" = $1
       AND date >= date_trunc('month', CURRENT_DATE)`,
    [userId]
  );
  const used = result.rows[0].total;

  return { allowed: used < graceLimit, used, limit, graceLimit, tier };
}

// ─── Icon rendering (Hugeicons → inline SVG for Satori) ─────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTrendArrow(size: number, isUp: boolean, color: string): any {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {isUp ? (
        <path d="M17 7L6 18M17 7H8M17 7V16" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M7 17L18 6M7 17H16M7 17V8" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function renderIcon(metricType: string, size: number, color: string): any {
  const iconData = METRIC_ICONS[metricType as MetricType];
  if (!iconData || metricType === "custom") return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      {iconData.map((entry: readonly [string, Record<string, string | number>], idx: number) => {
        const [tag, attrs] = entry;
        const props: Record<string, string | number> = {};
        for (const [k, v] of Object.entries(attrs)) {
          if (k === "key") continue;
          // Convert stroke="currentColor" to actual color
          const val = v === "currentColor" ? color : v;
          // Satori needs camelCase for SVG attributes
          if (k === "stroke-linecap") props.strokeLinecap = val;
          else if (k === "stroke-linejoin") props.strokeLinejoin = val;
          else if (k === "stroke-width") props.strokeWidth = val;
          else if (k === "strokeLinecap") props.strokeLinecap = val;
          else if (k === "strokeLinejoin") props.strokeLinejoin = val;
          else if (k === "strokeWidth") props.strokeWidth = 2;
          else if (k === "stroke") props.stroke = val;
          else props[k] = val;
        }
        // Force strokeWidth to 2 like HugeiconsIcon does
        props.strokeWidth = 2;
        if (tag === "path") return <path {...props} key={props.d as string} />;
        if (tag === "circle") return <circle {...props} key={`c-${props.cx}-${props.cy}`} />;
        if (tag === "rect") return <rect {...props} key={`r-${props.x}-${props.y}`} />;
        if (tag === "line") return <line {...props} key={`l-${props.x1}-${props.y1}`} />;
        if (tag === "ellipse") return <ellipse {...props} key={`e-${props.cx}-${props.cy}`} />;
        if (tag === "polyline") return <polyline {...props} key={`pl-${idx}`} />;
        if (tag === "polygon") return <polygon {...props} key={`pg-${idx}`} />;
        return null;
      })}
    </svg>
  );
}

// ─── Heading rendering ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HeadingSettings = any;

function getDateLabel(periodType: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const monthName = now.toLocaleString("en", { month: "long" });
  if (periodType === "year") return `${year}`;
  return `${monthName} ${year}`;
}

function renderHeading(h: HeadingSettings, unit: number, isBanner: boolean, isSquare: boolean, isAnnouncement: boolean, logoDataUrl?: string | null, logoSize?: number): React.ReactNode {
  if (!h) return null;
  const sq = (base: number) => isSquare ? base * 1.15 : base;
  const baseFontSize = isAnnouncement
    ? (isBanner ? unit * 6 : unit * 8)
    : (isBanner ? unit * 6 : unit * sq(8));

  const textSize = (len: number) => {
    if (len > 30) return isAnnouncement ? (isBanner ? unit * 3.5 : unit * 4.5) : (isBanner ? unit * 3.5 : unit * sq(4.5));
    if (len > 20) return isAnnouncement ? (isBanner ? unit * 4.5 : unit * 6) : (isBanner ? unit * 4.5 : unit * sq(6));
    return baseFontSize;
  };

  if (h.type === "period" && h.periodType) {
    const from = h.periodFrom ?? 1;
    const to = h.periodTo;
    const label = `${h.periodType.charAt(0).toUpperCase() + h.periodType.slice(1)} ${to !== undefined ? `${from} - ${to}` : from}`;
    return (
      <div style={{ fontWeight: 700, fontSize: baseFontSize, letterSpacing: "-0.02em", display: "flex" }}>
        {label}
      </div>
    );
  }
  if (h.type === "last" && h.lastUnit) {
    const count = h.lastCount ?? 7;
    const unitName = h.lastUnit;
    const label = `Last ${count} ${unitName.charAt(0).toUpperCase() + unitName.slice(1)}${count !== 1 ? "s" : ""}`;
    return (
      <div style={{ fontWeight: 700, fontSize: baseFontSize, letterSpacing: "-0.02em", display: "flex" }}>
        {label}
      </div>
    );
  }
  if (h.type === "date-range" && h.dateFrom && h.dateTo) {
    const fmt = (iso: string) => {
      const d = new Date(iso + "T00:00:00");
      const fullMonth = d.toLocaleDateString("en-US", { month: "long" });
      const month = fullMonth.length > 5 ? d.toLocaleDateString("en-US", { month: "short" }) : fullMonth;
      return `${month} ${d.getDate()}`;
    };
    const fromDate = new Date(h.dateFrom + "T00:00:00");
    const toDate = new Date(h.dateTo + "T00:00:00");
    const sameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
    const label = h.dateFrom === h.dateTo
      ? fmt(h.dateFrom)
      : sameMonth
        ? `${fmt(h.dateFrom)} – ${toDate.getDate()}`
        : `${fmt(h.dateFrom)} – ${fmt(h.dateTo)}`;
    return (
      <div style={{ fontWeight: 700, fontSize: textSize(label.length), letterSpacing: "-0.02em", display: "flex" }}>
        {label}
      </div>
    );
  }
  if (h.type === "today") {
    return <div style={{ fontWeight: 700, fontSize: baseFontSize, letterSpacing: "-0.02em", display: "flex" }}>Today</div>;
  }
  if (h.type === "yesterday") {
    return <div style={{ fontWeight: 700, fontSize: baseFontSize, letterSpacing: "-0.02em", display: "flex" }}>Yesterday</div>;
  }
  if (h.type === "quote" && h.text) {
    const size = isAnnouncement ? (isBanner ? unit * 5 : unit * 6.5) : (isBanner ? unit * 5 : unit * sq(6.5));
    return (
      <div style={{ fontWeight: 700, fontStyle: "italic", fontSize: size, letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.1, padding: "0 2%", display: "flex" }}>
        &ldquo;{h.text}&rdquo;
      </div>
    );
  }
  if (h.type === "day" && h.day != null) {
    return (
      <div style={{ fontWeight: 700, fontSize: baseFontSize, letterSpacing: "-0.02em", display: "flex" }}>
        Day {h.day}
      </div>
    );
  }
  if (h.type === "custom" && h.text) {
    const size = isAnnouncement ? (isBanner ? unit * 5 : unit * 6.5) : (isBanner ? unit * 5 : unit * sq(6.5));
    return (
      <div style={{ fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.1, padding: "0 2%", display: "flex" }}>
        {h.text}
      </div>
    );
  }
  if (h.type === "logo" && logoDataUrl) {
    const height = ((logoSize ?? 30) / 6) * 1.8 * unit;
    const maxHeight = isBanner ? unit * 8 : unit * 12;
    return (
      <div style={{ display: "flex", marginBottom: isBanner ? unit * 1 : unit * 1.5 }}>
        <img src={logoDataUrl} alt="" style={{ height: Math.min(height, maxHeight), objectFit: "contain" }} />
      </div>
    );
  }
  return null;
}

// ─── Date label (top-right) ─────────────────────────────────────────────────

function getHeaderDateLabel(settings: { heading?: HeadingSettings; template?: string; period?: unknown }): string | null {
  if (settings.template === "milestone" || settings.template === "progress") {
    return settings.period ? `${new Date().getFullYear()}` : null;
  }
  const h = settings.heading;
  if (!h) return null;
  if (h.type === "period" && h.periodType) return getDateLabel(h.periodType);
  if (h.type === "last" && h.lastUnit) return getDateLabel(h.lastUnit === "hour" ? "day" : h.lastUnit);
  if (h.type === "today" || h.type === "yesterday") return getDateLabel("day");
  return null;
}

// ─── Progress helpers ───────────────────────────────────────────────────────

function getNextGoal(value: number): number {
  if (value < 100) return 100;
  if (value < 500) return 500;
  if (value < 1000) return 1000;
  if (value < 5000) return 5000;
  if (value < 10000) return 10000;
  if (value < 50000) return 50000;
  if (value < 100000) return 100000;
  return Math.ceil(value / 100000) * 100000 + 100000;
}

function getProgressColor(percent: number): string {
  const p = Math.max(0, Math.min(100, percent));
  const red = { r: 239, g: 68, b: 68 };
  const yellow = { r: 234, g: 179, b: 8 };
  const green = { r: 34, g: 197, b: 94 };
  let r, g, b;
  if (p <= 50) {
    const t = p / 50;
    r = Math.round(red.r + (yellow.r - red.r) * t);
    g = Math.round(red.g + (yellow.g - red.g) * t);
    b = Math.round(red.b + (yellow.b - red.b) * t);
  } else {
    const t = (p - 50) / 50;
    r = Math.round(yellow.r + (green.r - yellow.r) * t);
    g = Math.round(yellow.g + (green.g - yellow.g) * t);
    b = Math.round(yellow.b + (green.b - yellow.b) * t);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Milestone helpers ──────────────────────────────────────────────────────

function getStepSize(value: number): number {
  if (value < 20) return 1;
  if (value < 50) return 5;
  if (value < 100) return 10;
  if (value < 300) return 25;
  if (value < 3000) return 50;
  if (value < 10000) return 100;
  if (value < 50000) return 500;
  if (value < 100000) return 1000;
  if (value < 1000000) return 5000;
  return 10000;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type EmojiPos = { fontSize: number; left?: string; right?: string; top?: string; bottom?: string; rotation: number; blur: number; opacity: number; zIndex: number };

function generateEmojiPos(index: number, isBanner: boolean): EmojiPos {
  const r = (offset: number) => seededRandom(index * 13 + offset * 37 + 7);
  const sizePost = 2.5 + r(0) * 11.5;
  const size = isBanner ? sizePost * 0.65 : sizePost;
  const sizeRatio = (sizePost - 2.5) / 11.5;
  const blur = Math.round((1 - sizeRatio) * 6);
  const opacity = +(0.2 + sizeRatio * 0.5).toFixed(2);
  const horizontal = Math.round(2 + r(1) * 88);
  const vertical = Math.round(2 + r(2) * 88);
  const rotation = Math.round(-70 + r(3) * 140);
  const zIndex = blur === 0 ? 50 : blur <= 1 ? 30 : blur <= 2 ? 20 : blur <= 3 ? 10 : 0;
  return { fontSize: size, left: `${horizontal}%`, top: `${vertical}%`, rotation, blur, opacity, zIndex };
}

const EMOJI_IMAGES: Record<string, string> = {
  "🎉": "/emoji/party.png",
  "🔥": "/emoji/fire.png",
  "🚀": "/emoji/rocket.png",
  "✨": "/emoji/sparkles.png",
  "🎯": "/emoji/bullseye.png",
  "🐯": "/emoji/tiger.png",
  "❤️": "/emoji/heart.png",
  "🎈": "/emoji/balloon.png",
};

function getEmojiPositions(emoji: string, isBanner: boolean, count: number): EmojiPos[] {
  const handCrafted: EmojiPos[] = [
    { fontSize: isBanner ? 10 : 14, left: "15%", top: "35%", rotation: emoji === "🎉" || emoji === "🚀" ? -90 : -15, blur: 0, opacity: 0.9, zIndex: 50 },
    { fontSize: isBanner ? 6.5 : 9, right: "14%", top: "8%", rotation: 10, blur: 0, opacity: 0.7, zIndex: 40 },
    { fontSize: isBanner ? 4 : 5.5, right: "22%", bottom: "12%", rotation: 0, blur: 1, opacity: 0.5, zIndex: 30 },
    { fontSize: isBanner ? 5 : 7, right: "38%", top: "28%", rotation: emoji === "🎉" || emoji === "🚀" ? -30 : -10, blur: 2, opacity: 0.3, zIndex: 20 },
    { fontSize: isBanner ? 2.5 : 3.5, left: "26%", top: "14%", rotation: 15, blur: 4, opacity: 0.4, zIndex: 0 },
  ];
  const procedural = Array.from({ length: 4 }, (_, i) => generateEmojiPos(i + 5, isBanner));
  const tenth: EmojiPos = { fontSize: isBanner ? 3.5 : 5, right: "8%", top: "45%", rotation: 25, blur: 1, opacity: 0.5, zIndex: 30 };
  return [...handCrafted, ...procedural, tenth].slice(0, count);
}

// ─── Parse legacy metrics from URL (m1=followers:12500) ─────────────────────

function parseMetrics(params: URLSearchParams): { type: string; value: number; prefix?: string; customLabel?: string; previousValue?: number }[] {
  const metrics: { type: string; value: number; prefix?: string; customLabel?: string; previousValue?: number }[] = [];
  for (let i = 1; i <= 5; i++) {
    const raw = params.get(`m${i}`);
    if (!raw) continue;
    const parts = raw.split(":");
    if (parts.length < 2) continue;
    const type = parts[0];
    const valueStr = parts[1];
    const prefix = valueStr.startsWith("+") ? "+" : undefined;
    const value = parseFloat(valueStr.replace(/^\+/, ""));
    if (isNaN(value)) continue;
    const customLabel = parts[2] || undefined;
    if (type in METRIC_LABELS || type === "custom") {
      metrics.push({ type, value, prefix, customLabel });
    }
  }
  return metrics;
}

// ─── Main route ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Auth — internal requests (dashboard, auto-post) bypass API key entirely
  const key = params.get("key");
  const referer = request.headers.get("referer") || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";
  const isInternal = referer.startsWith(siteUrl) || referer.startsWith("http://localhost");

  let authResult: { valid: boolean; userId: string | null };
  if (isInternal) {
    authResult = { valid: true, userId: null };
  } else {
    authResult = await validateAndTrackKey(key, false);
    if (!authResult.valid) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
  }
  // Monthly usage check & rate limiting — skip for internal requests
  let externalTierWatermark = false;
  if (!isInternal) {
    const usageCheck = await checkMonthlyUsage(authResult.userId!);
    externalTierWatermark = API_TIERS[usageCheck.tier].watermark;
    const tierRateLimit = API_TIERS[usageCheck.tier].rateLimit;
    if (!checkRateLimit(key!, tierRateLimit)) {
      return new Response(JSON.stringify({ error: `Rate limit exceeded (${tierRateLimit} requests/minute)` }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } });
    }

    if (!usageCheck.allowed) {
      return new Response(JSON.stringify({
        error: "Monthly API limit exceeded",
        used: usageCheck.used,
        limit: usageCheck.limit,
        graceLimit: usageCheck.graceLimit,
        tier: usageCheck.tier,
        upgrade: "https://groar.app/dashboard/api",
      }), { status: 429, headers: { "Content-Type": "application/json" } });
    }

    // Quota notifications (fire & forget)
    if (usageCheck.limit > 0) {
      checkAndUpdateQuotaThreshold(authResult.userId!, usageCheck.used, usageCheck.limit)
        .then(async (threshold) => {
          if (!threshold) return;
          const userRow = await pool.query(
            `SELECT name, email FROM "user" WHERE id = $1`,
            [authResult.userId]
          );
          const user = userRow.rows[0];
          if (!user?.email) return;
          const tierName = API_TIERS[usageCheck.tier].name;
          const emailData =
            threshold === 80 ? apiQuota80Email(user.name || "there", tierName, usageCheck.used, usageCheck.limit)
            : threshold === 100 ? apiQuota100Email(user.name || "there", tierName, usageCheck.used, usageCheck.limit)
            : apiQuota120Email(user.name || "there", tierName, usageCheck.used, usageCheck.limit);
          await sendEmail({ to: user.email, ...emailData });
        })
        .catch((err) => console.error("Quota notification error:", err));
    }
  }

  // ── Resolve settings ──────────────────────────────────────────────────────
  // Priority: URL params > `s` param (base64 settings) > `t` param (template DB lookup)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settings: any = {};

  // Try `s` param first (base64-encoded full settings)
  const sParam = params.get("s");
  if (sParam) {
    try {
      settings = JSON.parse(Buffer.from(sParam, "base64").toString("utf-8"));
    } catch {
      return new Response(JSON.stringify({ error: "Invalid settings parameter" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  }

  // Fallback: load template from DB
  const templateId = params.get("t");
  if (!sParam && templateId) {
    try {
      const result = await pool.query(`SELECT settings FROM card_template WHERE id = $1`, [templateId]);
      if (result.rows.length > 0) {
        settings = typeof result.rows[0].settings === "string" ? JSON.parse(result.rows[0].settings) : result.rows[0].settings;
      }
    } catch { /* ignore */ }
  }

  // URL params override settings
  const templateType = (params.get("template") || settings.template || "metrics") as string;
  const bgParam = params.get("bg") || settings.background?.presetId || "noisy-lights";
  const colorParam = params.get("color") || settings.textColor || "#ffffff";
  const fontParam = params.get("font") || settings.font || "bricolage";
  const sizeParam = (params.get("size") || settings.aspectRatio || "post") as AspectRatioType;
  const layoutParam = params.get("layout") || settings.metricsLayout?.replace("grid", "columns") || "stack";
  const handleParam = params.get("handle") || settings.handle || null;
  const dateParam = params.get("date") || null;
  const headingParam = params.get("heading");
  const alignParam = params.get("align") || settings.textAlign || "center";
  const brandingParam = params.get("branding");
  const showLogo = brandingParam !== "false" && brandingParam !== "0";
  const watermarkParam = params.get("watermark");
  // Free tier: watermark always on, paid tiers: watermark off by default (opt-in)
  // Internal requests (dashboard/auto-post) never show watermark
  const showWatermark = isInternal
    ? !!settings.showWatermark
    : externalTierWatermark || watermarkParam === "true" || watermarkParam === "1";

  // Random support
  const imageBackgrounds = BACKGROUNDS.filter(b => b.image);
  const bgId = bgParam === "random" ? imageBackgrounds[Math.floor(Math.random() * imageBackgrounds.length)].id : bgParam;

  const RANDOM_TEXT_COLORS = ["#faf7e9", "#ffffff", "#f0f0f0", "#1a1a1a", "#0a0a0a", "#fde68a", "#bef264", "#93c5fd", "#c4b5fd", "#fca5a5", "#f9a8d4", "#a7f3d0", "#fcd34d", "#fdba74"];
  const textColor = colorParam === "random"
    ? RANDOM_TEXT_COLORS[Math.floor(Math.random() * RANDOM_TEXT_COLORS.length)]
    : colorParam.startsWith("#") ? colorParam : `#${colorParam}`;

  const allFontIds = Object.keys(GOOGLE_FONT_URLS);
  const fontId = fontParam === "random" ? allFontIds[Math.floor(Math.random() * allFontIds.length)] : fontParam;

  // Heading: URL param overrides, otherwise use settings.heading object
  const heading = headingParam ? { type: "custom" as const, text: headingParam } : (settings.heading || null);

  // ── Parse metrics ─────────────────────────────────────────────────────────

  let metrics = parseMetrics(params);

  // v1, v2 style (from template slots or settings metrics)
  if (metrics.length === 0) {
    const metricSlots = settings.metricSlots || settings.metrics || [];
    for (let i = 0; i < metricSlots.length && i < 5; i++) {
      const slot = metricSlots[i];
      const valueStr = params.get(`v${i + 1}`);
      const value = valueStr ? parseFloat(valueStr.replace(/^\+/, "")) : (slot.value ?? 0);
      if (isNaN(value)) continue;
      const prefix = valueStr?.startsWith("+") ? "+" : (slot.prefix || undefined);
      metrics.push({ type: slot.type, value, prefix, customLabel: slot.customLabel, previousValue: slot.previousValue });
    }
  }

  // For announcement template, parse a1, a2, e1, e2 etc.
  let announcements: { emoji?: string; text: string }[] = [];
  if (templateType === "announcement") {
    // Support both `announcements` (with text) and `announcementSlots` (emoji-only from templates)
    const settingAnnouncements = settings.announcements?.filter((a: { text: string }) => a.text) || [];
    const slots = settings.announcementSlots || [];
    for (let i = 0; i < 10; i++) {
      const text = params.get(`a${i + 1}`);
      const emojiOverride = params.get(`e${i + 1}`);
      const slotEmoji = settingAnnouncements[i]?.emoji || slots[i]?.emoji;
      if (text) {
        announcements.push({ emoji: emojiOverride || slotEmoji, text });
      } else if (settingAnnouncements[i]) {
        announcements.push({ ...settingAnnouncements[i], emoji: emojiOverride || settingAnnouncements[i].emoji });
      }
    }
    if (announcements.length === 0) announcements = settingAnnouncements;
  }

  // For progress template
  const goalParam = params.get("goal");
  const goal = goalParam ? parseFloat(goalParam) : (settings.goal || 0);
  const progressBarColorParam = params.get("progressBarColor") || settings.progressBarColor || null;
  const progressDisplayParam = (params.get("progressDisplay") || settings.progressDisplay || "bar") as "bar" | "dots" | "square";

  // For milestone template
  const RANDOM_EMOJIS = Object.keys(EMOJI_IMAGES);
  const emojiParam = params.get("emoji") || settings.milestoneEmoji || null;
  const milestoneEmoji = emojiParam === "random" ? RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)] : emojiParam;
  const milestoneEmojiCount = parseInt(params.get("emojiCount") || String(settings.milestoneEmojiCount ?? 3));

  // Validate: metrics template requires at least one metric
  if (templateType === "metrics" && metrics.length === 0) {
    return new Response(JSON.stringify({ error: "No metrics provided. Use v1=12500 or m1=followers:12500" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (templateType === "milestone" && metrics.length === 0) {
    return new Response(JSON.stringify({ error: "No metric provided. Use v1=VALUE" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (templateType === "progress" && metrics.length === 0) {
    return new Response(JSON.stringify({ error: "No metric provided. Use v1=VALUE" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // ── Resolve visual settings ───────────────────────────────────────────────

  const bg = BACKGROUNDS.find(b => b.id === bgId);
  let bgImageUrl: string | null = null;
  if (bg?.image) {
    bgImageUrl = await convertBgToPngDataUrl(bg.image, request.nextUrl.origin);
  }
  const bgColor = bg?.color || bg?.gradient || "#1a1a1a";

  // ── Resolve branding logo ────────────────────────────────────────────────
  const branding = settings.branding;
  console.log("[card] branding settings:", JSON.stringify(branding), "showLogo:", showLogo);
  let logoDataUrl: string | null = null;
  if (showLogo && branding?.logoUrl && branding?.enabled !== false) {
    logoDataUrl = await convertLogoToDataUrl(branding.logoUrl);
  }
  const logoPosition = branding?.position || "left";
  const logoSize = branding?.logoSize ?? 30;

  const aspectConfig = ASPECT_RATIOS[sizeParam] || ASPECT_RATIOS.post;
  const { width, height } = aspectConfig;
  const isBanner = sizeParam === "banner";
  const isSquare = sizeParam === "square";
  const sq = (base: number) => isSquare ? base * 1.15 : base;
  const layout = layoutParam === "grid" ? "columns" : layoutParam;
  const align = layout === "columns" ? "center" : alignParam;

  // Determine the best bold weight for the font (DM Mono only has 500, DM Serif Display only 400)
  const FONT_BOLD_WEIGHTS: Record<string, number> = { "dm-mono": 500, "dm-serif-display": 400 };
  const boldWeight = FONT_BOLD_WEIGHTS[fontId] || 700;

  let fontRegular: ArrayBuffer;
  let fontBold: ArrayBuffer;
  try {
    [fontRegular, fontBold] = await Promise.all([loadFont(fontId, 400), loadFont(fontId, boldWeight)]);
  } catch {
    [fontRegular, fontBold] = await Promise.all([loadFont("bricolage", 400), loadFont("bricolage", 700)]);
  }
  const fontFamily = GOOGLE_FONT_FAMILIES[fontId] || "Bricolage Grotesque";

  const abbreviate = settings.abbreviateNumbers !== false;
  const unit = width / 100;
  const handleSize = isBanner ? unit * 2.1 : unit * sq(2.4);
  const textShadow = "0 1px 2px rgba(0,0,0,0.15)";

  // Date label: only shown if explicitly passed via `date` param
  const headerDate = dateParam || null;

  // Handle display
  const handle = handleParam && handleParam !== "@your_handle" ? handleParam : null;

  // ── Build JSX ─────────────────────────────────────────────────────────────

  let content: React.ReactNode;

  if (templateType === "milestone") {
    // ── Milestone template ──────────────────────────────────────────────────
    const primaryMetric = metrics[0] || { id: "fallback", type: "followers" as const, value: 0 };
    const value = primaryMetric.value;
    const metricLabel = primaryMetric.type === "custom" && primaryMetric.customLabel
      ? primaryMetric.customLabel
      : METRIC_LABELS[primaryMetric.type as MetricType] || primaryMetric.type;
    const step = getStepSize(value);
    const prev = value - step;
    const next = value + step;
    const farPrev = prev - step;
    const farNext = next + step;
    const labelSize = isBanner ? unit * 2.8 : unit * 3.6;

    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: textColor, textShadow, gap: isBanner ? unit * 0.15 : unit * 0.3, position: "relative", zIndex: 100 }}>
        {farPrev >= 0 && (
          <div style={{ fontWeight: 500, opacity: 0.2, fontSize: isBanner ? unit * 2 : unit * 2.5, display: "flex" }}>
            {fmtMetric(primaryMetric.type, farPrev, abbreviate)}
          </div>
        )}
        {prev >= 0 && (
          <div style={{ fontWeight: 500, opacity: 0.4, fontSize: isBanner ? unit * 3 : unit * 4, display: "flex" }}>
            {fmtMetric(primaryMetric.type, prev, abbreviate)}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: isBanner ? unit * 9 : unit * 12, lineHeight: 1, letterSpacing: "-0.02em", display: "flex" }}>
            {fmtMetric(primaryMetric.type, value, abbreviate)}
          </div>
          <div style={{ fontWeight: 600, opacity: 0.8, display: "flex", alignItems: "center", fontSize: labelSize, marginTop: isBanner ? unit * 0.4 : unit * 0.5, marginBottom: isBanner ? unit * 0.75 : unit * 1, gap: isBanner ? unit * 0.75 : unit * 1 }}>
            {renderIcon(primaryMetric.type, labelSize, textColor)}
            {metricLabel}
          </div>
        </div>
        <div style={{ fontWeight: 500, opacity: 0.4, fontSize: isBanner ? unit * 3 : unit * 4, display: "flex" }}>
          {fmtMetric(primaryMetric.type, next, abbreviate)}
        </div>
        <div style={{ fontWeight: 500, opacity: 0.2, fontSize: isBanner ? unit * 2 : unit * 2.5, display: "flex" }}>
          {fmtMetric(primaryMetric.type, farNext, abbreviate)}
        </div>
      </div>
    );
  } else if (templateType === "progress") {
    // ── Progress template ───────────────────────────────────────────────────
    const primaryMetric = metrics[0] || { id: "fallback", type: "followers" as const, value: 0 };
    const currentValue = primaryMetric.value;
    const resolvedGoal = goal > 0 ? goal : getNextGoal(currentValue);
    const progress = Math.min((currentValue / resolvedGoal) * 100, 100);
    const isAutoColor = settings.progressBarAuto !== false;
    const autoColor = getProgressColor(progress);
    const customColor = progressBarColorParam || autoColor;
    const barColor = isAutoColor ? autoColor : customColor;
    const barColorLight = isAutoColor
      ? getProgressColor(Math.min(progress + 15, 100))
      : `${customColor}cc`;
    const haloColor = barColor;
    const metricLabel = primaryMetric.type === "custom" && primaryMetric.customLabel
      ? primaryMetric.customLabel
      : METRIC_LABELS[primaryMetric.type as MetricType] || primaryMetric.type;

    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: textColor, textShadow, gap: isBanner ? unit * 0.8 : unit * 1.2, width: "70%", position: "relative", zIndex: 10 }}>
        {/* Metric label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isBanner ? unit * 0.5 : unit * 0.7, fontSize: isBanner ? unit * 2.5 : unit * 3, opacity: 0.6, fontWeight: 500, marginBottom: isBanner ? -unit * 0.4 : -unit * 0.6 }}>
          {renderIcon(primaryMetric.type, isBanner ? unit * 2.5 : unit * 3, textColor)}
          {metricLabel} Goal
        </div>
        {/* Value: current / goal */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: isBanner ? unit * 0.5 : unit * 0.8 }}>
          <span style={{ fontWeight: 700, fontSize: isBanner ? unit * 8 : unit * 10.5, letterSpacing: "-0.02em" }}>
            {fmtMetric(primaryMetric.type, currentValue, abbreviate)}
          </span>
          <span style={{ fontWeight: 600, fontSize: isBanner ? unit * 3.5 : unit * 4.2, opacity: 0.5 }}>
            / {fmtMetric(primaryMetric.type, resolvedGoal, abbreviate)}
          </span>
        </div>
        {/* Progress visualization */}
        {progressDisplayParam === "bar" && (
          <div style={{ display: "flex", width: "100%", height: isBanner ? unit * 2.8 : unit * 3.5, borderRadius: 9999, overflow: "hidden", background: "rgba(255,255,255,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${progress}%`, borderRadius: 9999, background: haloColor, opacity: 0.5, filter: "blur(5px)" }} />
            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 9999, background: `linear-gradient(90deg, ${barColor}, ${barColorLight})`, boxShadow: `0 2px 12px ${barColor}80`, position: "relative" }} />
          </div>
        )}
        {progressDisplayParam === "dots" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: isBanner ? unit * 0.5 : unit * 0.6 }}>
            {[0, 25, 50, 75].map((rowStart) => (
              <div key={rowStart} style={{ display: "flex", justifyContent: "center", gap: isBanner ? unit * 1 : unit * 1.3 }}>
                {Array.from({ length: 25 }, (_, j) => {
                  const idx = rowStart + j;
                  return <div key={idx} style={{ width: isBanner ? unit * 0.9 : unit * 1.1, height: isBanner ? unit * 0.9 : unit * 1.1, borderRadius: 9999, backgroundColor: idx < Math.round(progress) ? textColor : `${textColor}30` }} />;
                })}
              </div>
            ))}
          </div>
        )}
        {progressDisplayParam === "square" && (() => {
          const blockProgress = progress / 10;
          const getBlockColor = (i: number): string => {
            const fill = blockProgress - i;
            if (fill >= 1) return "#22c55e";
            if (fill >= 0.5) return "#eab308";
            if (fill > 0) return "#f97316";
            return `${textColor}20`;
          };
          return (
            <div style={{ display: "flex", justifyContent: "center", width: "100%", gap: isBanner ? unit * 0.8 : unit * 1.1 }}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ width: isBanner ? unit * 3.5 : unit * 4.5, height: isBanner ? unit * 3.5 : unit * 4.5, borderRadius: isBanner ? unit * 0.5 : unit * 0.6, backgroundColor: getBlockColor(i) }} />
              ))}
            </div>
          );
        })()}
        <div style={{ fontWeight: 600, fontSize: isBanner ? unit * 2.4 : unit * 3, display: "flex" }}>
          {Number.isInteger(progress) ? progress : progress.toFixed(2)}% complete
        </div>
      </div>
    );
  } else if (templateType === "announcement") {
    // ── Announcement template ───────────────────────────────────────────────
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", color: textColor, textShadow, gap: isBanner ? unit * 1.5 : unit * 2.5, padding: "0 4%", position: "relative", zIndex: 10 }}>
        {renderHeading(heading, unit, isBanner, isSquare, true, logoDataUrl, logoSize)}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: isBanner ? unit * 0.8 : unit * 1.2, padding: isBanner ? "0 8%" : "0 6%" }}>
          {announcements.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", overflow: "hidden", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: isBanner ? unit * 1.2 : unit * 1.8, padding: isBanner ? `${unit * 1.2}px ${unit * 2}px` : `${unit * 1.6}px ${unit * 2.5}px`, gap: isBanner ? unit * 1.2 : unit * 1.8 }}>
              <span style={{ fontSize: isBanner ? unit * 2.8 : unit * 3.8, lineHeight: 1 }}>
                {a.emoji || "✅"}
              </span>
              <span style={{ fontWeight: 600, fontSize: isBanner ? unit * 2.2 : unit * 2.8 }}>
                {a.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    // ── Metrics template (default) ──────────────────────────────────────────
    const maxMetrics = (layout === "columns" || isBanner) ? 3 : 5;
    const displayMetrics = metrics.slice(0, maxMetrics);
    const hasHeading = !!heading;

    let metricsContent: React.ReactNode;

    if (layout === "columns" && displayMetrics.length >= 2) {
      // Columns layout
      const ordered = displayMetrics.length === 3
        ? [displayMetrics[1], displayMetrics[0], displayMetrics[2]]
        : displayMetrics;
      const mainIndex = displayMetrics.length === 3 ? 1 : 0;

      metricsContent = (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: isBanner ? unit * 1 : unit * 1.5, padding: "0 3%" }}>
          {ordered.map((metric, index) => {
            const isMain = index === mainIndex;
            const count = ordered.length;
            const baseValue = hasHeading
              ? (isBanner ? 5 / Math.max(count * 0.3, 1) : sq(7) / Math.max(count * 0.3, 1))
              : (isBanner ? 6.5 / Math.max(count * 0.3, 1) : sq(8.5) / Math.max(count * 0.3, 1));
            const valueSize = unit * (isMain ? baseValue * 1.2 : baseValue);
            const baseLabel = hasHeading ? (isBanner ? 1.8 : sq(2.3)) : (isBanner ? 2.1 : sq(2.7));
            const labelSize = unit * (isMain ? baseLabel * 1.2 : baseLabel);
            const iconSize = labelSize;
            const columnFlex = isMain && ordered.length === 3 ? 1.3 : 1;
            const label = metric.type === "custom" && metric.customLabel ? metric.customLabel : METRIC_LABELS[metric.type as MetricType] || metric.type;

            return (
              <div key={`${metric.type}-${index}`} style={{ display: "flex", alignItems: "center", flex: columnFlex, gap: isBanner ? unit * 1 : unit * 1.5 }}>
                {index > 0 && (
                  <div style={{ width: isBanner ? 1 : 1.5, height: isBanner ? unit * 4 : unit * sq(5), borderRadius: 1, background: textColor, opacity: 0.15, flexShrink: 0 }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: valueSize, lineHeight: isBanner ? `${unit * 6}px` : `${unit * sq(8.5)}px` }}>
                    {fmtMetric(metric.type, metric.value, abbreviate, metric.prefix)}
                  </span>
                  <div style={{ opacity: 0.6, fontWeight: 500, fontSize: labelSize, lineHeight: isBanner ? `${unit * 3}px` : `${unit * sq(4)}px`, display: "flex", alignItems: "center", gap: isBanner ? unit * 0.3 : unit * 0.5 }}>
                    {renderIcon(metric.type, iconSize, textColor)}
                    {label}
                  </div>
                  {metric.previousValue !== undefined && metric.value > metric.previousValue && (() => {
                    const trendSize = isMain
                      ? (isBanner ? unit * 2.3 : unit * sq(2.9))
                      : (isBanner ? unit * 1.8 : unit * sq(2.3));
                    const pct = metric.previousValue > 0 ? Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100) : null;
                    if (pct === 0) return null;
                    return (
                      <span style={{ fontSize: trendSize, fontWeight: 600, marginTop: unit * 0.15, color: "#34d399", display: "flex", alignItems: "center", gap: unit * 0.1 }}>
                        {renderTrendArrow(trendSize, true, "#34d399")}
                        {pct !== null && `+${pct}%`}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Stack layout
      metricsContent = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "center", gap: 0 }}>
          {displayMetrics.map((metric, index) => {
            const isPrimary = index === 0;
            const primarySize = hasHeading ? (isBanner ? unit * 5.2 : unit * sq(6.4)) : (isBanner ? unit * 7.5 : unit * sq(9.5));
            const secondarySize = hasHeading ? (isBanner ? unit * 3 : unit * sq(3.7)) : (isBanner ? unit * 3.5 : unit * sq(4.4));
            const fontSize = isPrimary ? primarySize : secondarySize;
            const primaryIcon = hasHeading ? (isBanner ? unit * 3.6 : unit * sq(4.5)) : (isBanner ? unit * 5.2 : unit * sq(6.5));
            const secondaryIcon = hasHeading ? (isBanner ? unit * 2.6 : unit * sq(3.2)) : (isBanner ? unit * 3.4 : unit * sq(4.2));
            const iconSize = isPrimary ? primaryIcon : secondaryIcon;
            const label = metric.type === "custom" && metric.customLabel ? metric.customLabel : METRIC_LABELS[metric.type as MetricType] || metric.type;

            return (
              <div key={`${metric.type}-${index}`} style={{
                display: "flex",
                alignItems: "center",
                fontWeight: isPrimary ? 600 : 500,
                opacity: isPrimary ? 1 : 0.8,
                fontSize,
                gap: isPrimary ? (isBanner ? unit * 0.6 : unit * 1) : (isBanner ? unit * 0.7 : unit * 1.2),
                marginTop: index > 0 ? (isBanner ? -unit * 0.3 : -unit * 0.5) : 0,
              }}>
                {renderIcon(metric.type, iconSize, textColor)}
                {fmtMetric(metric.type, metric.value, abbreviate, metric.prefix)} {label}
                {metric.previousValue !== undefined && metric.value > metric.previousValue && (() => {
                  const trendSize = isPrimary
                    ? (isBanner ? unit * 2.6 : unit * sq(3.25))
                    : (isBanner ? unit * 1.8 : unit * sq(2.3));
                  const pct = metric.previousValue > 0 ? Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100) : null;
                  if (pct === 0) return null;
                  return (
                    <span style={{ fontSize: trendSize, fontWeight: 600, marginLeft: unit * 0.4, color: "#34d399", display: "flex", alignItems: "center", gap: unit * 0.15 }}>
                      {renderTrendArrow(trendSize, true, "#34d399")}
                      {pct !== null && `+${pct}%`}
                    </span>
                  );
                })()}
              </div>
            );
          })}
        </div>
      );
    }

    content = (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "left" ? "flex-start" : "center",
        justifyContent: "center",
        color: textColor,
        textShadow,
        gap: isBanner ? unit * 0.3 : unit * 0.5,
        padding: align === "left" ? "0 8%" : "0 4%",
        position: "relative",
        width: "100%",
        zIndex: 10,
      }}>
        {renderHeading(heading, unit, isBanner, isSquare, false, logoDataUrl, logoSize)}
        {metricsContent}
      </div>
    );
  }

  // ── Milestone emoji overlay ───────────────────────────────────────────────
  const emojiOverlay = templateType === "milestone" && milestoneEmoji && milestoneEmojiCount > 0 ? (() => {
    const imageSrc = EMOJI_IMAGES[milestoneEmoji];
    if (!imageSrc) return null;
    const positions = getEmojiPositions(milestoneEmoji, isBanner, milestoneEmojiCount);
    return positions.map((pos, i) => {
      const sizeVal = pos.fontSize * unit;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`emoji-${i}`}
          src={`${request.nextUrl.origin}${imageSrc}`}
          alt=""
          width={sizeVal}
          height={sizeVal}
          style={{
            position: "absolute",
            ...(pos.left ? { left: pos.left } : {}),
            ...(pos.right ? { right: pos.right } : {}),
            ...(pos.top ? { top: pos.top } : {}),
            ...(pos.bottom ? { bottom: pos.bottom } : {}),
            transform: `rotate(${pos.rotation}deg)`,
            opacity: pos.opacity,
            zIndex: pos.zIndex,
            objectFit: "contain",
          }}
        />
      );
    });
  })() : null;

  // ── Assemble final image ──────────────────────────────────────────────────

  const image = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontFamily, position: "relative", overflow: "hidden", background: bgColor }}>
      {/* Background image */}
      {bgImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgImageUrl} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}

      {/* Milestone emoji overlay */}
      {emojiOverlay}

      {/* Handle (top-left) */}
      {handle && (
        <div style={{ position: "absolute", top: "3%", left: "3%", color: textColor, opacity: 0.6, fontSize: handleSize, textShadow, display: "flex" }}>
          {handle}
        </div>
      )}

      {/* Date label (top-right) */}
      {headerDate && (
        <div style={{ position: "absolute", top: "3%", right: "3%", color: textColor, opacity: 0.6, fontSize: handleSize, textShadow, display: "flex" }}>
          {headerDate}
        </div>
      )}

      {/* Main content */}
      {content}

      {/* User logo */}
      {logoDataUrl && !(heading?.type === "logo" && (templateType === "metrics" || templateType === "announcement")) && (
        <div style={{
          position: "absolute",
          bottom: "3%",
          display: "flex",
          ...(logoPosition === "left"
            ? { left: "3%" }
            : logoPosition === "right"
              ? { right: "3%" }
              : { left: "50%", transform: "translateX(-50%)" }),
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUrl}
            alt=""
            style={{ height: logoSize * unit / 6, objectFit: "contain" }}
          />
        </div>
      )}

      {/* Powered by GROAR (bottom-right) */}
      {showWatermark && (
        <div style={{ position: "absolute", bottom: "3%", [logoPosition === "right" && logoDataUrl ? "left" : "right"]: "3%", display: "flex", alignItems: "center", color: textColor, opacity: 0.5, fontSize: isBanner ? unit * 2.3 : unit * 2.7, textShadow }}>
          groar.app
        </div>
      )}
    </div>
  );

  return new ImageResponse(image, {
    width,
    height,
    fonts: [
      { name: fontFamily, data: fontRegular, style: "normal", weight: 400 },
      { name: fontFamily, data: fontBold, style: "normal", weight: 700 },
    ],
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
