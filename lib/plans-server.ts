// Server-only plans functions
// This file should only be imported in server components and API routes

import { pool } from "./db";
import { PLANS, PlanType, PRO_PRICING_TIERS, TRIAL_DURATION_DAYS } from "./plans";

// Get user plan from database (accounts for trial expiration)
export async function getUserPlanFromDB(userId: string): Promise<PlanType> {
  try {
    const result = await pool.query(
      `SELECT plan, status, "trialEnd" FROM subscription WHERE "userId" = $1`,
      [userId]
    );

    const row = result.rows[0];
    if (!row) return "free";

    const plan = row.plan as PlanType | undefined;

    // Trial expired → treat as free
    if (row.status === "trialing" && row.trialEnd && new Date(row.trialEnd) <= new Date()) {
      return "free";
    }

    // Validate that the plan exists in our PLANS config
    if (plan && plan in PLANS) {
      return plan;
    }

    return "free";
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return "free";
  }
}

// Set user plan in database (creates or updates subscription)
export async function setUserPlan(
  userId: string,
  plan: PlanType,
  options?: {
    externalId?: string;
    externalCustomerId?: string;
    currentPeriodEnd?: Date;
    currentPeriodStart?: Date;
    billingPeriod?: string;
  }
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO subscription ("userId", plan, status, "externalId", "externalCustomerId", "currentPeriodEnd", "currentPeriodStart", "billingPeriod", "createdAt", "updatedAt")
       VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET
         plan = $2,
         status = 'active',
         "externalId" = COALESCE($3, subscription."externalId"),
         "externalCustomerId" = COALESCE($4, subscription."externalCustomerId"),
         "currentPeriodEnd" = COALESCE($5, subscription."currentPeriodEnd"),
         "currentPeriodStart" = COALESCE($6, subscription."currentPeriodStart"),
         "billingPeriod" = COALESCE($7, subscription."billingPeriod"),
         "updatedAt" = NOW()`,
      [userId, plan, options?.externalId || null, options?.externalCustomerId || null, options?.currentPeriodEnd || null, options?.currentPeriodStart || null, options?.billingPeriod || null]
    );
  } catch (error) {
    console.error("Error setting user plan:", error);
    throw error;
  }
}

// Get user subscription details (including Polar IDs and trial info)
export async function getUserSubscription(userId: string) {
  try {
    const result = await pool.query(
      `SELECT plan, status, "externalId", "externalCustomerId", "currentPeriodEnd", "currentPeriodStart", "billingPeriod", "trialStart", "trialEnd"
       FROM subscription WHERE "userId" = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

// Start a free trial for a user (3 days of Pro)
// Only succeeds if user has never had a trial (trialStart is null)
export async function startTrial(userId: string): Promise<{ trialEnd: Date }> {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const result = await pool.query(
    `INSERT INTO subscription ("userId", plan, status, "trialStart", "trialEnd", "createdAt", "updatedAt")
     VALUES ($1, 'pro', 'trialing', $2, $3, NOW(), NOW())
     ON CONFLICT ("userId")
     DO UPDATE SET
       plan = 'pro',
       status = 'trialing',
       "trialStart" = $2,
       "trialEnd" = $3,
       "updatedAt" = NOW()
     WHERE subscription."trialStart" IS NULL AND (subscription.plan = 'free' OR subscription.status != 'active')`,
    [userId, now, trialEnd]
  );

  if (result.rowCount === 0) {
    throw new Error("Trial already used or active subscription exists");
  }

  return { trialEnd };
}

// Check if a user has already used their trial
export async function hasUsedTrial(userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT "trialStart" FROM subscription WHERE "userId" = $1`,
    [userId]
  );
  return result.rows[0]?.trialStart != null;
}

// Get the number of active Pro subscribers
export async function getProSubscriberCount(): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM subscription WHERE plan = 'pro' AND status = 'active'`
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error("Error counting pro subscribers:", error);
    return 0;
  }
}

// Compute current Pro tier info from subscriber count
export async function getProTierInfo(): Promise<{
  price: number;
  spotsLeft: number | null;
  nextPrice: number | null;
} | null> {
  const count = await getProSubscriberCount();

  let accumulated = 0;
  for (let i = 0; i < PRO_PRICING_TIERS.length; i++) {
    const tier = PRO_PRICING_TIERS[i];
    if (tier.spots === null) {
      // Final tier, unlimited spots
      return { price: tier.price, spotsLeft: null, nextPrice: null };
    }

    accumulated += tier.spots;
    if (count < accumulated) {
      const spotsLeft = accumulated - count;
      const nextTier = PRO_PRICING_TIERS[i + 1];
      return {
        price: tier.price,
        spotsLeft,
        nextPrice: nextTier ? nextTier.price : null,
      };
    }
  }

  // Shouldn't reach here, but fallback to last tier
  const last = PRO_PRICING_TIERS[PRO_PRICING_TIERS.length - 1];
  return { price: last.price, spotsLeft: null, nextPrice: null };
}

// Cancel user subscription (set status to canceled, keep plan until period end)
export async function cancelUserSubscription(userId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE subscription SET status = 'canceled', "updatedAt" = NOW() WHERE "userId" = $1`,
      [userId]
    );
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}
