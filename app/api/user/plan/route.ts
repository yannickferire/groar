import { requireAuth } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { PLANS, PlanType } from "@/lib/plans";
import { getUserPlanFromDB, getUserSubscription, setUserPlan, getWeeklyExportCount } from "@/lib/plans-server";

const ADMIN_USER_ID = "gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const [plan, subscription, exportsThisWeek] = await Promise.all([
    getUserPlanFromDB(session.user.id),
    getUserSubscription(session.user.id),
    getWeeklyExportCount(session.user.id),
  ]);
  const planDetails = PLANS[plan];

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
    hasExternalSubscription: !!subscription?.externalCustomerId,
    isAdmin: session.user.id === ADMIN_USER_ID,
  });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

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
