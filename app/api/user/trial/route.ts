import { requireAuth } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { startTrial, hasUsedTrial, getUserSubscription } from "@/lib/plans-server";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendEmail, newTrialNotificationEmail } from "@/lib/email";
import { inngest } from "@/lib/inngest";

export async function POST() {
  const { session, response } = await requireAuth();
  if (response) return response;

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

    // Track trial start server-side
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: session.user.id,
      event: "trial_started",
      properties: {
        trial_end: trialEnd,
        email: session.user.email,
      },
    });
    await posthog.shutdown();

    // Notify admin
    const notification = newTrialNotificationEmail(
      session.user.name || "Unknown",
      session.user.email || "no email"
    );
    sendEmail({ to: "yannick.ferire@gmail.com", ...notification });

    // Schedule trial reminder emails at exact times
    await inngest.send({
      name: "trial/started",
      data: {
        userId: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "",
        trialEnd,
      },
    });

    return NextResponse.json({ success: true, trialEnd });
  } catch (error) {
    console.error("Error starting trial:", error);
    return NextResponse.json({ error: "Failed to start trial" }, { status: 500 });
  }
}
