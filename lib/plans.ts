// Client-safe plans configuration
// For server-side functions, use lib/plans-server.ts
// For Polar integration, use lib/polar.ts

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxConnectionsPerProvider: 0,
    maxExportsPerDay: 3,
    features: [
      "3 exports per day",
      "Limited backgrounds",
      "Groar watermark",
    ],
  },
  pro: {
    name: "Pro",
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
    price: 20,
    maxConnectionsPerProvider: 10,
    maxExportsPerDay: null, // unlimited
    features: [
      "Everything in Pro",
      "Connect 10 accounts per platform",
      "Priority support",
      "Early access to new features",
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
