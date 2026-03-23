import { requireAuth } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { getUserSubscription, getUserApiSubscription } from "@/lib/plans-server";
import { createPortalSession as polarPortal } from "@/lib/polar";
import { createPortalSession as creemPortal } from "@/lib/creem";

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "creem";

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    // Check if this is an API subscription portal request
    let body: { type?: string } = {};
    try { body = await request.json(); } catch { /* no body = default pro portal */ }

    let externalCustomerId: string | undefined;

    if (body.type === "api") {
      // API tier subscription portal
      const apiSub = await getUserApiSubscription(session.user.id);
      externalCustomerId = apiSub?.externalCustomerId;
      if (!externalCustomerId) {
        return NextResponse.json(
          { error: "No API subscription found. Subscribe to an API plan first." },
          { status: 404 }
        );
      }
    } else {
      // Pro plan portal (existing behavior)
      const subscription = await getUserSubscription(session.user.id);
      externalCustomerId = subscription?.externalCustomerId;
      if (!externalCustomerId) {
        // Fallback: check API subscription
        const apiSub = await getUserApiSubscription(session.user.id);
        externalCustomerId = apiSub?.externalCustomerId;
      }
      if (!externalCustomerId) {
        console.error("No externalCustomerId for user", session.user.id);
        return NextResponse.json(
          { error: "No customer ID found. This subscription was not created through a payment provider (e.g. trial or manually set)." },
          { status: 404 }
        );
      }
    }

    // Use the current provider, but fall back to Polar for existing Polar subscribers
    const result = PAYMENT_PROVIDER === "creem"
      ? await creemPortal(externalCustomerId)
      : await polarPortal(externalCustomerId);

    if ("error" in result) {
      // If Creem fails, try Polar (for existing Polar subscribers)
      if (PAYMENT_PROVIDER === "creem") {
        const fallback = await polarPortal(externalCustomerId);
        if (!("error" in fallback)) {
          return NextResponse.json({ portalUrl: fallback.url });
        }
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ portalUrl: result.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
