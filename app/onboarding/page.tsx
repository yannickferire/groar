"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { PLANS, PlanType, BillingPeriod } from "@/lib/plans";
import PricingCards from "@/components/PricingCards";
import posthog from "posthog-js";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selecting, setSelecting] = useState<PlanType | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | null>(null);

  // If user came from the trial signup modal, skip onboarding and start trial
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("groar-trial-intent") === "true") {
      setRedirecting(true);
      router.replace("/dashboard?trial=start");
    }
  }, [router]);

  // Check if user has already used their free trial
  useEffect(() => {
    fetch("/api/user/plan")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.trialEnd) {
          setHasUsedTrial(true);
        } else {
          setHasUsedTrial(false);
        }
      })
      .catch(() => setHasUsedTrial(false));
  }, []);

  const handleSelectPlan = async (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    setSelecting(planKey);

    posthog.capture("plan_selected", {
      plan: planKey,
      billing_period: billingPeriod || "monthly",
    });

    try {
      if (planKey === "free") {
        // Save free plan to database
        await fetch("/api/user/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planKey }),
        });
        router.push("/dashboard");
      } else if (!hasUsedTrial) {
        // Start free trial — no checkout needed
        router.push("/dashboard?trial=start");
      } else {
        // Trial already used — go to checkout
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

  // Don't flash the onboarding UI while redirecting to trial
  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={2} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-12">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-12">
          <Link href="/dashboard">
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
            {hasUsedTrial ? "Choose your plan" : "Start your free trial"}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {hasUsedTrial
              ? "Pick a plan to unlock all Pro features."
              : "Try Pro free for 3 days — no credit card required."}
          </p>
        </div>

        <PricingCards
          onSelectPlan={handleSelectPlan}
          loadingPlan={selecting}
          showProFeatures={true}
          proHighlighted={true}
          canTrial={!hasUsedTrial}
          ctaLabel={(planKey) => {
            if (planKey === "free") return "Start for free";
            if (!hasUsedTrial) return "Start free trial";
            return `Choose ${PLANS[planKey].name}`;
          }}
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
