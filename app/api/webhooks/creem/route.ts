import { NextRequest, NextResponse } from "next/server";
import { setUserPlan, cancelUserSubscription, getUserSubscription, resolveUserId } from "@/lib/plans-server";
import { getCreemProductId, getBillingPeriodFromProductId, verifyWebhookSignature } from "@/lib/creem";
import { getPostHogClient } from "@/lib/posthog-server";
import { pool } from "@/lib/db";
import { sendEmail, subscriptionConfirmedEmail } from "@/lib/email";

// Report payment to DataFast for revenue attribution
async function reportToDataFast({
  amount,
  currency,
  transactionId,
  datafastVisitorId,
  email,
  customerId,
  renewal,
}: {
  amount: number;
  currency: string;
  transactionId: string;
  datafastVisitorId?: string;
  email?: string;
  customerId?: string;
  renewal?: boolean;
}) {
  const apiKey = process.env.DATAFAST_API_KEY;
  if (!apiKey) return;

  try {
    await fetch("https://datafa.st/api/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        transaction_id: transactionId,
        ...(datafastVisitorId && { datafast_visitor_id: datafastVisitorId }),
        ...(email && { email }),
        ...(customerId && { customer_id: customerId }),
        ...(renewal && { renewal: true }),
      }),
    });
  } catch (err) {
    console.error("DataFast payment report failed:", err);
  }
}

