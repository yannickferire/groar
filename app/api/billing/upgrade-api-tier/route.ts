import { requireAuth } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { getUserApiSubscription } from "@/lib/plans-server";
import { upgradeSubscription, getCreemApiTierProductId } from "@/lib/creem";
import { getPostHogClient } from "@/lib/posthog-server";
import type { ApiTier } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await request.json();
    const targetTier = body.tier as ApiTier;

    if (targetTier !== "scale") {
      return NextResponse.json({ error: "Can only upgrade to scale" }, { status: 400 });
    }

    const sub = await getUserApiSubscription(session.user.id);
    if (!sub || sub.status !== "active" || !sub.externalId) {
      return NextResponse.json(
        { error: "No active API subscription to upgrade" },
        { status: 400 }
      );
    }

    if (sub.tier === "scale") {
      return NextResponse.json({ error: "Already on scale tier" }, { status: 400 });
    }

    const newProductId = getCreemApiTierProductId("scale");
    if (!newProductId) {
      return NextResponse.json({ error: "Scale product not configured" }, { status: 500 });
    }

    const result = await upgradeSubscription(sub.externalId, newProductId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // PostHog tracking
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: session.user.id,
      event: "api_tier_upgraded",
      properties: { from: sub.tier, to: targetTier, provider: "creem" },
    });
    await posthog.shutdown();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error upgrading API tier:", error);
    return NextResponse.json({ error: "Failed to upgrade API tier" }, { status: 500 });
  }
}
