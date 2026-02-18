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

  const [plan, subscription, todayExportsResult] = await Promise.all([
    getUserPlanFromDB(session.user.id),
    getUserSubscription(session.user.id),
    pool.query(
      `SELECT COUNT(*) FROM export WHERE "userId" = $1 AND "createdAt" >= CURRENT_DATE`,
      [session.user.id]
    ),
  ]);
  const planDetails = PLANS[plan];
  const exportsToday = parseInt(todayExportsResult.rows[0].count);

  return NextResponse.json({
    plan,
    name: planDetails.name,
    price: planDetails.price,
    features: planDetails.features,
    limits: {
      maxConnectionsPerProvider: planDetails.maxConnectionsPerProvider,
      maxExportsPerDay: planDetails.maxExportsPerDay,
    },
    exportsToday,
    status: subscription?.status,
    currentPeriodEnd: subscription?.currentPeriodEnd,
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
