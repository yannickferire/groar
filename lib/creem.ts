// Creem API helper
// Server-only - do not import in client components

import { createCreem } from "creem_io";
import type { BillingPeriod } from "@/lib/plans";
import crypto from "crypto";

export type { BillingPeriod };

// Creem SDK instance (lazy init)
let _creem: ReturnType<typeof createCreem> | null = null;

function getCreem() {
  if (!_creem) {
    const apiKey = process.env.CREEM_API_KEY;
    if (!apiKey) throw new Error("CREEM_API_KEY is not configured");
    _creem = createCreem({
      apiKey,
      testMode: apiKey.startsWith("creem_test_"),
    });
  }
  return _creem;
}

// Product IDs from env vars
const CREEM_PRODUCT_IDS: Record<string, string | undefined> = {
  "pro:monthly": process.env.CREEM_PRODUCT_ID_PRO_MONTHLY,
  "pro:lifetime": process.env.CREEM_PRODUCT_ID_PRO_LIFETIME,
};

// API tier product IDs (Creem)
const CREEM_API_TIER_PRODUCT_IDS: Record<string, string | undefined> = {
  growth: process.env.CREEM_PRODUCT_ID_API_GROWTH,
  scale: process.env.CREEM_PRODUCT_ID_API_SCALE,
};

export function getCreemProductId(plan: "pro", billingPeriod: BillingPeriod = "monthly"): string | null {
  return CREEM_PRODUCT_IDS[`${plan}:${billingPeriod}`] || null;
}

export function getCreemApiTierProductId(tier: "growth" | "scale"): string | null {
  return CREEM_API_TIER_PRODUCT_IDS[tier] || null;
}

// Derive billing period from Creem product ID
export function getBillingPeriodFromProductId(productId: string): "monthly" | "lifetime" {
  if (productId === CREEM_PRODUCT_IDS["pro:lifetime"]) return "lifetime";
  return "monthly";
}

// Create checkout session
export async function createCheckoutSession(options: {
  productId: string;
  successUrl: string;
  customerEmail?: string | null;
  metadata: Record<string, string>;
}): Promise<{ url: string } | { error: string }> {
  try {
    const creem = getCreem();
    const checkout = await creem.checkouts.create({
      productId: options.productId,
      successUrl: options.successUrl,
      ...(options.customerEmail ? { customer: { email: options.customerEmail } } : {}),
      metadata: options.metadata,
    });

    if (!checkout.checkoutUrl) {
      return { error: "No checkout URL returned" };
    }

    return { url: checkout.checkoutUrl };
  } catch (error) {
    console.error("Creem checkout error:", error);
    return { error: "Failed to create checkout session" };
  }
}

// Create customer portal session
export async function createPortalSession(customerId: string): Promise<{ url: string } | { error: string }> {
  try {
    const creem = getCreem();
    const links = await creem.customers.createPortal({ customerId });
    return { url: links.customerPortalLink };
  } catch (error) {
    console.error("Creem portal error:", error);
    return { error: "Failed to create portal session" };
  }
}

// Upgrade an existing subscription to a new product (with proration)
export async function upgradeSubscription(subscriptionId: string, newProductId: string): Promise<{ success: true } | { error: string }> {
  try {
    const creem = getCreem();
    await creem.subscriptions.upgrade({
      subscriptionId,
      productId: newProductId,
      updateBehavior: "proration-charge-immediately",
    });
    return { success: true };
  } catch (error) {
    console.error("Creem upgrade error:", error);
    return { error: "Failed to upgrade subscription" };
  }
}

// Verify webhook signature (HMAC-SHA256)
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}
