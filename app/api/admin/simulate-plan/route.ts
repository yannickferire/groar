import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

type SimulatedState =
  | "pro_monthly"
  | "pro_lifetime"
  | "friend"
  | "trial"
  | "free_after_trial"
  | "free_never_trialed"
  | "canceled_active"   // canceled but still in billing period
  | "canceled_expired"; // canceled and billing period ended

// GET — return current simulated state
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT plan, status, "trialStart", "trialEnd", "billingPeriod", "currentPeriodEnd", "externalCustomerId"
     FROM subscription WHERE "userId" = $1`,
    [session.user.id]
  );

  const row = result.rows[0];
  if (!row) return NextResponse.json({ state: "free_never_trialed" });

  // Determine current state
  let state: SimulatedState = "free_never_trialed";
  if (row.plan === "friend") {
    state = "friend";
  } else if (row.status === "trialing") {
    state = row.trialEnd && new Date(row.trialEnd) > new Date() ? "trial" : "free_after_trial";
  } else if (row.status === "canceled") {
    state = row.currentPeriodEnd && new Date(row.currentPeriodEnd) > new Date()
      ? "canceled_active"
      : "canceled_expired";
  } else if (row.status === "active" && row.plan === "pro") {
    state = row.billingPeriod === "lifetime" ? "pro_lifetime" : "pro_monthly";
  }

  return NextResponse.json({ state, subscription: row });
}

// POST — switch to a simulated state
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { state } = await request.json() as { state: SimulatedState };

  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
  const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -1 day

  // Base upsert — all fields set explicitly to avoid leftover state
  const upsert = async (fields: Record<string, unknown>) => {
    const defaults = {
      plan: "free",
      status: "active",
      trialStart: null,
      trialEnd: null,
      billingPeriod: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      externalId: null,
      externalCustomerId: null,
    };
    const merged = { ...defaults, ...fields };
    await pool.query(
      `INSERT INTO subscription (
        "userId", plan, status, "trialStart", "trialEnd", "billingPeriod",
        "currentPeriodStart", "currentPeriodEnd", "externalId", "externalCustomerId",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        plan = $2, status = $3, "trialStart" = $4, "trialEnd" = $5,
        "billingPeriod" = $6, "currentPeriodStart" = $7, "currentPeriodEnd" = $8,
        "externalId" = $9, "externalCustomerId" = $10, "updatedAt" = NOW()`,
      [
        session.user.id,
        merged.plan, merged.status, merged.trialStart, merged.trialEnd,
        merged.billingPeriod, merged.currentPeriodStart, merged.currentPeriodEnd,
        merged.externalId, merged.externalCustomerId,
      ]
    );
  };

  switch (state) {
    case "pro_monthly":
      await upsert({
        plan: "pro",
        status: "active",
        billingPeriod: "monthly",
        currentPeriodStart: now,
        currentPeriodEnd: future,
        externalCustomerId: "sim_monthly",
      });
      break;

    case "pro_lifetime":
      await upsert({
        plan: "pro",
        status: "active",
        billingPeriod: "lifetime",
        externalCustomerId: "sim_lifetime",
      });
      break;

    case "friend":
      await upsert({
        plan: "friend",
        status: "active",
      });
      break;

    case "trial":
      await upsert({
        plan: "pro",
        status: "trialing",
        trialStart: now,
        trialEnd: new Date(now.getTime() + TRIAL_DURATION_MS),
      });
      break;

    case "free_after_trial":
      await upsert({
        plan: "pro",
        status: "trialing",
        trialStart: new Date(now.getTime() - TRIAL_DURATION_MS - 86400000),
        trialEnd: past,
      });
      break;

    case "free_never_trialed":
      // Delete subscription row entirely
      await pool.query(
        `DELETE FROM subscription WHERE "userId" = $1`,
        [session.user.id]
      );
      return NextResponse.json({ success: true, state });

    case "canceled_active":
      await upsert({
        plan: "pro",
        status: "canceled",
        billingPeriod: "monthly",
        currentPeriodStart: now,
        currentPeriodEnd: future,
        externalCustomerId: "sim_canceled",
      });
      break;

    case "canceled_expired":
      await upsert({
        plan: "pro",
        status: "canceled",
        billingPeriod: "monthly",
        currentPeriodStart: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: past,
        externalCustomerId: "sim_canceled_expired",
      });
      break;

    default:
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  return NextResponse.json({ success: true, state });
}
