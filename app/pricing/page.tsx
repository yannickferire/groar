"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { PLANS, PlanType } from "@/lib/plans";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import Link from "next/link";

const PLAN_ORDER: PlanType[] = ["free", "pro", "agency"];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-16">
        <FadeInView direction="up" distance={32}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
        </FadeInView>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl" staggerDelay={0.1}>
          {PLAN_ORDER.map((planKey) => {
            const plan = PLANS[planKey];
            const isPopular = planKey === "pro";

            return (
              <StaggerItem key={planKey} direction="up" distance={24}>
                <div
                  className={`relative rounded-3xl p-8 h-full flex flex-col ${
                    isPopular
                      ? "bg-foreground text-background border-2 border-foreground"
                      : "bg-card border-fade"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h2 className="text-xl font-heading font-bold mb-2">{plan.name}</h2>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-heading font-bold">
                        ${plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className={isPopular ? "text-background/60" : "text-muted-foreground"}>
                          /month
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={18}
                          strokeWidth={2}
                          className={isPopular ? "text-primary mt-0.5" : "text-primary mt-0.5"}
                        />
                        <span className={isPopular ? "text-background/80" : "text-muted-foreground"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {planKey === "free" ? (
                    <Button
                      asChild
                      variant={isPopular ? "defaultReverse" : "outline"}
                      size="lg"
                      className="w-full"
                    >
                      <Link href="/#editor">Try for free</Link>
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? "defaultReverse" : "outline"}
                      size="lg"
                      className="w-full"
                      disabled
                    >
                      Coming soon
                    </Button>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeInView direction="up" distance={16} delay={0.4}>
          <p className="text-sm text-muted-foreground text-center mt-12">
            All plans include access to all backgrounds and no watermark on exports.
          </p>
        </FadeInView>
      </main>
      <Footer />
    </div>
  );
}
