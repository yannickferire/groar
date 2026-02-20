"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, StarIcon, Loading03Icon, MinusSignIcon, SparklesIcon, DashboardSquare02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { PLANS, PlanType, PLAN_ORDER, PRO_FEATURES, PRO_CHECKS, BillingPeriod, LIFETIME_PRICE, LIFETIME_FULL_PRICE, ProTierInfo } from "@/lib/plans";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { motion } from "framer-motion";
import { useState } from "react";

type PricingCardsProps = {
  onSelectPlan: (planKey: PlanType, billingPeriod?: BillingPeriod) => void;
  currentPlan?: PlanType;
  loadingPlan?: PlanType | null;
  ctaLabel?: (planKey: PlanType, billingPeriod?: BillingPeriod) => string;
  showProFeatures?: boolean;
  proHighlighted?: boolean;
  animated?: boolean;
  showBillingToggle?: boolean;
  disabledPlans?: PlanType[];
  proTierInfo?: ProTierInfo | null;
  canTrial?: boolean;
};

function ProCard({
  plan,
  isCurrent,
  isLoading,
  ctaLabel,
  showProFeatures,
  proHighlighted,
  onSelect,
  disabled,
  billingPeriod,
  proTierInfo,
  canTrial,
}: {
  plan: typeof PLANS.pro;
  planKey: PlanType;
  isCurrent: boolean;
  isLoading: boolean;
  ctaLabel: string;
  showProFeatures: boolean;
  proHighlighted: boolean;
  onSelect: () => void;
  disabled: boolean;
  billingPeriod: BillingPeriod;
  proTierInfo?: ProTierInfo | null;
  canTrial?: boolean;
}) {
  const proPrice = proTierInfo?.price ?? plan.price;
  const isLifetime = billingPeriod === "lifetime";
  const showTrialPricing = canTrial;
  return (
    <div className={proHighlighted ? "md:-my-6 md:-mx-4 relative z-10" : ""}>
      <div className="relative rounded-3xl p-6 md:p-8 flex flex-col bg-foreground text-background overflow-hidden">
        {/* Badge */}
        {!isCurrent && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full z-20 flex items-center gap-1">
            <HugeiconsIcon icon={StarIcon} size={12} strokeWidth={2} />
            Popular
          </div>
        )}
        {isCurrent && (
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full z-20">
            Current
          </div>
        )}

        {/* Gradient effect */}
        <motion.div
          className="absolute -bottom-20 -right-40 w-80 h-60 bg-linear-to-tl from-primary/40 via-primary/20 to-transparent blur-3xl rotate-[-25deg]"
          style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="relative z-10">
          <div className="mb-5">
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-xl font-heading font-bold">
                <span className="inline-block">🐯</span> GROAR Pro
              </h2>
              {"subtitle" in plan && (plan as { subtitle?: string }).subtitle && (
                <span className="text-sm text-background/40">
                  – {(plan as { subtitle: string }).subtitle}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-0.5 flex-wrap">
              <span className="text-3xl md:text-[32px] font-heading font-extrabold leading-none">$</span>
              <span className="text-4xl md:text-[42px] font-mono font-black leading-none">{isLifetime ? LIFETIME_PRICE : proPrice}</span>
              {isLifetime && (
                <span className="text-2xl leading-none text-muted-foreground line-through ml-1.5">${LIFETIME_FULL_PRICE}</span>
              )}
              <span className="text-background/60 text-sm ml-0.5">{isLifetime ? "one-time" : "/month"}</span>
              <span className="text-xs text-background/40 ml-1">(+ applicable tax)</span>
            </div>
            <p className="text-xs text-background/50 mt-1.5 min-h-4">
              {isLifetime ? (
                "Launch price"
              ) : proTierInfo && proTierInfo.spotsLeft !== null && proTierInfo.nextPrice !== null ? (
                <>Launch price – <span className="text-primary font-medium">{proTierInfo.spotsLeft} spots left</span> – Next: ${proTierInfo.nextPrice}/mo</>
              ) : "\u00A0"}
            </p>
          </div>

          {/* Premium features icons */}
          {showProFeatures && (
            <div className="space-y-2 mb-6">
              {PRO_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={feature.icon} size={16} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <p className="text-sm font-medium leading-tight text-muted">{feature.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* Checklist */}
          <ul className="space-y-2 mb-6">
            {(showProFeatures ? PRO_CHECKS : plan.features).map((feature, index) => (
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

          <Button
            variant="defaultReverse"
            className="w-full"
            onClick={onSelect}
            disabled={disabled}
          >
            {isLoading ? (
              <HugeiconsIcon icon={Loading03Icon} size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <>
                {ctaLabel === "Dashboard" ? (
                  <HugeiconsIcon icon={DashboardSquare02Icon} size={18} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} aria-hidden="true" />
                )}
                {ctaLabel}
              </>
            )}
          </Button>
          {showTrialPricing && !isCurrent && (
            <p className="text-xs text-background/50 text-center mt-2">No credit card required</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  planKey,
  isCurrent,
  isLoading,
  ctaLabel,
  onSelect,
  disabled,
}: {
  plan: (typeof PLANS)[keyof typeof PLANS];
  planKey: PlanType;
  isCurrent: boolean;
  isLoading: boolean;
  ctaLabel: string;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className="relative p-5 md:p-7 flex flex-col rounded-3xl md:mt-10 bg-card border-fade"
    >
      {isCurrent && planKey !== "free" && (
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
          Current
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-lg font-heading font-bold">{plan.name}</h2>
          {"subtitle" in plan && (plan as { subtitle?: string }).subtitle && (
            <span className="text-sm text-muted-foreground/50">
              – {(plan as { subtitle: string }).subtitle}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl md:text-[32px] font-heading font-extrabold leading-none">$</span>
          <span className="text-4xl md:text-[42px] font-mono font-black leading-none">{plan.price}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 mb-6">
        <ul className="space-y-2.5">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={16}
                strokeWidth={2}
                className="text-primary mt-0.5 shrink-0"
              />
              <span className="text-sm text-muted-foreground">
                {feature}
              </span>
            </li>
          ))}
        </ul>
        {"limits" in plan && (plan as { limits?: readonly string[] }).limits && (
          <ul className="space-y-2 pt-1">
            {((plan as { limits: readonly string[] }).limits).map((limit, index) => (
              <li key={index} className="flex items-start gap-2">
                <HugeiconsIcon
                  icon={MinusSignIcon}
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-muted-foreground/40"
                />
                <span className="text-sm text-muted-foreground/60">
                  {limit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={onSelect}
        disabled={disabled}
      >
        {isLoading ? (
          <HugeiconsIcon icon={Loading03Icon} size={18} strokeWidth={2} className="animate-spin" />
        ) : (
          ctaLabel
        )}
      </Button>
    </div>
  );
}

function BillingToggle({ period, onChange }: { period: BillingPeriod; onChange: (p: BillingPeriod) => void }) {
  return (
    <div className="flex items-center justify-center mb-6 md:mb-10 -mt-1 md:-mt-2">
      <div className="flex items-center bg-muted rounded-full p-1">
        <button
          onClick={() => onChange("monthly")}
          className="relative z-10 px-4 py-1.5 rounded-full text-sm font-medium"
        >
          {period === "monthly" && (
            <motion.div
              layoutId="billing-pill"
              className="absolute inset-0 rounded-full bg-foreground shadow-sm"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            />
          )}
          <span className={`relative z-10 ${period === "monthly" ? "text-background" : "text-muted-foreground hover:text-foreground"}`}>
            Monthly
          </span>
        </button>
        <button
          onClick={() => onChange("lifetime")}
          className="relative z-10 px-4 py-1.5 rounded-full text-sm font-medium"
        >
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium text-primary bg-muted px-1.5 py-0.5 rounded-full leading-none z-20">–33%</span>
          {period === "lifetime" && (
            <motion.div
              layoutId="billing-pill"
              className="absolute inset-0 rounded-full bg-foreground shadow-sm"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            />
          )}
          <span className={`relative z-10 ${period === "lifetime" ? "text-background" : "text-muted-foreground hover:text-foreground"}`}>
            Lifetime
          </span>
        </button>
      </div>
    </div>
  );
}

export default function PricingCards({
  onSelectPlan,
  currentPlan,
  loadingPlan = null,
  ctaLabel,
  showProFeatures = true,
  proHighlighted = true,
  animated = false,
  showBillingToggle = true,
  disabledPlans = [],
  proTierInfo,
  canTrial,
}: PricingCardsProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("lifetime");

  const defaultCtaLabel = (planKey: PlanType) => {
    if (currentPlan === planKey) return "Current plan";
    return `Choose ${PLANS[planKey].name}`;
  };

  const getLabel = ctaLabel || defaultCtaLabel;
  const isAnyLoading = loadingPlan !== null;

  const cards = PLAN_ORDER.filter((k) => k !== "friend").map((planKey) => {
    const plan = PLANS[planKey];
    const isCurrent = currentPlan === planKey;
    const isLoading = loadingPlan === planKey;
    const isPro = planKey === "pro";
    const isDisabled = isAnyLoading || disabledPlans.includes(planKey);

    const card = isPro ? (
      <ProCard
        key={planKey}
        plan={plan as typeof PLANS.pro}
        planKey={planKey}
        isCurrent={isCurrent}
        isLoading={isLoading}
        ctaLabel={getLabel(planKey, billingPeriod)}
        showProFeatures={showProFeatures}
        proHighlighted={proHighlighted}
        onSelect={() => onSelectPlan(planKey, billingPeriod)}
        disabled={isDisabled}
        proTierInfo={proTierInfo}
        billingPeriod={billingPeriod}
        canTrial={canTrial}
      />
    ) : (
      <PlanCard
        key={planKey}
        plan={plan}
        planKey={planKey}
        isCurrent={isCurrent}
        isLoading={isLoading}
        ctaLabel={getLabel(planKey, billingPeriod)}
        onSelect={() => onSelectPlan(planKey, billingPeriod)}
        disabled={isDisabled}
      />
    );

    if (animated) {
      return (
        <StaggerItem key={planKey} direction="up" distance={24} className={isPro && proHighlighted ? "md:-my-6 md:-mx-4 relative z-10" : ""}>
          {isPro ? (
            <ProCard
              plan={plan as typeof PLANS.pro}
              planKey={planKey}
              isCurrent={isCurrent}
              isLoading={isLoading}
              ctaLabel={getLabel(planKey, billingPeriod)}
              showProFeatures={showProFeatures}
              proHighlighted={false}
              onSelect={() => onSelectPlan(planKey, billingPeriod)}
              disabled={isDisabled}
              billingPeriod={billingPeriod}
              proTierInfo={proTierInfo}
              canTrial={canTrial}
            />
          ) : (
            <PlanCard
              plan={plan}
              planKey={planKey}
              isCurrent={isCurrent}
              isLoading={isLoading}
              ctaLabel={getLabel(planKey, billingPeriod)}
              onSelect={() => onSelectPlan(planKey, billingPeriod)}
              disabled={isDisabled}
            />
          )}
        </StaggerItem>
      );
    }

    return card;
  });

  const toggle = showBillingToggle && (
    <BillingToggle period={billingPeriod} onChange={setBillingPeriod} />
  );

  if (animated) {
    return (
      <StaggerContainer staggerDelay={0.1}>
        {showBillingToggle && (
          <StaggerItem direction="up" distance={16}>
            <BillingToggle period={billingPeriod} onChange={setBillingPeriod} />
          </StaggerItem>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 items-start max-w-3xl mx-auto">
          {cards}
        </div>
      </StaggerContainer>
    );
  }

  return (
    <div>
      {toggle}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 items-start max-w-3xl mx-auto">
        {cards}
      </div>
    </div>
  );
}
