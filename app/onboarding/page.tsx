"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { PLANS, PlanType, BillingPeriod } from "@/lib/plans";
import PricingCards from "@/components/PricingCards";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selecting, setSelecting] = useState<PlanType | null>(null);

  // If user came from the trial signup modal, skip onboarding and start trial
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("groar-trial-intent") === "true") {
      router.replace("/dashboard?trial=start");
    }
  }, [router]);

  // Note: auto-checkout redirect is now handled by /checkout-redirect page

  const handleSelectPlan = async (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    setSelecting(planKey);

    try {
      if (planKey === "free") {
        // Save free plan to database
        await fetch("/api/user/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planKey }),
        });
        router.push("/dashboard");
      } else {
        // For paid plans, create checkout session and redirect to Polar
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planKey, billingPeriod: billingPeriod || "monthly" }),
        });

        const data = await response.json();

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          console.error("No checkout URL returned:", data);
          setSelecting(null);
        }
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
      setSelecting(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-12">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-12">
          <Link href="/">
            <Image
              src="/groar-logo.png"
              alt="Groar"
              width={280}
              height={75}
              priority
              className="h-auto w-48"
            />
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-3">
            Choose your plan
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start for free and upgrade anytime when you need more.
          </p>
        </div>

        <PricingCards
          onSelectPlan={handleSelectPlan}
          loadingPlan={selecting}
          showProFeatures={true}
          proHighlighted={true}
          ctaLabel={(planKey) => `Choose ${PLANS[planKey].name}`}
        />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={2} className="animate-spin text-muted-foreground" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
