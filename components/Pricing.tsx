"use client";

import { useEffect, useState } from "react";
import { PlanType, BillingPeriod, PLAN_ORDER } from "@/lib/plans";
import { FadeInView } from "@/components/ui/motion";
import PricingCards from "@/components/PricingCards";
import { authClient } from "@/lib/auth-client";

export default function Pricing() {
  const { data: session } = authClient.useSession();
  const [userPlan, setUserPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    if (!session) {
      const id = setTimeout(() => setUserPlan(null), 0);
      return () => clearTimeout(id);
    }

    let cancelled = false;
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setUserPlan(data.plan || "free"); })
      .catch(() => { if (!cancelled) setUserPlan("free"); });

    return () => { cancelled = true; };
  }, [session]);

  const handleSelectPlan = (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    if (planKey === "free") {
      const editor = document.getElementById("editor");
      if (editor) {
        const y = editor.getBoundingClientRect().top + window.scrollY - 50;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }

    // Already logged in with a paid plan
    if (session && userPlan && userPlan !== "free") {
      if (userPlan === planKey || (planKey === "pro" && userPlan === "friend")) {
        window.location.href = "/dashboard";
        return;
      }
      // Upgrade or downgrade: go to plan management page
      window.location.href = "/dashboard/plan";
      return;
    }

    const params = new URLSearchParams({ plan: planKey });
    if (billingPeriod) params.set("billing", billingPeriod);
    window.location.href = `/login?${params.toString()}`;
  };

  const getCtaLabel = (planKey: PlanType): string => {
    if (planKey === "free") return "Try for free";

    // Not logged in OR free plan: same CTAs
    if (!userPlan || userPlan === "free") {
      if (planKey === "pro") return "Claim your spot";
      return "Get started";
    }

    // Current plan → "Dashboard"
    if (userPlan === planKey || (planKey === "pro" && userPlan === "friend")) {
      return "Dashboard";
    }

    const currentIndex = PLAN_ORDER.indexOf(userPlan === "friend" ? "pro" : userPlan);
    const targetIndex = PLAN_ORDER.indexOf(planKey);

    if (targetIndex > currentIndex) return "Upgrade plan";
    return "Downgrade plan";
  };

  // Only show "Current" badge for paid plans
  const effectivePlan = userPlan === "friend" ? "pro" : userPlan;
  const displayCurrentPlan = effectivePlan && effectivePlan !== "free" ? effectivePlan : undefined;

  // Only Agency is disabled when it's the current plan
  const disabledPlans: PlanType[] = [];
  if (effectivePlan === "agency") disabledPlans.push("agency");

  return (
    <FadeInView direction="up" distance={32} amount={0.1}>
      <section id="pricing" className="w-full max-w-5xl mx-auto py-4 scroll-mt-18">
        <div className="text-center mb-8 md:mb-18">
          <h2 className="text-2xl md:text-4xl font-heading font-bold tracking-tight mb-3">
            Simple pricing
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Try for free.<br />Upgrade to pro when ready to level up your growth!
          </p>
        </div>

        <PricingCards
          onSelectPlan={handleSelectPlan}
          currentPlan={displayCurrentPlan}
          disabledPlans={disabledPlans}
          animated={true}
          showProFeatures={true}
          proHighlighted={true}
          ctaLabel={getCtaLabel}
        />
      </section>
    </FadeInView>
  );
}
