// Client-safe plans configuration
// For server-side functions, use lib/plans-server.ts
// For Polar integration, use lib/polar.ts

import {
  Setting06Icon,
  Clock01Icon,
  Image01Icon,
  Layout01Icon,
  ChromeIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export const PLANS = {
  free: {
    name: "Free",
    subtitle: "for hobby growers",
    price: 0,
    maxConnectionsPerProvider: 0,
    maxExportsPerWeek: 1,
    features: [
      "Full access to the editor",
      "1 export per week",
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

export const PRO_FEATURES: { icon: IconSvgElement; title: string }[] = [
  { icon: Layout01Icon, title: "All templates unlocked" },
  { icon: Image01Icon, title: "Full background library" },
  { icon: Setting06Icon, title: "Custom branding & no watermark" },
  { icon: Clock01Icon, title: "Export history & re-import" },
  { icon: ChromeIcon, title: "Chrome extension (coming soon)" },
];

export const PRO_CHECKS: string[] = [
  "No watermark",
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
