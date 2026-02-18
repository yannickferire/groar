// Polar API helper
// Server-only - do not import in client components

// Webhook event types
export type PolarWebhookEvent = {
  type: string;
  data: Record<string, unknown>;
};

export type PolarCheckoutEvent = {
  type: "checkout.created" | "checkout.updated";
  data: {
    id: string;
    status: "open" | "expired" | "succeeded";
    customer_email?: string;
    metadata?: {
      userId?: string;
      plan?: string;
    };
  };
};

// API response types
type PolarCheckoutResponse = {
  id: string;
  url: string;
};

type PolarPortalResponse = {
  customer_portal_url: string;
};

// Validate required env vars (webhook secret is handled by Polar SDK directly)
function validateEnv(): { accessToken: string } {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }

  return { accessToken };
}

// Get Polar product ID from env or fallback
import type { BillingPeriod } from "@/lib/plans";
export type { BillingPeriod };

const POLAR_PRODUCT_IDS: Record<string, string> = {
  "pro:monthly": "43027235-0bb3-4ace-86a1-f154a3c6a866",
  "pro:annual": "51c67e06-c8e0-462f-b9c4-64b736a55162",
  "agency:monthly": "29945ded-b994-4dea-8d76-ce3cd1c98a6f",
  "agency:annual": "e878aaaa-1858-4dc9-9e0f-431f27b98e9b"
};

export function getPolarProductId(plan: "pro" | "agency", billingPeriod: BillingPeriod = "monthly"): string | null {
  const envKey = `POLAR_PRODUCT_ID_${plan.toUpperCase()}_${billingPeriod === "annual" ? "ANNUAL" : "MONTHLY"}`;
  const fallbackKey = `${plan}:${billingPeriod}`;
  return process.env[envKey] || POLAR_PRODUCT_IDS[fallbackKey] || null;
}

// Create checkout session
export async function createCheckoutSession(options: {
  productId: string;
  successUrl: string;
  customerEmail: string;
  metadata: Record<string, string>;
}): Promise<{ url: string } | { error: string }> {
  const { accessToken } = validateEnv();

  try {
    const response = await fetch("https://api.polar.sh/v1/checkouts/custom/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        product_id: options.productId,
        success_url: options.successUrl,
        customer_email: options.customerEmail,
        metadata: options.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Polar checkout API error:", error);
      return { error: "Failed to create checkout session" };
    }

    const data: PolarCheckoutResponse = await response.json();
    return { url: data.url };
  } catch (error) {
    console.error("Polar checkout error:", error);
    return { error: "Failed to create checkout session" };
  }
}

// Create customer portal session
export async function createPortalSession(customerId: string): Promise<{ url: string } | { error: string }> {
  const { accessToken } = validateEnv();

  try {
    const response = await fetch("https://api.polar.sh/v1/customer-portal/sessions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        customer_id: customerId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Polar portal API error:", error);
      return { error: "Failed to create portal session" };
    }

    const data: PolarPortalResponse = await response.json();
    return { url: data.customer_portal_url };
  } catch (error) {
    console.error("Polar portal error:", error);
    return { error: "Failed to create portal session" };
  }
}

// Re-export validateEvent from Polar SDK for webhook verification
export { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
