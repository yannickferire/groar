"use client";

import { useEffect, useState } from "react";
import { PlanType, BillingPeriod, PLAN_ORDER, ProTierInfo, LifetimeTierInfo, TRIAL_DURATION_DAYS, fetchProTierInfo, fetchLifetimeTierInfo } from "@/lib/plans";
import { FadeInView } from "@/components/ui/motion";
import PricingCards from "@/components/PricingCards";
import { authClient } from "@/lib/auth-client";

export default function Pricing() {
  const { data: session } = authClient.useSession();
  const [userPlan, setUserPlan] = useState<PlanType | null>(null);
  const [userBillingPeriod, setUserBillingPeriod] = useState<BillingPeriod | null>(null);
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);
  const [lifetimeTierInfo, setLifetimeTierInfo] = useState<LifetimeTierInfo | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [trialChecked, setTrialChecked] = useState(false);

  useEffect(() => {
    fetchProTierInfo().then(setProTierInfo).catch(() => {});
    fetchLifetimeTierInfo().then(setLifetimeTierInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!session) {
      const id = setTimeout(() => setUserPlan(null), 0);
      setTrialChecked(true);
      return () => clearTimeout(id);
    }

    let cancelled = false;
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setUserPlan(data.plan || "free");
        if (data.billingPeriod) setUserBillingPeriod(data.billingPeriod);
        if (data.hasUsedTrial) setHasUsedTrial(true);
        setTrialChecked(true);
      })
      .catch(() => { if (!cancelled) { setUserPlan("free"); setTrialChecked(true); } });

    return () => { cancelled = true; };
  }, [session]);

  const canTrial = trialChecked && !hasUsedTrial;
  const isUserLifetime = userPlan === "pro" && userBillingPeriod === "lifetime";

  const handleSelectPlan = async (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    if (planKey === "free") {
      if (session) {
        window.location.href = "/dashboard/editor";
      } else {
        window.location.href = "/login";
      }
      return;
    }

    // Trial flow for Pro (only for free/non-logged-in users)
    if (canTrial && planKey === "pro" && (!userPlan || userPlan === "free")) {
      if (!session) {
        import("posthog-js").then(({ default: posthog }) => {
          posthog.capture("cta_clicked", { source: "pricing" });
        }).catch(() => {});
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/dashboard?trial=start")}`;
      } else {
        fetch("/api/user/trial", { method: "POST" })
          .then(() => { window?.datafast?.("trial_started"); window.location.href = "/dashboard/editor"; })
          .catch(() => { window.location.href = "/dashboard?trial=start"; });
      }
      return;
    }

    // Already logged in with a paid plan
    if (session && userPlan && userPlan !== "free") {
      // Pro monthly user clicking lifetime → go directly to checkout (not lifetime users)
      if (planKey === "pro" && billingPeriod === "lifetime" && userPlan === "pro" && !isUserLifetime) {
        try {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: planKey, billingPeriod: "lifetime" }),
          });
          const data = await response.json();
          if (data.checkoutUrl) {
            window?.datafast?.("checkout_initiated", { plan: planKey, billing: "lifetime" });
            window.location.href = data.checkoutUrl;
          }
        } catch {
          // Checkout creation failed — user stays on page
        }
        return;
      }
      // Current plan or lifetime user → go to dashboard
      window.location.href = "/dashboard/plan#plans";
      return;
    }

    const params = new URLSearchParams({ plan: planKey });
    if (billingPeriod) params.set("billing", billingPeriod);
    window.location.href = `/login?${params.toString()}`;
  };

  const getCtaLabel = (planKey: PlanType, billingPeriod?: BillingPeriod): string => {
    if (planKey === "free") return "Get started";

    // Not logged in OR free plan: same CTAs
    if (!userPlan || userPlan === "free") {
      if (planKey === "pro") {
        return canTrial ? `Start ${TRIAL_DURATION_DAYS}-day free trial` : (billingPeriod === "lifetime" ? "Get lifetime access" : "Claim your spot");
      }
      return "Get started";
    }

    // Lifetime user → always "Current plan" on pro card
    if (isUserLifetime && planKey === "pro") return "Current plan";

    // Pro monthly user
    if (userPlan === "pro" && planKey === "pro") {
      if (billingPeriod === "lifetime") return "Get lifetime access";
      return "Current plan";
    }

    // Friend plan
    if (planKey === "pro" && userPlan === "friend") return "Current plan";

    const currentIndex = PLAN_ORDER.indexOf(userPlan === "friend" ? "pro" : userPlan);
    const targetIndex = PLAN_ORDER.indexOf(planKey);

    if (targetIndex > currentIndex) return "Upgrade plan";
    return "Downgrade plan";
  };

  // Only show "Current" badge for paid plans
  const effectivePlan = userPlan === "friend" ? "pro" : userPlan;
  const displayCurrentPlan = effectivePlan && effectivePlan !== "free" ? effectivePlan : undefined;

  return (
    <FadeInView direction="up" distance={32} amount={0.1}>
      <section id="pricing" className="w-full max-w-5xl mx-auto py-4 px-4 scroll-mt-18">
        <div className="text-center mb-8 md:mb-18">
          <h2 className="text-2xl md:text-4xl font-heading font-bold tracking-tight mb-3">
            Simple pricing
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start for free.<br />Upgrade to Pro when ready to level up your growth!
          </p>
        </div>

        <PricingCards
          onSelectPlan={handleSelectPlan}
          currentPlan={displayCurrentPlan}
          disabledPlans={userPlan && userPlan !== "free" ? ["free"] as PlanType[] : []}
          animated={true}
          showProFeatures={true}
          proHighlighted={true}
          showBillingToggle={!isUserLifetime}
          proTierInfo={proTierInfo}
          lifetimeTierInfo={lifetimeTierInfo}
          canTrial={canTrial}
          ctaLabel={getCtaLabel}
        />
      </section>
    </FadeInView>
  );
}
