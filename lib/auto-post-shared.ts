// Client-safe types and constants for auto-post feature
// This file can be imported from client components without pulling in `pg`

export type MilestoneMetric = "followers" | "posts" | "exports" | "mrr" | "revenue" | "customers";

export const AUTO_POST_METRICS = ["followers", "mrr", "revenue"] as const;
export type AutoPostMetric = (typeof AUTO_POST_METRICS)[number];

// ─── Trigger & card types ───────────────────────────────────────────

export const TRIGGERS = ["milestone", "daily", "weekly"] as const;
export type AutoPostTrigger = (typeof TRIGGERS)[number];

export const CARD_TEMPLATES = ["milestone", "metrics", "progress"] as const;
export type AutoPostCardTemplate = (typeof CARD_TEMPLATES)[number];

/** Which card templates are valid for each trigger */
export const TRIGGER_CARD_TEMPLATES: Record<AutoPostTrigger, AutoPostCardTemplate[]> = {
  milestone: ["milestone"],
  daily: ["metrics", "progress"],
  weekly: ["metrics", "progress"],
};

/** Display labels for metrics (respects casing, e.g. "MRR" not "mrr") */
export const METRIC_DISPLAY_LABELS: Record<AutoPostMetric, string> = {
  followers: "Followers",
  mrr: "MRR",
  revenue: "Revenue",
};

export const TRIGGER_LABELS: Record<AutoPostTrigger, string> = {
  milestone: "When milestone hit",
  daily: "Every day",
  weekly: "Every week",
};

export const CARD_TEMPLATE_LABELS: Record<AutoPostCardTemplate, string> = {
  milestone: "Milestone",
  progress: "Progress",
  metrics: "Metrics",
};

// ─── Per-metric config ──────────────────────────────────────────────

export type MetricAutoPostConfig = {
  enabled: boolean;
  trigger: AutoPostTrigger;
  cardTemplate: AutoPostCardTemplate;
  tweetTemplate: string;
  goal?: number; // for progress card template
};

export type AutoPostVisualSettings = {
  backgrounds: string[];
  fonts: string[];
  textColors: string[];
  emojis: { emoji: string; unified: string; name: string }[];
  emojiCount: number;
  aspectRatio: string;
};

export type AutoPostSettings = {
  metrics: Record<AutoPostMetric, MetricAutoPostConfig>;
  visual: AutoPostVisualSettings;
};

// ─── Defaults ───────────────────────────────────────────────────────

/** Default tweet texts for Milestone + Metrics card templates */
export const DEFAULT_TEMPLATES: Record<AutoPostTrigger, Record<AutoPostMetric, string[]>> = {
  milestone: {
    followers: [
      "{milestone} {metric} 🎉\n\nIf you're new here, drop a 👋 — I try to reply to everyone.\n\nMade with groar.app by @yannick_ferire",
    ],
    mrr: [
      "{milestone} {metric} 💰\n\nGenuinely curious — what's working for you right now? Always down to trade notes with other founders.\n\nMade with groar.app by @yannick_ferire",
    ],
    revenue: [
      "{milestone} in {metric} 🚀\n\nStill figuring things out tbh. What was your biggest unlock in your last $1K?\n\nMade with groar.app by @yannick_ferire",
    ],
  },
  daily: {
    followers: [
      "Day {period} — {value} {metric}\n\nIf we haven't talked yet, drop a 👋 — I'd love to know what you're working on.\n\nMade with groar.app by @yannick_ferire",
    ],
    mrr: [
      "Day {period} — ${value} {metric}\n\nNo vanity metrics, just the real number. Any other founders tracking their MRR daily? How do you stay sane? 😅\n\nMade with groar.app by @yannick_ferire",
    ],
    revenue: [
      "Day {period} — ${value} {metric}\n\nEvery dollar earned is a lesson learned. What's the best money you ever spent on your business?\n\nMade with groar.app by @yannick_ferire",
    ],
  },
  weekly: {
    followers: [
      "Week {period} — {value} {metric}\n\nQuick recap of the week. What did you ship? Tell me about it 👇\n\nMade with groar.app by @yannick_ferire",
    ],
    mrr: [
      "Week {period} — ${value} {metric}\n\nWeekly check-in. If you could go back and change one thing about your pricing, what would it be?\n\nMade with groar.app by @yannick_ferire",
    ],
    revenue: [
      "Week {period} — ${value} {metric}\n\nAnother week, another data point. What's one thing that moved the needle for you this week?\n\nMade with groar.app by @yannick_ferire",
    ],
  },
};

/** Default tweet texts for Progress card template (no Day/Week heading in card) */
export const PROGRESS_TEMPLATES: Record<Exclude<AutoPostTrigger, "milestone">, Record<AutoPostMetric, string[]>> = {
  daily: {
    followers: [
      "{value}/{goal} {metric} 📈\n\nGrinding towards the goal, one day at a time. What's your current target? Let's keep each other accountable 👇\n\nMade with groar.app by @yannick_ferire",
    ],
    mrr: [
      "${value}/${goal} {metric} 💪\n\nEvery dollar closer to the goal. What milestone are you chasing right now? Drop it below.\n\nMade with groar.app by @yannick_ferire",
    ],
    revenue: [
      "${value}/${goal} {metric} 🎯\n\nProgress update. What's the one thing that helped you most in growing revenue? Genuinely want to know.\n\nMade with groar.app by @yannick_ferire",
    ],
  },
  weekly: {
    followers: [
      "{value}/{goal} {metric} 📊\n\nWeekly progress check. Getting closer. Who else is tracking their growth publicly? Love seeing the transparency.\n\nMade with groar.app by @yannick_ferire",
    ],
    mrr: [
      "${value}/${goal} {metric} 🏗️\n\nBuilding in public, one week at a time. What was your best revenue week ever and what caused it?\n\nMade with groar.app by @yannick_ferire",
    ],
    revenue: [
      "${value}/${goal} {metric} 📈\n\nAnother week closer to the goal. What's the one change that had the biggest impact on your revenue?\n\nMade with groar.app by @yannick_ferire",
    ],
  },
};

