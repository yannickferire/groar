"use client";

import { PLANS, PlanType, BillingPeriod } from "@/lib/plans";
import { FadeInView } from "@/components/ui/motion";
import PricingCards from "@/components/PricingCards";

export default function Pricing() {
  const handleSelectPlan = (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    if (planKey === "free") {
      const editor = document.getElementById("editor");
      if (editor) {
        const y = editor.getBoundingClientRect().top + window.scrollY - 50;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }
    const params = new URLSearchParams({ plan: planKey });
    if (billingPeriod) params.set("billing", billingPeriod);
    window.location.href = `/login?${params.toString()}`;
  };

  return (
    <FadeInView direction="up" distance={32}>
      <section className="w-full max-w-5xl mx-auto py-4">
        <div className="text-center mb-18">
          <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-3">
            Simple pricing
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Try for free,<br />upgrade to pro when you need more.
          </p>
        </div>

        <PricingCards
          onSelectPlan={handleSelectPlan}
          animated={true}
          showProFeatures={true}
          proHighlighted={true}
          ctaLabel={(planKey) => {
            if (planKey === "free") return "Try for free";
            if (planKey === "pro") return "Claim your spot";
            return "Get started";
          }}
        />
      </section>
    </FadeInView>
  );
}
