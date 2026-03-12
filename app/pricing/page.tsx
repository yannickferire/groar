"use client";

import { Suspense, useEffect, useState } from "react";
import { PlanType, BillingPeriod, ProTierInfo, LifetimeTierInfo, TRIAL_DURATION_DAYS, fetchProTierInfo, fetchLifetimeTierInfo } from "@/lib/plans";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FadeInView } from "@/components/ui/motion";
import { authClient } from "@/lib/auth-client";
import PricingCards from "@/components/PricingCards";
import Testimonials from "@/components/Testimonials";
import VsFaq from "@/components/VsFaq";
import { faqs } from "@/lib/faqs";

function PricingContent() {
  const { data: session } = authClient.useSession();
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);
  const [lifetimeTierInfo, setLifetimeTierInfo] = useState<LifetimeTierInfo | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [trialChecked, setTrialChecked] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [userBillingPeriod, setUserBillingPeriod] = useState<BillingPeriod | null>(null);

  useEffect(() => {
    fetchProTierInfo().then(setProTierInfo).catch(() => {});
    fetchLifetimeTierInfo().then(setLifetimeTierInfo).catch(() => {});

    // Check trial status and current plan
    fetch("/api/user/plan")
      .then((res) => {
        if (res.status === 401) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.hasUsedTrial) setHasUsedTrial(true);
        if (data?.plan) setCurrentPlan(data.plan);
        if (data?.billingPeriod) setUserBillingPeriod(data.billingPeriod);
        setTrialChecked(true);
      })
      .catch(() => setTrialChecked(true));
  }, []);

  const canTrial = trialChecked && !hasUsedTrial;
  const isProUser = currentPlan === "pro" || currentPlan === "friend";
  const isUserLifetime = currentPlan === "pro" && userBillingPeriod === "lifetime";

  const handleSelectPlan = async (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    if (planKey === "free") {
      if (session) {
        window.location.href = "/dashboard/editor";
      } else {
        window.location.href = "/login";
      }
      return;
    }

    // Lifetime user clicking pro → go to dashboard
    if (isUserLifetime && planKey === "pro") {
      window.location.href = "/dashboard/plan#plans";
      return;
    }

    // Already on this plan → go to dashboard (but allow lifetime upgrade)
    if (currentPlan === planKey) {
      if (planKey === "pro" && billingPeriod === "lifetime") {
        // Pro monthly user wants lifetime → proceed to checkout below
      } else {
        window.location.href = "/dashboard/plan#plans";
        return;
      }
    }

    // Trial flow for Pro (only for free/non-logged-in users)
    if (canTrial && planKey === "pro" && !isProUser) {
      if (!session) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/dashboard?trial=start")}`;
      } else {
        try {
          await fetch("/api/user/trial", { method: "POST" });
          window?.datafast?.("trial_started");
          window.location.href = "/dashboard/editor";
        } catch {
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
        window?.datafast?.("checkout_initiated", { plan: planKey, billing: billingPeriod || "monthly" });
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
      <main className="flex-1 flex flex-col items-center justify-center py-8 md:py-16 mt-4 gap-24">
        <FadeInView direction="up" distance={32}>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
        </FadeInView>

        <div className="w-full max-w-5xl -mt-6">
          <PricingCards
            onSelectPlan={handleSelectPlan}
            currentPlan={isProUser ? currentPlan! : undefined}
            disabledPlans={isProUser ? ["free"] as PlanType[] : []}
            loadingPlan={upgrading}
            animated={true}
            showProFeatures={true}
            proHighlighted={true}
            showBillingToggle={!isUserLifetime}
            proTierInfo={proTierInfo}
            lifetimeTierInfo={lifetimeTierInfo}
            canTrial={canTrial}
            ctaLabel={(planKey, billingPeriod) => {
              if (planKey === "free") return "Get started";
              // Lifetime user → always "Current plan"
              if (isUserLifetime && planKey === "pro") return "Current plan";
              // Pro monthly user
              if (currentPlan === "pro" && planKey === "pro") {
                if (billingPeriod === "lifetime") return "Get lifetime access";
                return "Current plan";
              }
              // Friend
              if (currentPlan === "friend" && planKey === "pro") return "Current plan";
              // Free / not logged in
              if (planKey === "pro") {
                return canTrial ? `Start ${TRIAL_DURATION_DAYS}-day free trial` : (billingPeriod === "lifetime" ? "Get lifetime access" : "Claim your spot");
              }
              return "Get started";
            }}
          />
        </div>

        <div className="w-full">
          <Testimonials />
        </div>

        <section className="w-full max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
          <VsFaq faqs={faqs} />
        </section>

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
