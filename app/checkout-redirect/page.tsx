"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { PLANS, PlanType, BillingPeriod } from "@/lib/plans";

const TIMEOUT_MS = 15_000;

function CheckoutRedirectContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const plan = searchParams.get("plan") as PlanType | null;
    const billing = (searchParams.get("billing") as BillingPeriod) || "monthly";

    if (!plan || !(plan in PLANS) || plan === "free") {
      window.location.href = "/onboarding";
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setError(true);
    }, TIMEOUT_MS);

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingPeriod: billing }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.checkoutUrl) {
          window?.datafast?.("checkout_initiated", { plan: plan!, billing });
          window.location.href = data.checkoutUrl;
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="text-muted-foreground">
            Something went wrong loading the checkout.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Button variant="default" onClick={() => window.location.href = "/dashboard/plan"}>
              Go to plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={2} className="animate-spin text-muted-foreground" />
    </div>
  );
}

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={2} className="animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckoutRedirectContent />
    </Suspense>
  );
}
