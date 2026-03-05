import { NextRequest, NextResponse } from "next/server";
import { setUserPlan, cancelUserSubscription, getUserSubscription, resolveUserId } from "@/lib/plans-server";
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
  const customer = (data.customer ?? {}) as Record<string, unknown>;
  return {
    id: data.id as string,
    status: data.status as string,
    productId: (data.product_id ?? data.productId ?? "") as string,
    customerId: (data.customer_id ?? data.customerId ?? "") as string,
    customerEmail: (customer.email ?? data.customer_email ?? "") as string,
    amountCents: (data.amount ?? data.recurring_amount ?? 0) as number,
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
  // Amount in cents from order items or top-level
  const amountCents = items.length > 0
    ? ((items[0].amount ?? 0) as number)
    : ((data.amount ?? 0) as number);
  return {
    id: data.id as string,
    productId,
    amountCents,
    customerId: (data.customer_id ?? data.customerId ?? customer.id ?? "") as string,
    customerEmail: (customer.email ?? data.customer_email ?? "") as string,
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

        // Track revenue
        if (order.amountCents > 0) {
          await pool.query(
            `INSERT INTO counter (key, value) VALUES ('total_revenue_cents', $1)
             ON CONFLICT (key) DO UPDATE SET value = counter.value + $1`,
            [order.amountCents]
          );
        }

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
            `SELECT email, name, "emailTrialReminders" FROM "user" WHERE id = $1`,
            [orderUserId]
          );
          const user = userResult.rows[0];
          if (user?.email && user.emailTrialReminders !== false) {
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

        const subUserId = await resolveUserId(sub.userId, sub.customerEmail);
        if (!subUserId) {
          console.error("Subscription: could not resolve user —", { userId: sub.userId, email: sub.customerEmail });
          return NextResponse.json({ error: "Cannot resolve user" }, { status: 400 });
        }

        const plan = getPlanFromProductId(sub.productId);
        if (!plan) {
          console.error("Unknown product ID:", sub.productId);
          return NextResponse.json({ error: "Unknown product" }, { status: 400 });
        }

        if (sub.status === "active") {
          const billingPeriod = getBillingPeriodFromProductId(sub.productId);

          // Check if this subscription is already active (deduplicate webhooks)
          const existing = await getUserSubscription(subUserId);
          const isNewActivation = !existing || existing.externalId !== sub.id || existing.status !== "active";

          await setUserPlan(subUserId, plan, {
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
          console.log(`Set plan ${plan} (${billingPeriod}) for user ${subUserId} (subscription: ${sub.id})`);

          // Track revenue for new activations
          if (isNewActivation && sub.amountCents > 0) {
            await pool.query(
              `INSERT INTO counter (key, value) VALUES ('total_revenue_cents', $1)
               ON CONFLICT (key) DO UPDATE SET value = counter.value + $1`,
              [sub.amountCents]
            );
          }

          // Only track in PostHog + send email if this is a genuinely new activation
          if (isNewActivation) {
            const posthog = getPostHogClient();
            posthog.capture({
              distinctId: subUserId,
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
                `SELECT email, name, "emailTrialReminders" FROM "user" WHERE id = $1`,
                [subUserId]
              );
              const user = userResult.rows[0];
              if (user?.email && user.emailTrialReminders !== false) {
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
        const cancelUserId = await resolveUserId(sub.userId, sub.customerEmail);

        if (cancelUserId) {
          await cancelUserSubscription(cancelUserId);
          console.log(`Marked subscription as canceled for user ${cancelUserId}`);

          // Track subscription cancellation server-side
          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: cancelUserId,
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
        const revokeUserId = await resolveUserId(sub.userId, sub.customerEmail);

        if (revokeUserId) {
          await setUserPlan(revokeUserId, "free");
          console.log(`Reverted user ${revokeUserId} to free plan (subscription revoked)`);
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
