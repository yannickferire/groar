"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, StarIcon, Loading03Icon, MinusSignIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { PLANS, PlanType, PLAN_ORDER, PRO_FEATURES, PRO_CHECKS, BillingPeriod, LIFETIME_FINAL_PRICE, LIFETIME_PRICING_TIERS, ProTierInfo, LifetimeTierInfo } from "@/lib/plans";
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
  lifetimeTierInfo?: LifetimeTierInfo | null;
  canTrial?: boolean;
};

function EarlyAdopterProgressBlock({ lifetimeTierInfo, proTierInfo, billingPeriod }: { lifetimeTierInfo: LifetimeTierInfo; proTierInfo?: ProTierInfo | null; billingPeriod: BillingPeriod }) {
  const info = lifetimeTierInfo;
  if (info.spotsLeft === null) return null;

  // Total spots across all non-final tiers
  const totalSpots = LIFETIME_PRICING_TIERS.reduce((sum, t) => sum + (t.spots ?? 0), 0);
  const overallProgress = Math.min(info.totalSold / totalSpots, 1);

  // Compute tier boundaries for the segmented bar
  let accumulated = 0;
  const tiers = LIFETIME_PRICING_TIERS.filter(t => t.spots !== null).map(t => {
    const start = accumulated / totalSpots;
    accumulated += t.spots!;
    const end = accumulated / totalSpots;
    return { price: t.price, spots: t.spots!, start, end };
  });

  const isLifetime = billingPeriod === "lifetime";
  const nextPrice = isLifetime
    ? `$${info.nextPrice ?? LIFETIME_FINAL_PRICE}`
    : `$${proTierInfo?.nextPrice}/mo`;

  // Bar height for rounded-end offset calculation (h-4 = 1rem = 16px)
  const barH = "1rem";

  return (
    <div className="rounded-2xl border-fade p-5 md:p-6 mt-4 mb-6 md:mb-16 max-w-2xl mx-auto" style={{ backgroundColor: "var(--muted)" }}>
      {/* Header */}
      <div className="mb-4 text-center">
        <p className="text-xl font-heading font-bold tracking-tight">
          <span className="text-2xl">🔥</span> Only <span className="highlighted text-2xl">{info.spotsLeft} spots</span> left at <span className="text-2xl">${info.price}{!isLifetime && "/lifetime"}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Catch yours — price increases to <span className="font-semibold text-foreground">{nextPrice}</span> {info.spotsLeft <= 10 ? "next" : "when these are gone"}
        </p>
      </div>

      {/* Progress bar with tier segments */}
      <div className="relative h-4 rounded-full" style={{ backgroundColor: "var(--card)" }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 100%)" }}
          initial={{ width: 0 }}
          whileInView={{ width: `calc(${overallProgress} * (100% - ${barH}) + ${barH})` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Tier boundary markers — 1px, extend above/below */}
        {tiers.slice(0, -1).map((tier) => (
          <div
            key={tier.price}
            className="absolute w-px bg-foreground/50"
            style={{ left: `calc(${tier.end} * (100% - ${barH}) + ${barH} / 2)`, top: "-3px", bottom: "-3px" }}
          />
        ))}
      </div>

      {/* Tier price labels */}
      <div className="relative mt-2.5 h-5">
        {tiers.map((tier) => {
          const isCurrent = info.price === tier.price;
          const isPast = tier.price < info.price;
          return (
            <span
              key={tier.price}
              className={`absolute text-xs ${isCurrent ? "font-bold text-primary" : isPast ? "text-muted-foreground/40 line-through" : "text-muted-foreground font-medium"}`}
              style={{ left: `calc(${tier.start} * (100% - ${barH}))` }}
            >
              ${tier.price}
            </span>
          );
        })}
        <span className="absolute text-xs text-muted-foreground font-medium right-0">
          ${LIFETIME_FINAL_PRICE}
        </span>
      </div>
    </div>
  );
}

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
  lifetimeTierInfo,
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
  lifetimeTierInfo?: LifetimeTierInfo | null;
  canTrial?: boolean;
}) {
  const proPrice = proTierInfo?.price ?? plan.price;
  const isLifetime = billingPeriod === "lifetime";
  const lifetimePrice = lifetimeTierInfo?.price ?? LIFETIME_PRICING_TIERS[0].price;
  const showStrikethrough = isLifetime && lifetimePrice < LIFETIME_FINAL_PRICE;
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
              <span className="text-4xl md:text-[42px] font-mono font-black leading-none">{isLifetime ? lifetimePrice : proPrice}</span>
              {showStrikethrough && (
                <span className="text-2xl leading-none text-muted-foreground line-through ml-1.5">${LIFETIME_FINAL_PRICE}</span>
              )}
              <span className="text-background/60 text-sm ml-0.5">{isLifetime ? "one-time" : "/month"}</span>
            </div>
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
            disabled={disabled || ctaLabel === "Current plan"}
          >
            {isLoading ? (
              <HugeiconsIcon icon={Loading03Icon} size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <>
                <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} aria-hidden="true" />
                {ctaLabel}
              </>
            )}
          </Button>
          {canTrial && !isCurrent && (
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

function BillingToggle({ period, onChange, lifetimePrice }: { period: BillingPeriod; onChange: (p: BillingPeriod) => void; lifetimePrice: number }) {
  const savingsPercent = LIFETIME_FINAL_PRICE > 0 ? Math.round((1 - lifetimePrice / LIFETIME_FINAL_PRICE) * 100) : 0;
  const savingsLabel = savingsPercent > 0 ? `–${savingsPercent}%` : "Best deal";

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
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium text-primary bg-muted px-1.5 py-0.5 rounded-full leading-none z-20">{savingsLabel}</span>
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
  lifetimeTierInfo,
  canTrial,
}: PricingCardsProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("lifetime");
  const lifetimePrice = lifetimeTierInfo?.price ?? LIFETIME_PRICING_TIERS[0].price;

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
        lifetimeTierInfo={lifetimeTierInfo}
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
              lifetimeTierInfo={lifetimeTierInfo}
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
    <BillingToggle period={billingPeriod} onChange={setBillingPeriod} lifetimePrice={lifetimePrice} />
  );

  // Fallback tierInfo so the block renders immediately (before API responds)
  const lifetimeFallback: LifetimeTierInfo = { price: LIFETIME_PRICING_TIERS[0].price, spotsLeft: LIFETIME_PRICING_TIERS[0].spots, nextPrice: LIFETIME_PRICING_TIERS[1].price, totalSold: 0 };
  const progressBlock = (
    <EarlyAdopterProgressBlock lifetimeTierInfo={lifetimeTierInfo ?? lifetimeFallback} proTierInfo={proTierInfo} billingPeriod={billingPeriod} />
  );

  if (animated) {
    return (
      <StaggerContainer staggerDelay={0.1}>
        {showBillingToggle && (
          <StaggerItem direction="up" distance={16}>
            <BillingToggle period={billingPeriod} onChange={setBillingPeriod} lifetimePrice={lifetimePrice} />
          </StaggerItem>
        )}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {progressBlock}
        </motion.div>
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-4 md:gap-0 items-stretch max-w-3xl mx-auto">
          {cards}
        </div>
      </StaggerContainer>
    );
  }

  return (
    <div>
      {toggle}
      {progressBlock}
      <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-4 md:gap-0 items-stretch max-w-3xl mx-auto">
        {cards}
      </div>
    </div>
  );
}
