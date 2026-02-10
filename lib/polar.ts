// Polar API helper
// Server-only - do not import in client components

// Webhook event types
export type PolarWebhookEvent = {
  type: string;
  data: Record<string, unknown>;
};

export type PolarSubscriptionEvent = {
  type: "subscription.created" | "subscription.updated" | "subscription.canceled" | "subscription.revoked";
  data: {
    id: string;
    status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "trialing" | "unpaid";
    product_id: string;
    customer_id: string;
    current_period_end?: string;
    metadata?: {
      userId?: string;
      plan?: string;
    };
  };
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

// Validate required env vars
function validateEnv(): { accessToken: string; webhookSecret: string } {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }
  if (!webhookSecret) {
    throw new Error("POLAR_WEBHOOK_SECRET is not configured");
  }

  return { accessToken, webhookSecret };
}

// Get Polar product ID from env or fallback
export function getPolarProductId(plan: "pro" | "agency"): string | null {
  if (plan === "pro") {
    return process.env.POLAR_PRODUCT_ID_PRO || "43027235-0bb3-4ace-86a1-f154a3c6a866";
  }
  if (plan === "agency") {
    return process.env.POLAR_PRODUCT_ID_AGENCY || "29945ded-b994-4dea-8d76-ce3cd1c98a6f";
  }
  return null;
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

// Verify webhook signature
import crypto from "crypto";

export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    const { webhookSecret } = validateEnv();

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Parse webhook body safely
export function parseWebhookBody(body: string): PolarWebhookEvent | null {
  try {
    return JSON.parse(body) as PolarWebhookEvent;
  } catch {
    console.error("Failed to parse webhook body as JSON");
    return null;
  }
}
