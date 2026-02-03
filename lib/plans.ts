export const PLAN_LIMITS = {
  free: { maxConnectionsPerProvider: 0 },
  pro: { maxConnectionsPerProvider: 1 },
  business: { maxConnectionsPerProvider: 3 },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// TODO: replace with real plan from Stripe/DB
export function getUserPlan(): PlanType {
  return "pro";
}
