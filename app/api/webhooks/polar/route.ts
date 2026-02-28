import { NextRequest, NextResponse } from "next/server";
import { setUserPlan, cancelUserSubscription, getUserSubscription } from "@/lib/plans-server";
import { getPolarProductId, validateEvent, WebhookVerificationError } from "@/lib/polar";
import { getPostHogClient } from "@/lib/posthog-server";
import { pool } from "@/lib/db";
import { sendEmail, subscriptionConfirmedEmail } from "@/lib/email";

// Map Polar product IDs to plan keys
function getPlanFromProductId(productId: string): "pro" | null {
  if (
    productId === getPolarProductId("pro", "monthly") ||
    productId === getPolarProductId("pro", "lifetime")
  ) {
    return "pro";
  }
  return null;
}

// Derive billing period from Polar product ID
function getBillingPeriodFromProductId(productId: string): "monthly" | "lifetime" {
  if (productId === getPolarProductId("pro", "lifetime")) {
    return "lifetime";
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

// Extract order fields from webhook event.data (one-time purchases)
function parseOrderData(data: Record<string, unknown>) {
  const metadata = (data.metadata ?? {}) as Record<string, string | undefined>;
  const customer = (data.customer ?? {}) as Record<string, unknown>;
  // Product ID from order items
  const items = (data.items ?? data.order_items ?? []) as Array<Record<string, unknown>>;
  const productId = items.length > 0
    ? ((items[0].product_id ?? items[0].productId ?? "") as string)
    : ((data.product_id ?? data.productId ?? "") as string);
  return {
    id: data.id as string,
    productId,
    customerId: (data.customer_id ?? data.customerId ?? customer.id ?? "") as string,
    customerEmail: (customer.email ?? data.customer_email ?? "") as string,
    userId: metadata.userId,
  };
}

// Resolve userId from metadata or fallback to email lookup
async function resolveUserId(userId: string | undefined, email: string): Promise<string | null> {
  if (userId) return userId;
  if (!email) return null;
  const result = await pool.query(
    `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
    [email]
  );
  return result.rows[0]?.id ?? null;
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
    console.log("Polar webhook received:", event.type, JSON.stringify(event.data).slice(0, 500));

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

      case "order.created": {
        const order = parseOrderData(event.data as Record<string, unknown>);
        console.log("Order parsed:", JSON.stringify(order));
        const plan = getPlanFromProductId(order.productId);
        if (!plan) {
          console.log("Order for non-plan product:", order.productId);
          break;
        }

        const billingPeriod = getBillingPeriodFromProductId(order.productId);
        const orderUserId = await resolveUserId(order.userId, order.customerEmail);

        if (!orderUserId) {
          console.error("Order: could not resolve user —", { userId: order.userId, email: order.customerEmail });
          return NextResponse.json({ error: "Cannot resolve user" }, { status: 400 });
        }

        await setUserPlan(orderUserId, plan, {
          externalId: order.id,
          externalCustomerId: order.customerId,
          billingPeriod,
        });
        console.log(`Order: set plan ${plan} (${billingPeriod}) for user ${orderUserId} (order: ${order.id})`);

        // PostHog + confirmation email
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: orderUserId,
          event: "subscription_activated",
          properties: { plan, billing_period: billingPeriod, order_id: order.id },
        });
        await posthog.shutdown();

        try {
          const userResult = await pool.query(
            `SELECT email, name FROM "user" WHERE id = $1`,
            [orderUserId]
          );
          const user = userResult.rows[0];
          if (user?.email) {
            const email = subscriptionConfirmedEmail(user.name || "there", billingPeriod);
            sendEmail({ to: user.email, ...email }).catch(console.error);
          }
        } catch (err) {
          console.error("Failed to send order confirmation email:", err);
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

          // Only track in PostHog + send email if this is a genuinely new activation
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

            // Send subscription confirmed email
            try {
              const userResult = await pool.query(
                `SELECT email, name FROM "user" WHERE id = $1`,
                [sub.userId]
              );
              const user = userResult.rows[0];
              if (user?.email) {
                const email = subscriptionConfirmedEmail(user.name || "there", billingPeriod);
                sendEmail({ to: user.email, ...email }).catch(console.error);
              }
            } catch (err) {
              console.error("Failed to send subscription email:", err);
            }
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