// Map Creem product IDs to plan keys
function getPlanFromProductId(productId: string): "pro" | null {
  if (
    productId === getCreemProductId("pro", "monthly") ||
    productId === getCreemProductId("pro", "lifetime")
  ) {
    return "pro";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("creem-signature") || "";
  const secret = process.env.CREEM_WEBHOOK_SECRET || "";

  // Verify signature
  if (!signature || !secret || !verifyWebhookSignature(body, signature, secret)) {
    console.error("Creem webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: { id: string; eventType: string; object: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const data = event.object;
    console.log("Creem webhook received:", event.eventType, JSON.stringify(data).slice(0, 500));

    switch (event.eventType) {
      case "checkout.completed": {
        // Checkout completed — activate subscription for one-time and recurring
        const product = data.product as Record<string, unknown> | undefined;
        const customer = data.customer as Record<string, unknown> | undefined;
        const subscription = data.subscription as Record<string, unknown> | undefined;
        const order = data.order as Record<string, unknown> | undefined;
        const metadata = (data.metadata ?? {}) as Record<string, string | undefined>;

        const productId = (product?.id ?? "") as string;
        const plan = getPlanFromProductId(productId);
        if (!plan) {
          console.log("Checkout for non-plan product:", productId);
          break;
        }

        const billingPeriod = getBillingPeriodFromProductId(productId);
        const customerEmail = (customer?.email ?? "") as string;
        const customerId = (customer?.id ?? "") as string;
        const userId = await resolveUserId(metadata.userId, customerEmail);

        if (!userId) {
          console.error("Creem checkout: could not resolve user —", { userId: metadata.userId, email: customerEmail });
          return NextResponse.json({ error: "Cannot resolve user" }, { status: 400 });
        }

        const externalId = (subscription?.id ?? order?.id ?? data.id ?? "") as string;

        // Update email if user has no valid email (e.g. Twitter-only signup)
        if (customerEmail && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(customerEmail)) {
          try {
            await pool.query(
              `UPDATE "user" SET email = $1 WHERE id = $2 AND email !~ '^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$'`,
              [customerEmail, userId]
            );
          } catch (emailErr: unknown) {
            // Unique constraint violation — email already used by another account
            console.warn("Creem: could not update user email (likely duplicate):", (emailErr as Error).message);
          }
        }

        await setUserPlan(userId, plan, {
          externalId,
          externalCustomerId: customerId,
          billingPeriod,
          currentPeriodStart: subscription?.currentPeriodStartDate
            ? new Date(subscription.currentPeriodStartDate as string)
            : undefined,
          currentPeriodEnd: subscription?.currentPeriodEndDate
            ? new Date(subscription.currentPeriodEndDate as string)
            : undefined,
        });
        console.log(`Creem checkout: set plan ${plan} (${billingPeriod}) for user ${userId}`);

        // Track revenue
        const amountCents = (order?.amount ?? order?.amountPaid ?? 0) as number;
        if (amountCents > 0) {
          await pool.query(
            `INSERT INTO counter (key, value) VALUES ('total_revenue_cents', $1)
             ON CONFLICT (key) DO UPDATE SET value = counter.value + $1`,
            [amountCents]
          );
        }

        // DataFast revenue attribution
        if (amountCents > 0) {
          const orderCurrency = ((order?.currency ?? "USD") as string).toUpperCase();
          reportToDataFast({
            amount: amountCents / 100,
            currency: orderCurrency,
            transactionId: externalId,
            datafastVisitorId: metadata.datafast_visitor_id,
            email: customerEmail,
            customerId,
          });
        }

        // PostHog
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "subscription_activated",
          properties: { plan, billing_period: billingPeriod, provider: "creem" },
        });
        await posthog.shutdown();

        // Confirmation email
        try {
          const userResult = await pool.query(
            `SELECT email, name, "emailTrialReminders" FROM "user" WHERE id = $1`,
            [userId]
          );
          const user = userResult.rows[0];
          if (user?.email && user.emailTrialReminders !== false) {
            const email = subscriptionConfirmedEmail(user.name || "there", billingPeriod);
            sendEmail({ to: user.email, ...email }).catch(console.error);
          }
        } catch (err) {
          console.error("Failed to send checkout confirmation email:", err);
        }
        break;
      }

      case "subscription.paid": {
        // Recurring payment succeeded — update period dates
        const product = data.product as Record<string, unknown> | undefined;
        const customer = data.customer as Record<string, unknown> | undefined;
        const metadata = (data.metadata ?? {}) as Record<string, string | undefined>;

        const productId = (product?.id ?? "") as string;
        const plan = getPlanFromProductId(productId);
        if (!plan) break;

        const billingPeriod = getBillingPeriodFromProductId(productId);
        const customerEmail = (customer?.email ?? "") as string;
        const userId = await resolveUserId(metadata.userId, customerEmail);
        if (!userId) break;

        const existing = await getUserSubscription(userId);
        const isNewActivation = !existing || existing.externalId !== (data.id as string) || existing.status !== "active";

        await setUserPlan(userId, plan, {
          externalId: data.id as string,
          externalCustomerId: (customer?.id ?? "") as string,
          billingPeriod,
          currentPeriodStart: data.currentPeriodStartDate
            ? new Date(data.currentPeriodStartDate as string)
            : undefined,
          currentPeriodEnd: data.currentPeriodEndDate
            ? new Date(data.currentPeriodEndDate as string)
            : undefined,
        });
        console.log(`Creem subscription.paid: updated plan ${plan} for user ${userId}`);

        // DataFast renewal attribution
        const paidAmountCents = (data.amount ?? 0) as number;
        if (paidAmountCents > 0) {
          const paidCurrency = ((data.currency ?? "USD") as string).toUpperCase();
          reportToDataFast({
            amount: paidAmountCents / 100,
            currency: paidCurrency,
            transactionId: data.id as string,
            email: customerEmail,
            customerId: (customer?.id ?? "") as string,
            renewal: true,
          });
        }

        if (isNewActivation) {
          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: userId,
            event: "subscription_activated",
            properties: { plan, billing_period: billingPeriod, provider: "creem" },
          });
          await posthog.shutdown();
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.scheduled_cancel": {
        const customer = data.customer as Record<string, unknown> | undefined;
        const metadata = (data.metadata ?? {}) as Record<string, string | undefined>;
        const customerEmail = (customer?.email ?? "") as string;
        const userId = await resolveUserId(metadata.userId, customerEmail);

        if (userId) {
          await cancelUserSubscription(userId);
          console.log(`Creem: marked subscription as canceled for user ${userId}`);

          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: userId,
            event: "subscription_canceled",
            properties: { subscription_id: data.id as string, provider: "creem" },
          });
          await posthog.shutdown();
        }
        break;
      }

      case "subscription.expired":
      case "subscription.paused": {
        // Revoke access
        const customer = data.customer as Record<string, unknown> | undefined;
        const metadata = (data.metadata ?? {}) as Record<string, string | undefined>;
        const customerEmail = (customer?.email ?? "") as string;
        const userId = await resolveUserId(metadata.userId, customerEmail);

        if (userId) {
          await setUserPlan(userId, "free");
          console.log(`Creem: reverted user ${userId} to free plan (${event.eventType})`);
        }
        break;
      }

      default:
        console.log(`Creem: unhandled event type: ${event.eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Creem webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
