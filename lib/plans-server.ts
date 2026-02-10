// Server-only plans functions
// This file should only be imported in server components and API routes

import { pool } from "./db";
import { PLANS, PlanType } from "./plans";

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
  }
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO subscription ("userId", plan, status, "externalId", "externalCustomerId", "currentPeriodEnd", "createdAt", "updatedAt")
       VALUES ($1, $2, 'active', $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET
         plan = $2,
         status = 'active',
         "externalId" = COALESCE($3, subscription."externalId"),
         "externalCustomerId" = COALESCE($4, subscription."externalCustomerId"),
         "currentPeriodEnd" = COALESCE($5, subscription."currentPeriodEnd"),
         "updatedAt" = NOW()`,
      [userId, plan, options?.externalId || null, options?.externalCustomerId || null, options?.currentPeriodEnd || null]
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
      `SELECT plan, status, "externalId", "externalCustomerId", "currentPeriodEnd"
       FROM subscription WHERE "userId" = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
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
