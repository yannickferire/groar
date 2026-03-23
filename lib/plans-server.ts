// Server-only plans functions
// This file should only be imported in server components and API routes

import { pool } from "./db";
import { PLANS, PlanType, PRO_PRICING_TIERS, LIFETIME_PRICING_TIERS, TRIAL_DURATION_DAYS, type ApiTier } from "./plans";
import { getStartOfWeek } from "./week";

// Get user plan from database (accounts for trial expiration)
export async function getUserPlanFromDB(userId: string): Promise<PlanType> {
  try {
    const result = await pool.query(
      `SELECT plan, status, "trialEnd", "currentPeriodEnd", "billingPeriod" FROM subscription WHERE "userId" = $1`,
      [userId]
    );

    const row = result.rows[0];
    if (!row) return "free";

    const plan = row.plan as PlanType | undefined;

    // Trial expired → treat as free
    if (row.status === "trialing" && row.trialEnd && new Date(row.trialEnd) <= new Date()) {
      return "free";
    }

    // Canceled subscription with expired period → treat as free
    if (row.status === "canceled" && row.billingPeriod !== "lifetime" && row.currentPeriodEnd && new Date(row.currentPeriodEnd) <= new Date()) {
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

// Get the number of active lifetime Pro subscribers (includes friend plan as early adopters)
export async function getLifetimeSubscriberCount(): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM subscription WHERE status = 'active' AND (
        (plan = 'pro' AND "billingPeriod" = 'lifetime')
        OR plan = 'friend'
      )`
    );
    return Math.max(0, parseInt(result.rows[0].count) - 1);
  } catch (error) {
    console.error("Error counting lifetime subscribers:", error);
    return 0;
  }
}

// Helper: find current tier from a pricing tier array and a sold count
function findTier<T extends readonly { price: number; spots: number | null }[]>(
  tiers: T, count: number
): { price: number; spotsLeft: number | null; nextPrice: number | null } {
  let accumulated = 0;
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (tier.spots === null) {
      return { price: tier.price, spotsLeft: null, nextPrice: null };
    }
    accumulated += tier.spots;
    if (count < accumulated) {
      const nextTier = tiers[i + 1];
      return {
        price: tier.price,
        spotsLeft: accumulated - count,
        nextPrice: nextTier ? nextTier.price : null,
      };
    }
  }
  const last = tiers[tiers.length - 1];
  return { price: last.price, spotsLeft: null, nextPrice: null };
}

// Get both tier infos in a single DB call
export async function getPricingTierInfo(): Promise<{
  proTier: { price: number; spotsLeft: number | null; nextPrice: number | null };
  lifetimeTier: { price: number; spotsLeft: number | null; nextPrice: number | null; totalSold: number };
}> {
  const count = await getLifetimeSubscriberCount();
  return {
    proTier: findTier(PRO_PRICING_TIERS, count),
    lifetimeTier: { ...findTier(LIFETIME_PRICING_TIERS, count), totalSold: count },
  };
}

// Count weekly exports for a user, accounting for trial expiration
// For free users whose trial just expired, only count exports made after trial ended
// so exports made during the trial don't consume the free weekly limit
export async function getWeeklyExportCount(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId);
  const plan = await getUserPlanFromDB(userId);

  let countSinceClause = `date_trunc('week', CURRENT_DATE)`;
  const queryParams: (string | Date)[] = [userId];

  if (plan === "free" && subscription?.trialEnd && new Date(subscription.trialEnd) <= new Date()) {
    const trialEndDate = new Date(subscription.trialEnd);
    const weekStart = getStartOfWeek();
    if (trialEndDate > weekStart) {
      countSinceClause = `$2::timestamptz`;
      queryParams.push(trialEndDate);
    }
  }

  const result = await pool.query(
    `SELECT COUNT(*) FROM export WHERE "userId" = $1 AND "createdAt" >= ${countSinceClause}`,
    queryParams
  );
  return parseInt(result.rows[0].count);
}

// Resolve userId from metadata or fallback to email lookup
export async function resolveUserId(userId: string | undefined, email: string): Promise<string | null> {
  if (userId) return userId;
  if (!email) return null;
  const result = await pool.query(
    `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
    [email]
  );
  return result.rows[0]?.id ?? null;
}

// ─── API tier subscription ─────────────────────────────────────────────────

/** Get user's API tier from the api_subscription table */
export async function getUserApiTierFromDB(userId: string): Promise<ApiTier> {
  try {
    const result = await pool.query(
      `SELECT tier, status, "currentPeriodEnd" FROM api_subscription WHERE "userId" = $1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return "free";

    // Canceled with expired period → free
    if (row.status === "canceled" && row.currentPeriodEnd && new Date(row.currentPeriodEnd) <= new Date()) {
      return "free";
    }

    const tier = row.tier as ApiTier;
    if (tier === "growth" || tier === "scale" || tier === "enterprise") return tier;
    return "free";
  } catch (error) {
    console.error("Error fetching user API tier:", error);
    return "free";
  }
}

/** Get full API subscription details (for portal/upgrade logic) */
export async function getUserApiSubscription(userId: string) {
  try {
    const result = await pool.query(
      `SELECT tier, status, "externalId", "externalCustomerId", "currentPeriodStart", "currentPeriodEnd"
       FROM api_subscription WHERE "userId" = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching user API subscription:", error);
    return null;
  }
}

/** Set user's API tier subscription */
export async function setUserApiTier(
  userId: string,
  tier: ApiTier,
  options?: {
    externalId?: string;
    externalCustomerId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO api_subscription ("userId", tier, status, "externalId", "externalCustomerId", "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
       VALUES ($1, $2, 'active', $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET
         tier = $2,
         status = 'active',
         "externalId" = COALESCE($3, api_subscription."externalId"),
         "externalCustomerId" = COALESCE($4, api_subscription."externalCustomerId"),
         "currentPeriodStart" = COALESCE($5, api_subscription."currentPeriodStart"),
         "currentPeriodEnd" = COALESCE($6, api_subscription."currentPeriodEnd"),
         "updatedAt" = NOW()`,
      [userId, tier, options?.externalId || null, options?.externalCustomerId || null, options?.currentPeriodStart || null, options?.currentPeriodEnd || null]
    );
  } catch (error) {
    console.error("Error setting user API tier:", error);
    throw error;
  }
}

/** Cancel user's API tier subscription */
export async function cancelUserApiTier(userId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE api_subscription SET status = 'canceled', "updatedAt" = NOW() WHERE "userId" = $1`,
      [userId]
    );
  } catch (error) {
    console.error("Error canceling API tier:", error);
    throw error;
  }
}

/** Revert user's API tier to free */
export async function revertUserApiTier(userId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE api_subscription SET tier = 'free', status = 'active', "updatedAt" = NOW() WHERE "userId" = $1`,
      [userId]
    );
  } catch (error) {
    console.error("Error reverting API tier:", error);
    throw error;
  }
}

/** Check and update quota notification threshold. Returns the threshold that was just crossed (80, 100, 120) or null if no new threshold. */
export async function checkAndUpdateQuotaThreshold(
  userId: string,
  used: number,
  limit: number
): Promise<80 | 100 | 120 | null> {
  // Determine current threshold
  const pct = (used / limit) * 100;
  let currentThreshold: 0 | 80 | 100 | 120 = 0;
  if (pct >= 120) currentThreshold = 120;
  else if (pct >= 100) currentThreshold = 100;
  else if (pct >= 80) currentThreshold = 80;

  if (currentThreshold === 0) return null;

  try {
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01"; // first of month
    // Update only if this is a new (higher) threshold for this month
    const result = await pool.query(
      `UPDATE api_subscription
       SET "notifiedThreshold" = $2, "notifiedMonth" = $3::date, "updatedAt" = NOW()
       WHERE "userId" = $1
         AND (
           "notifiedMonth" IS NULL
           OR "notifiedMonth" < $3::date
           OR "notifiedThreshold" < $2
         )`,
      [userId, currentThreshold, currentMonth]
    );
    // If rowCount > 0, we just crossed a new threshold
    return (result.rowCount ?? 0) > 0 ? currentThreshold : null;
  } catch (error) {
    console.error("Error checking quota threshold:", error);
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
