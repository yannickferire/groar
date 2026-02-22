import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/plans-server";
import { createPortalSession } from "@/lib/polar";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await getUserSubscription(session.user.id);

    if (!subscription?.externalCustomerId) {
      console.error("No externalCustomerId for user", session.user.id, "subscription:", subscription);
      return NextResponse.json(
        { error: "No Polar customer ID found. This subscription was not created through Polar (e.g. trial or manually set)." },
        { status: 404 }
      );
    }

    const result = await createPortalSession(subscription.externalCustomerId);

    if ("error" in result) {
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
