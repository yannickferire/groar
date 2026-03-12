import { requireAuth } from "@/lib/api-auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PLANS, PlanType } from "@/lib/plans";
import type { BillingPeriod } from "@/lib/plans";
import { createCheckoutSession as polarCheckout, getPolarProductId } from "@/lib/polar";
import { createCheckoutSession as creemCheckout, getCreemProductId } from "@/lib/creem";
import { getPostHogClient } from "@/lib/posthog-server";

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "creem";

function getProductId(plan: "pro", billingPeriod: BillingPeriod): string | null {
  return PAYMENT_PROVIDER === "creem"
    ? getCreemProductId(plan, billingPeriod)
    : getPolarProductId(plan, billingPeriod);
}

function createCheckout(options: {
  productId: string;
  successUrl: string;
  customerEmail?: string | null;
  metadata: Record<string, string>;
}) {
  return PAYMENT_PROVIDER === "creem"
    ? creemCheckout(options)
    : polarCheckout(options);
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

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

    const productId = getProductId(planKey as "pro", billingPeriod);
    if (!productId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";
    const cookieStore = await cookies();
    const result = await createCheckout({
      productId,
      successUrl: `${siteUrl}/dashboard?checkout=success&plan=${planKey}`,
      customerEmail: session.user.email && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(session.user.email)
        ? session.user.email
        : undefined,
      metadata: {
        userId: session.user.id,
        plan: planKey,
        billingPeriod,
        ...(cookieStore.get("datafast_visitor_id")?.value && { datafast_visitor_id: cookieStore.get("datafast_visitor_id")!.value }),
        ...(cookieStore.get("datafast_session_id")?.value && { datafast_session_id: cookieStore.get("datafast_session_id")!.value }),
      },
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Track checkout initiation server-side
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: session.user.id,
      event: "checkout_initiated",
      properties: {
        plan: planKey,
        billing_period: billingPeriod,
        $set: {
          email: session.user.email,
          name: session.user.name,
        },
      },
    });
    await posthog.shutdown();

    return NextResponse.json({ checkoutUrl: result.url });
  } catch (error: unknown) {
    console.error("Error creating checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create checkout", details: errorMessage }, { status: 500 });
  }
}