// Visual settings for individual automations
// Arrays = randomize between values at post time; single values for text color / aspect ratio
export type AutomationVisualSettings = {
  backgrounds: string[];
  fonts: string[];
  textColor: string;
  aspectRatio: string;
  emojis: { emoji: string; unified: string; name: string }[];
  milestoneEmojiCount?: number;
  abbreviateNumbers?: boolean; // default true
  logoUrl?: string;
  logoPosition?: "left" | "center" | "right";
  logoSize?: number; // px height, default 30
  metricsLayout?: "stack" | "grid"; // for metrics template with 2+ metrics
  // Legacy single-value fields (migrated to arrays above)
  background?: string;
  font?: string;
  milestoneEmoji?: string;
  milestoneEmojiUnified?: string;
  milestoneEmojiName?: string;
};

export const DEFAULT_VISUAL_SETTINGS_SINGLE: AutomationVisualSettings = {
  backgrounds: ["noisy-lights"],
  fonts: ["bricolage"],
  textColor: "#ffffff",
  aspectRatio: "post",
  emojis: [{ emoji: "🎉", unified: "1f389", name: "Party Popper" }],
  milestoneEmojiCount: 3,
};

/** Pick a random element from an array, or return the fallback */
export function pickRandom<T>(arr: T[] | undefined, fallback: T): T {
  if (!arr || arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Legacy multi-select visual settings (used by old autoPostSettings)
export const DEFAULT_VISUAL_SETTINGS: AutoPostVisualSettings = {
  backgrounds: ["noisy-lights", "northern-lights", "tokyo-streets", "bled-lakes", "orangeblue"],
  fonts: ["bricolage"],
  textColors: ["#ffffff"],
  emojis: [
    { emoji: "🎉", unified: "1f389", name: "Party Popper" },
    { emoji: "🔥", unified: "1f525", name: "Fire" },
    { emoji: "🚀", unified: "1f680", name: "Rocket" },
  ],
  emojiCount: 3,
  aspectRatio: "post",
};

const DEFAULT_METRIC_CONFIG: MetricAutoPostConfig = {
  enabled: false,
  trigger: "milestone",
  cardTemplate: "milestone",
  tweetTemplate: "",
};

export function getDefaultSettings(): AutoPostSettings {
  return {
    metrics: {
      followers: { ...DEFAULT_METRIC_CONFIG },
      mrr: { ...DEFAULT_METRIC_CONFIG },
      revenue: { ...DEFAULT_METRIC_CONFIG },
    },
    visual: { ...DEFAULT_VISUAL_SETTINGS },
  };
}

export function mergeSettings(saved: Partial<AutoPostSettings> | null): AutoPostSettings {
  const defaults = getDefaultSettings();
  if (!saved) return defaults;
  return {
    metrics: {
      followers: { ...defaults.metrics.followers, ...saved.metrics?.followers },
      mrr: { ...defaults.metrics.mrr, ...saved.metrics?.mrr },
      revenue: { ...defaults.metrics.revenue, ...saved.metrics?.revenue },
    },
    visual: { ...defaults.visual, ...saved.visual },
  };
}

export function formatMilestoneNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString("en-US");
}

/** How many hours between scheduled posts for each frequency */
export const FREQUENCY_HOURS: Record<Exclude<AutoPostTrigger, "milestone">, number> = {
  daily: 20,   // ~1/day with buffer
  weekly: 156, // ~6.5 days
};

// ─── Credits system ──────────────────────────────────────────────────

export const MONTHLY_CREDITS = 1000;
export const CREDIT_COST_POST = 30;
export const CREDIT_COST_VARIANT = 5;

/** Get all default tweet variants for a trigger+metric+cardTemplate combo */
export function getDefaultTemplates(trigger: AutoPostTrigger, metric: AutoPostMetric, cardTemplate?: AutoPostCardTemplate): string[] {
  if (cardTemplate === "progress" && trigger !== "milestone") {
    return PROGRESS_TEMPLATES[trigger][metric];
  }
  return DEFAULT_TEMPLATES[trigger][metric];
}

/** Get the first default tweet template (backward compat) */
export function getDefaultTemplate(trigger: AutoPostTrigger, metric: AutoPostMetric, cardTemplate?: AutoPostCardTemplate): string {
  return getDefaultTemplates(trigger, metric, cardTemplate)[0];
}

// ─── Tweet variant helpers ──────────────────────────────────────────

/** Parse tweetTemplate from DB (JSON array string or legacy plain string) into string[] */
export function parseTweetVariants(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((s: unknown) => typeof s === "string");
  } catch {
    // not JSON — legacy plain string
  }
  return [raw];
}

/** Serialize tweet variants to store in DB */
export function serializeTweetVariants(variants: string[]): string {
  return JSON.stringify(variants);
}
