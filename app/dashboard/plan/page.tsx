"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Calendar03Icon, CreditCardIcon, Loading03Icon, RepeatIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { PLANS, PlanType, PLAN_ORDER, BillingPeriod, ProTierInfo } from "@/lib/plans";
import Link from "next/link";
import PricingCards from "@/components/PricingCards";
import { toast } from "sonner";

type PlanData = {
  plan: PlanType;
  name: string;
  price: number;
  features: string[];
  limits: {
    maxConnectionsPerProvider: number;
    maxExportsPerDay: number | null;
  };
  status?: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  billingPeriod?: "monthly" | "annual";
};

export default function PlanPage() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      const [planRes, pricingRes] = await Promise.all([
        fetch("/api/user/plan"),
        fetch("/api/pricing"),
      ]);
      const data = await planRes.json();
      setPlanData(data);
      const pricingData = await pricingRes.json();
      setProTierInfo(pricingData.proTier);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const isPaidPlan = planData && planData.plan !== "free" && planData.plan !== "friend";

  const handleUpgrade = async (planKey: PlanType, billingPeriod?: BillingPeriod) => {
    if (planKey === "free") return;

    // If downgrading (paid user selecting a lower plan), open billing portal
    if (isPaidPlan && PLAN_ORDER.indexOf(planKey) < PLAN_ORDER.indexOf(planData.plan)) {
      handleManageSubscription();
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

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        console.error("No portal URL returned:", data);
        toast.error(data.error || "Failed to open billing portal. Please try again.");
        setOpeningPortal(false);
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      setOpeningPortal(false);
    }
  };

  const currentPlanIndex = planData ? PLAN_ORDER.indexOf(planData.plan) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Plan & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-2xl border-fade p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Current plan
            </p>
            {loading ? (
              <div className="h-8 w-20 rounded bg-sidebar" />
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-heading font-bold">{planData?.name}</h2>
                {planData?.status === "canceled" && planData?.currentPeriodEnd && (
                  <span className="text-xs font-medium bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                    Ends {new Date(planData.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!loading && isPaidPlan && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={openingPortal}
              >
                {openingPortal ? (
                  <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={2} />
                )}
                Manage subscription
              </Button>
            )}
            {!loading && planData && planData.plan !== "agency" && planData.plan !== "friend" && (
              <Button asChild variant="default">
                <Link href="/pricing">
                  Upgrade
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {!loading && planData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-sidebar p-4">
              <p className="text-xs text-muted-foreground mb-1">Exports per day</p>
              <p className="text-lg font-semibold">
                {planData.limits.maxExportsPerDay === null ? "Unlimited" : planData.limits.maxExportsPerDay}
              </p>
            </div>
            <div className="rounded-xl bg-sidebar p-4">
              <p className="text-xs text-muted-foreground mb-1">Accounts per platform</p>
              <p className="text-lg font-semibold">
                {planData.limits.maxConnectionsPerProvider === 0 ? "None" : planData.limits.maxConnectionsPerProvider}
              </p>
            </div>
          </div>
        )}

        {!loading && isPaidPlan && planData?.currentPeriodEnd && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {planData.billingPeriod && (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={RepeatIcon} size={14} strokeWidth={2} />
                <span>{planData.billingPeriod === "annual" ? "Annual" : "Monthly"} billing</span>
              </div>
            )}
            {planData.currentPeriodStart && (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={2} />
                <span>
                  Current period: {new Date(planData.currentPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(planData.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
            {!planData.currentPeriodStart && (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={2} />
                <span>
                  {planData.status === "canceled" ? "Ends" : "Renews"} {new Date(planData.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Plans */}
      {!loading && planData && (
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4">All plans</h3>
          <PricingCards
            onSelectPlan={handleUpgrade}
            currentPlan={planData.plan === "friend" ? "pro" : planData.plan}
            disabledPlans={[planData.plan]}
            loadingPlan={upgrading}
            showProFeatures={true}
            proHighlighted={true}
            proTierInfo={proTierInfo}
            ctaLabel={(planKey) => {
              if (planData.plan === planKey) return "Current plan";
              const planIndex = PLAN_ORDER.indexOf(planKey);
              if (planIndex > currentPlanIndex) return `Upgrade to ${PLANS[planKey].name}`;
              if (planIndex < currentPlanIndex && isPaidPlan) return "Switch plan";
              return `Choose ${PLANS[planKey].name}`;
            }}
          />
        </div>
      )}
    </div>
  );
}
