// Client-safe plans configuration
// For server-side functions, use lib/plans-server.ts
// For Polar integration, use lib/polar.ts

import {
  Setting06Icon,
  Clock01Icon,
  Link01Icon,
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
    maxExportsPerDay: 3,
    features: [
      "Full access to the editor",
      "3 exports per day",
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
    maxConnectionsPerProvider: 2,
    maxExportsPerDay: null, // unlimited
    features: [
      "Unlimited exports",
      "Unlimited backgrounds",
      "No watermark",
      "Connect 2 accounts per platform",
    ],
  },
  agency: {
    name: "Agency",
    subtitle: "for your clients",
    price: 19,
    maxConnectionsPerProvider: 10,
    maxExportsPerDay: null, // unlimited
    features: [
      "Everything in Pro",
      "Connect 10 accounts per platform",
      "Brand presets per client",
      "Priority support",
    ],
  },
  friend: {
    name: "Friend",
    price: 0,
    maxConnectionsPerProvider: 999, // unlimited
    maxExportsPerDay: null, // unlimited
    features: [
      "Everything in Agency",
      "Gift plan",
      "Unlimited everything",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

// Helper to get limits (backward compatible)
export const PLAN_LIMITS = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [
    key,
    {
      maxConnectionsPerProvider: plan.maxConnectionsPerProvider,
      maxExportsPerDay: plan.maxExportsPerDay,
    },
  ])
) as Record<PlanType, { maxConnectionsPerProvider: number; maxExportsPerDay: number | null }>;

export const PLAN_ORDER: PlanType[] = ["free", "pro", "agency"];

export const PRO_FEATURES: { icon: IconSvgElement; title: string; description: string }[] = [
  { icon: Layout01Icon, title: "Templates", description: "All templates unlocked" },
  { icon: Image01Icon, title: "More backgrounds", description: "Full background library" },
  { icon: Link01Icon, title: "Connect accounts", description: "Auto-fetch your metrics" },
  { icon: Setting06Icon, title: "Brand customization", description: "Remove watermark, custom style" },
  { icon: Clock01Icon, title: "History", description: "Re-import past visuals" },
  { icon: ChromeIcon, title: "Chrome extension", description: "Coming soon to fetch all your metrics" },
];

export const PRO_CHECKS: string[] = [
  "No watermark",
  "Unlimited exports",
  "Connect 2 accounts per platform",
];

// Annual pricing
export const ANNUAL_DISCOUNT = 0.2; // 20% off
export type BillingPeriod = "monthly" | "annual";

export function getAnnualPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
}

export function getAnnualMonthlyPrice(monthlyPrice: number): number {
  return Math.round((monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT)) / 12);
}

// Early adopter pricing tiers for Pro plan
// Update currentTier index manually as you hit each tier
export const PRO_PRICING_TIERS = [
  { price: 5, spots: 8 },
  { price: 6, spots: 12 },
  { price: 7, spots: 18 },
  { price: 8, spots: 22 },
  { price: 9, spots: null }, // final price, unlimited
] as const;

export const CURRENT_PRO_TIER = 0; // change this as you move through tiers

// Current Pro price derived from tier — single source of truth
export const CURRENT_PRO_PRICE = PRO_PRICING_TIERS[CURRENT_PRO_TIER].price;
