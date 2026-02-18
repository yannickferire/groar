// Server-only plans functions
// This file should only be imported in server components and API routes

import { pool } from "./db";
import { PLANS, PlanType, PRO_PRICING_TIERS } from "./plans";

// Get user plan from database
export async function getUserPlanFromDB(userId: string): Promise<PlanType> {
  try {
    const result = await pool.query(
      `SELECT plan FROM subscription WHERE "userId" = $1`,
      [userId]
    );

    const plan = result.rows[0]?.plan as PlanType | undefined;

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

// Get user subscription details (including Polar IDs)
export async function getUserSubscription(userId: string) {
  try {
    const result = await pool.query(
      `SELECT plan, status, "externalId", "externalCustomerId", "currentPeriodEnd", "currentPeriodStart", "billingPeriod"
       FROM subscription WHERE "userId" = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
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
