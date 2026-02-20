"use client";

import { Suspense, useEffect, useState } from "react";
import { PlanType, BillingPeriod, ProTierInfo, TRIAL_DURATION_DAYS } from "@/lib/plans";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FadeInView } from "@/components/ui/motion";
import { authClient } from "@/lib/auth-client";
import PricingCards from "@/components/PricingCards";

function PricingContent() {
  const { data: session } = authClient.useSession();
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [trialChecked, setTrialChecked] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => setProTierInfo(data.proTier))
      .catch(() => {});

    // Check trial status and current plan
    fetch("/api/user/plan")
      .then((res) => {
        if (res.status === 401) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.trialEnd) setHasUsedTrial(true);
        if (data?.plan) setCurrentPlan(data.plan);
        setTrialChecked(true);
      })
      .catch(() => setTrialChecked(true));
  }, []);

  const canTrial = trialChecked && !hasUsedTrial;
  const isProUser = currentPlan === "pro" || currentPlan === "friend";

  const handleSelectPlan = async (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    if (planKey === "free") {
      window.location.href = "/#editor";
      return;
    }

    // Already on this plan → go to dashboard (but allow lifetime upgrade)
    if (currentPlan === planKey) {
      if (planKey === "pro" && billingPeriod === "lifetime") {
        // Pro monthly user wants lifetime → proceed to checkout below
      } else {
        window.location.href = "/dashboard";
        return;
      }
    }

    // Trial flow for Pro (only for free/non-logged-in users)
    if (canTrial && planKey === "pro" && !isProUser) {
      if (!session) {
        // Not logged in → sign up with trial callback
        try { localStorage.setItem("groar-pending-export", "true"); } catch {}
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/dashboard?trial=start")}`;
      } else {
        // Logged in but hasn't used trial → start trial directly
        try {
          await fetch("/api/user/trial", { method: "POST" });
          window.location.href = "/dashboard/editor";
        } catch {
          // Fallback to checkout
          window.location.href = "/dashboard?trial=start";
        }
      }
      return;
    }

    if (!session) {
      const params = new URLSearchParams({ callbackUrl: "/dashboard/plan", plan: planKey });
      if (billingPeriod) params.set("billing", billingPeriod);
      window.location.href = `/login?${params.toString()}`;
      return;
    }

    setUpgrading(planKey);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, billingPeriod: billingPeriod || "monthly" }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      setUpgrading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-8 md:py-16 mt-4 md:mt-10">
        <FadeInView direction="up" distance={32}>
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
        </FadeInView>

        <div className="w-full max-w-5xl">
          <PricingCards
            onSelectPlan={handleSelectPlan}
            currentPlan={isProUser ? currentPlan! : undefined}
            loadingPlan={upgrading}
            animated={true}
            showProFeatures={true}
            proHighlighted={true}
            proTierInfo={proTierInfo}
            canTrial={canTrial}
            ctaLabel={(planKey, billingPeriod) => {
              if (currentPlan === planKey) {
                if (planKey === "pro" && billingPeriod === "lifetime") return "Get lifetime access";
                return planKey === "pro" ? "Dashboard" : "Current plan";
              }
              if (planKey === "free") return "Try for free";
              if (planKey === "pro") {
                return canTrial ? `Start ${TRIAL_DURATION_DAYS}-day free trial` : (billingPeriod === "lifetime" ? "Get lifetime access" : "Claim your spot");
              }
              return "Get started";
            }}
          />
        </div>

      </main>
      <Footer />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
