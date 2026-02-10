"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Analytics01Icon, Clock01Icon, Setting06Icon, FlashIcon, MoreHorizontalIcon, StarIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { PLANS, PlanType } from "@/lib/plans";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { motion } from "framer-motion";
import Link from "next/link";

const PLAN_ORDER: PlanType[] = ["free", "pro", "agency"];

// Premium features for the Pro card
const PRO_FEATURES = [
  { icon: Analytics01Icon, title: "Dashboard", description: "Track all your metrics" },
  { icon: FlashIcon, title: "Automation", description: "Auto-fetch your metrics" },
  { icon: Setting06Icon, title: "Custom branding", description: "Remove watermark" },
  { icon: Clock01Icon, title: "History", description: "Access past visuals" },
  { icon: MoreHorizontalIcon, title: "And more...", description: "Templates, all platforms, etc." },
];

export default function Pricing() {
  return (
    <FadeInView direction="up" distance={32}>
      <section className="w-full max-w-5xl mx-auto py-4">
        <div className="text-center mb-18">
          <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-3">
            Simple pricing
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start for free, upgrade when you need more.
          </p>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center" staggerDelay={0.1}>
          {PLAN_ORDER.map((planKey) => {
            const plan = PLANS[planKey];
            const isPro = planKey === "pro";

            // Pro card with premium features and gradient
            if (isPro) {
              return (
                <StaggerItem key={planKey} direction="up" distance={24} className="md:-my-6 md:-mx-8 relative z-10">
                  <div className="relative rounded-3xl p-8 flex flex-col bg-foreground text-background overflow-hidden">
                    {/* Badge inside card top-right */}
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full z-20 flex items-center gap-1">
                      <HugeiconsIcon icon={StarIcon} size={12} strokeWidth={2} />
                      Popular
                    </div>
                      {/* Gradient effect */}
                      <motion.div
                        className="absolute -bottom-20 -right-40 w-80 h-60 bg-linear-to-tl from-primary/40 via-primary/20 to-transparent blur-3xl rotate-[-25deg]"
                        style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />

                      <div className="relative z-10">
                        <div className="mb-5">
                          <h3 className="text-xl font-heading font-bold mb-2">
                            Groar Pro <span className="inline-block">🐯</span>
                          </h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-heading font-bold">${plan.price}</span>
                            <span className="text-background/60 text-sm">/month</span>
                          </div>
                        </div>

                        {/* Premium features list */}
                        <div className="space-y-3 mb-6">
                          {PRO_FEATURES.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                                <HugeiconsIcon icon={feature.icon} size={16} strokeWidth={1.5} className="text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-tight">{feature.title}</p>
                                <p className="text-xs text-background/50">{feature.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Features list */}
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                size={16}
                                strokeWidth={2}
                                className="text-primary mt-0.5 shrink-0"
                              />
                              <span className="text-sm text-background/80">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button asChild variant="defaultReverse" className="w-full">
                          <Link href="/login?plan=pro">Get started</Link>
                        </Button>
                      </div>
                    </div>
                </StaggerItem>
              );
            }

            // Free and Agency cards
            return (
              <StaggerItem key={planKey} direction="up" distance={24}>
                <div className="relative rounded-3xl p-7 h-full flex flex-col bg-card border-fade">
                  <div className="mb-5">
                    <h3 className="text-lg font-heading font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-heading font-bold">${plan.price}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">/month</span>
                      )}
                    </div>
                  </div>

                  <ul className="flex-1 space-y-2.5 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={16}
                          strokeWidth={2}
                          className="text-primary mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/login?plan=${planKey}`}>
                      {planKey === "free" ? "Get started free" : "Get started"}
                    </Link>
                  </Button>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>
    </FadeInView>
  );
}
