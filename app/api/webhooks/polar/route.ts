import { NextRequest, NextResponse } from "next/server";
import { setUserPlan, cancelUserSubscription } from "@/lib/plans-server";
import { getPolarProductId, validateEvent, WebhookVerificationError } from "@/lib/polar";
import type { PolarSubscriptionEvent } from "@/lib/polar";

// Map Polar product IDs to plan keys (check both monthly and annual)
function getPlanFromProductId(productId: string): "pro" | "agency" | null {
  if (productId === getPolarProductId("pro", "monthly") || productId === getPolarProductId("pro", "annual")) {
    return "pro";
  }
  if (productId === getPolarProductId("agency", "monthly") || productId === getPolarProductId("agency", "annual")) {
    return "agency";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Verify signature and parse event using Polar SDK
  let event;
  try {
    event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET || "");
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error("Webhook signature verification failed:", error.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    throw error;
  }

  try {
    switch (event.type) {
      case "checkout.created": {
        console.log("Checkout created:", event.data.id);
        break;
      }

      case "checkout.updated": {
        const checkout = event.data as { id: string; status: string };
        if (checkout.status === "succeeded") {
          console.log("Checkout succeeded:", checkout.id);
        }
        break;
      }

      case "subscription.created":
      case "subscription.updated": {
        const subscription = (event as PolarSubscriptionEvent).data;
        const userId = subscription.metadata?.userId;
        const productId = subscription.product_id;

        if (!userId) {
          console.error("No userId in subscription metadata");
          return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const plan = getPlanFromProductId(productId);
        if (!plan) {
          console.error("Unknown product ID:", productId);
          return NextResponse.json({ error: "Unknown product" }, { status: 400 });
        }

        if (subscription.status === "active") {
          await setUserPlan(userId, plan, {
            externalId: subscription.id,
            externalCustomerId: subscription.customer_id,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end)
              : undefined,
          });
          console.log(`Set plan ${plan} for user ${userId} (subscription: ${subscription.id})`);
        }
        break;
      }

      case "subscription.canceled": {
        const subscription = (event as PolarSubscriptionEvent).data;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await cancelUserSubscription(userId);
          console.log(`Marked subscription as canceled for user ${userId}`);
        }
        break;
      }

      case "subscription.revoked": {
        const subscription = (event as PolarSubscriptionEvent).data;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await setUserPlan(userId, "free");
          console.log(`Reverted user ${userId} to free plan (subscription revoked)`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
