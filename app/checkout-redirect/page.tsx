"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { PLANS, PlanType, BillingPeriod } from "@/lib/plans";

function CheckoutRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get("plan") as PlanType | null;
    const billing = (searchParams.get("billing") as BillingPeriod) || "monthly";

    if (!plan || !(plan in PLANS) || plan === "free") {
      window.location.href = "/onboarding";
      return;
    }

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingPeriod: billing }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          // Fallback to onboarding if checkout fails
          window.location.href = `/onboarding?plan=${plan}&billing=${billing}`;
        }
      })
      .catch(() => {
        window.location.href = `/onboarding?plan=${plan}&billing=${billing}`;
      });
  }, [searchParams]);

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
