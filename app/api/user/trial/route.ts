import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startTrial, hasUsedTrial, getUserSubscription } from "@/lib/plans-server";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user already has a paid subscription
    const subscription = await getUserSubscription(session.user.id);
    if (subscription && subscription.status === "active" && subscription.plan !== "free") {
      return NextResponse.json({ error: "Already on a paid plan" }, { status: 400 });
    }

    // Check if user has already used their trial
    const usedTrial = await hasUsedTrial(session.user.id);
    if (usedTrial) {
      return NextResponse.json({ error: "Trial already used" }, { status: 400 });
    }

    // Start the trial
    const { trialEnd } = await startTrial(session.user.id);

    return NextResponse.json({ success: true, trialEnd });
  } catch (error) {
    console.error("Error starting trial:", error);
    return NextResponse.json({ error: "Failed to start trial" }, { status: 500 });
  }
}
