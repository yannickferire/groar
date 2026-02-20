import { NextRequest, NextResponse } from "next/server";
import { setUserPlan, cancelUserSubscription, getUserSubscription } from "@/lib/plans-server";
import { getPolarProductId, validateEvent, WebhookVerificationError } from "@/lib/polar";
import { getPostHogClient } from "@/lib/posthog-server";

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

// Derive billing period from Polar product ID
function getBillingPeriodFromProductId(productId: string): "monthly" | "annual" {
  if (productId === getPolarProductId("pro", "annual") || productId === getPolarProductId("agency", "annual")) {
    return "annual";
  }
  return "monthly";
}

// Extract subscription fields from webhook event.data
function parseSubscriptionData(data: Record<string, unknown>) {
  const metadata = (data.metadata ?? {}) as Record<string, string | undefined>;
  return {
    id: data.id as string,
    status: data.status as string,
    productId: (data.product_id ?? data.productId ?? "") as string,
    customerId: (data.customer_id ?? data.customerId ?? "") as string,
    currentPeriodEnd: (data.current_period_end ?? data.currentPeriodEnd) as string | undefined,
    currentPeriodStart: (data.current_period_start ?? data.currentPeriodStart) as string | undefined,
    userId: metadata.userId,
  };
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
        if ((event.data as { status?: string }).status === "succeeded") {
          console.log("Checkout succeeded:", event.data.id);
        }
        break;
      }

      case "subscription.created":
      case "subscription.updated": {
        const sub = parseSubscriptionData(event.data as Record<string, unknown>);

        if (!sub.userId) {
          console.error("No userId in subscription metadata");
          return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const plan = getPlanFromProductId(sub.productId);
        if (!plan) {
          console.error("Unknown product ID:", sub.productId);
          return NextResponse.json({ error: "Unknown product" }, { status: 400 });
        }

        if (sub.status === "active") {
          const billingPeriod = getBillingPeriodFromProductId(sub.productId);

          // Check if this subscription is already active (deduplicate webhooks)
          const existing = await getUserSubscription(sub.userId);
          const isNewActivation = !existing || existing.externalId !== sub.id || existing.status !== "active";

          await setUserPlan(sub.userId, plan, {
            externalId: sub.id,
            externalCustomerId: sub.customerId,
            currentPeriodEnd: sub.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd)
              : undefined,
            currentPeriodStart: sub.currentPeriodStart
              ? new Date(sub.currentPeriodStart)
              : undefined,
            billingPeriod,
          });
          console.log(`Set plan ${plan} (${billingPeriod}) for user ${sub.userId} (subscription: ${sub.id})`);

          // Only track in PostHog if this is a genuinely new activation
          if (isNewActivation) {
            const posthog = getPostHogClient();
            posthog.capture({
              distinctId: sub.userId,
              event: "subscription_activated",
              properties: {
                plan,
                billing_period: billingPeriod,
                subscription_id: sub.id,
                customer_id: sub.customerId,
              },
            });
            await posthog.shutdown();
          }
        }
        break;
      }

      case "subscription.canceled": {
        const sub = parseSubscriptionData(event.data as Record<string, unknown>);

        if (sub.userId) {
          await cancelUserSubscription(sub.userId);
          console.log(`Marked subscription as canceled for user ${sub.userId}`);

          // Track subscription cancellation server-side
          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: sub.userId,
            event: "subscription_canceled",
            properties: {
              subscription_id: sub.id,
              customer_id: sub.customerId,
            },
          });
          await posthog.shutdown();
        }
        break;
      }

      case "subscription.revoked": {
        const sub = parseSubscriptionData(event.data as Record<string, unknown>);

        if (sub.userId) {
          await setUserPlan(sub.userId, "free");
          console.log(`Reverted user ${sub.userId} to free plan (subscription revoked)`);
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
