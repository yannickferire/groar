// Client-safe plans configuration
// For server-side functions, use lib/plans-server.ts
// For Polar integration, use lib/polar.ts

import {
  Setting06Icon,
  Image01Icon,
  Layout01Icon,
  ChromeIcon,
  SourceCodeSquareIcon,
  RoboticIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export const PLANS = {
  free: {
    name: "Free",
    subtitle: "for hobby growers",
    price: 0,
    maxConnectionsPerProvider: 0,
    maxExportsPerWeek: 3,
    features: [
      "Full access to the editor",
      "3 exports per week",
      "5 backgrounds included",
      "Metric template",
    ],
    limits: [
      "Groar watermark",
    ],
  },
  pro: {
    name: "Pro",
    subtitle: "for you",
    price: 5,
    maxConnectionsPerProvider: 1, // Multi-account ready, increase to re-enable
    maxExportsPerWeek: null, // unlimited
    features: [
      "Unlimited exports",
      "Unlimited backgrounds",
      "No watermark",
      "Connect your X account",
      "Auto-post on X",
    ],
  },
  friend: {
    name: "Friend",
    price: 0,
    maxConnectionsPerProvider: 999, // unlimited
    maxExportsPerWeek: null, // unlimited
    features: [
      "Everything in Pro",
      "Gift plan",
      "Unlimited everything",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

export const FREE_WEEKLY_LIMIT = PLANS.free.maxExportsPerWeek;

// Helper to get limits (backward compatible)
export const PLAN_LIMITS = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [
    key,
    {
      maxConnectionsPerProvider: plan.maxConnectionsPerProvider,
      maxExportsPerWeek: plan.maxExportsPerWeek,
    },
  ])
) as Record<PlanType, { maxConnectionsPerProvider: number; maxExportsPerWeek: number | null }>;

export const PLAN_ORDER: PlanType[] = ["free", "friend", "pro"];

export const PRO_FEATURES: { icon: IconSvgElement; title: string; info?: string }[] = [
  { icon: Layout01Icon, title: "All templates unlocked" },
  { icon: Image01Icon, title: "Full background library" },
  { icon: Setting06Icon, title: "Custom branding & no watermark" },
  { icon: ChromeIcon, title: "Chrome extension (coming soon)" },
  { icon: RoboticIcon, title: "Auto-post milestones on X" },
  { icon: SourceCodeSquareIcon, title: "API access — 500 req/month free", info: "api-pricing" },
];

export type ApiTier = "free" | "growth" | "scale" | "enterprise";

export const API_TIERS: Record<ApiTier, { name: string; limit: number; price: string; priceValue: number; watermark: boolean; gracePercent: number; rateLimit: number }> = {
  free:       { name: "Free",       limit: 500,    price: "Free",      priceValue: 0,  watermark: true,  gracePercent: 20, rateLimit: 30 },
  growth:     { name: "Growth",     limit: 5_000,  price: "$9/mo",     priceValue: 9,  watermark: false, gracePercent: 20, rateLimit: 30 },
  scale:      { name: "Scale",      limit: 50_000, price: "$29/mo",    priceValue: 29, watermark: false, gracePercent: 20, rateLimit: 50 },
  enterprise: { name: "Enterprise", limit: 500_000, price: "Custom",   priceValue: 0,  watermark: false, gracePercent: 20, rateLimit: 100 },
};

export const API_TIER_ORDER: ApiTier[] = ["free", "growth", "scale", "enterprise"];

/** Get the next upgrade tier, or null if already at max */
export function getNextApiTier(current: ApiTier): ApiTier | null {
  const idx = API_TIER_ORDER.indexOf(current);
  return idx < API_TIER_ORDER.length - 1 ? API_TIER_ORDER[idx + 1] : null;
}

/** Get API limit including the grace buffer (limit * 1.2) */
export function getApiGraceLimit(tier: ApiTier): number {
  const t = API_TIERS[tier];
  return Math.ceil(t.limit * (1 + t.gracePercent / 100));
}

export const API_PRICING_TIERS = [
  { requests: "500",     price: "Free",    label: "Included in Pro" },
  { requests: "5,000",   price: "$9/mo",   label: "Growth" },
  { requests: "50,000",  price: "$29/mo",  label: "Scale" },
  { requests: "500,000+", price: "Custom", label: "Enterprise" },
] as const;

export const PRO_CHECKS: string[] = [
  "Export history & re-import",
  "Unlimited exports",
];

// Trial
export const TRIAL_DURATION_DAYS = 3;

// Billing
export type BillingPeriod = "monthly" | "lifetime";

// Early adopter pricing — both plans share the same spot pool (driven by lifetime sold count).
// When a lifetime tier fills up, both prices increase together.
export const LIFETIME_PRICING_TIERS = [
  { price: 9, spots: 15 },
  { price: 12, spots: 20 },
  { price: 15, spots: 35 },
  { price: 19, spots: 50 },
  { price: 24, spots: 80 },
  { price: 29, spots: null }, // final price, unlimited
] as const;

// Monthly prices aligned 1:1 with lifetime tiers (+$1 per tier jump)
export const PRO_PRICING_TIERS = [
  { price: 5, spots: 15 },
  { price: 6, spots: 20 },
  { price: 7, spots: 35 },
  { price: 8, spots: 50 },
  { price: 9, spots: 80 },
  { price: 9, spots: null }, // final price, same as previous
] as const;

export const LIFETIME_FINAL_PRICE = 29;

// Tier info types returned by /api/pricing
export type ProTierInfo = {
  price: number;
  spotsLeft: number | null;
  nextPrice: number | null;
};

export type LifetimeTierInfo = {
  price: number;
  spotsLeft: number | null;
  nextPrice: number | null;
  totalSold: number;
};

// Cached fetch for pricing tier info (5-minute TTL)
let cachedPricing: { proTier: ProTierInfo; lifetimeTier: LifetimeTierInfo } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchPricing(): Promise<{ proTier: ProTierInfo; lifetimeTier: LifetimeTierInfo }> {
  const now = Date.now();
  if (cachedPricing && now - cacheTimestamp < CACHE_TTL) {
    return cachedPricing;
  }
  const res = await fetch("/api/pricing");
  const data = await res.json();
  cachedPricing = { proTier: data.proTier, lifetimeTier: data.lifetimeTier };
  cacheTimestamp = now;
  return cachedPricing;
}

export async function fetchProTierInfo(): Promise<ProTierInfo> {
  const data = await fetchPricing();
  return data.proTier;
}

export async function fetchLifetimeTierInfo(): Promise<LifetimeTierInfo> {
  const data = await fetchPricing();
  return data.lifetimeTier;
}
