import { requireAuth } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/plans-server";
import { createPortalSession as polarPortal } from "@/lib/polar";
import { createPortalSession as creemPortal } from "@/lib/creem";

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "creem";

export async function POST() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const subscription = await getUserSubscription(session.user.id);

    if (!subscription?.externalCustomerId) {
      console.error("No externalCustomerId for user", session.user.id, "subscription:", subscription);
      return NextResponse.json(
        { error: "No customer ID found. This subscription was not created through a payment provider (e.g. trial or manually set)." },
        { status: 404 }
      );
    }

    // Use the current provider, but fall back to Polar for existing Polar subscribers
    const result = PAYMENT_PROVIDER === "creem"
      ? await creemPortal(subscription.externalCustomerId)
      : await polarPortal(subscription.externalCustomerId);

    if ("error" in result) {
      // If Creem fails, try Polar (for existing Polar subscribers)
      if (PAYMENT_PROVIDER === "creem") {
        const fallback = await polarPortal(subscription.externalCustomerId);
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
