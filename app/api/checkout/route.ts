import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PLANS, PlanType } from "@/lib/plans";
import { createCheckoutSession, getPolarProductId, BillingPeriod } from "@/lib/polar";

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
    const billingPeriod = (body.billingPeriod as BillingPeriod) || "monthly";

    // Validate plan
    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Free plans don't need checkout
    if (planKey === "free") {
      return NextResponse.json({ error: "This plan is free" }, { status: 400 });
    }

    const productId = getPolarProductId(planKey as "pro" | "agency", billingPeriod);
    if (!productId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const result = await createCheckoutSession({
      productId,
      successUrl: `${siteUrl}/dashboard?checkout=success&plan=${planKey}`,
      customerEmail: session.user.email,
      metadata: {
        userId: session.user.id,
        plan: planKey,
        billingPeriod,
      },
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: result.url });
  } catch (error: unknown) {
    console.error("Error creating checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create checkout", details: errorMessage }, { status: 500 });
  }
}
