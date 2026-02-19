import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PLANS, PlanType } from "@/lib/plans";
import { getUserPlanFromDB, getUserSubscription, setUserPlan } from "@/lib/plans-server";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [plan, subscription] = await Promise.all([
    getUserPlanFromDB(session.user.id),
    getUserSubscription(session.user.id),
  ]);
  const planDetails = PLANS[plan];

  // For free users with expired trial, only count exports after trial ended
  let countSinceClause = `date_trunc('week', CURRENT_DATE)`;
  const countParams: (string | Date)[] = [session.user.id];
  if (plan === "free" && subscription?.trialEnd && new Date(subscription.trialEnd) <= new Date()) {
    const trialEndDate = new Date(subscription.trialEnd);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    if (trialEndDate > weekStart) {
      countSinceClause = `$2::timestamptz`;
      countParams.push(trialEndDate);
    }
  }
  const weekExportsResult = await pool.query(
    `SELECT COUNT(*) FROM export WHERE "userId" = $1 AND "createdAt" >= ${countSinceClause}`,
    countParams
  );
  const exportsThisWeek = parseInt(weekExportsResult.rows[0].count);

  const isTrialing = subscription?.status === "trialing" && subscription?.trialEnd && new Date(subscription.trialEnd) > new Date();

  return NextResponse.json({
    plan,
    name: planDetails.name,
    price: planDetails.price,
    features: planDetails.features,
    limits: {
      maxConnectionsPerProvider: planDetails.maxConnectionsPerProvider,
      maxExportsPerWeek: planDetails.maxExportsPerWeek,
    },
    exportsThisWeek,
    status: subscription?.status,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    currentPeriodStart: subscription?.currentPeriodStart,
    billingPeriod: subscription?.billingPeriod,
    isTrialing: !!isTrialing,
    trialEnd: subscription?.trialEnd || null,
    hasUsedTrial: subscription?.trialStart != null,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const planKey = body.plan as PlanType;

    // Validate plan
    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Paid plans must go through checkout via /api/checkout
    if (planKey !== "free") {
      return NextResponse.json({
        error: "Paid plans require checkout",
        checkoutRequired: true,
        plan: planKey
      }, { status: 402 });
    }

    // Save free plan to database
    await setUserPlan(session.user.id, planKey);

    return NextResponse.json({ success: true, plan: planKey });
  } catch (error) {
    console.error("Error setting plan:", error);
    return NextResponse.json({ error: "Failed to set plan" }, { status: 500 });
  }
}
