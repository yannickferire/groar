"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, ArrowRight01Icon, CreditCardIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { PLANS, PlanType } from "@/lib/plans";
import Link from "next/link";

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
};

const PLAN_ORDER: PlanType[] = ["free", "pro", "agency"];

export default function PlanPage() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/user/plan");
      const data = await res.json();
      setPlanData(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const currentPlanIndex = planData ? PLAN_ORDER.indexOf(planData.plan) : 0;
  const isPaidPlan = planData && planData.plan !== "free";

  const handleUpgrade = async (planKey: PlanType) => {
    setUpgrading(planKey);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
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
        alert(data.error || "Failed to open billing portal. Please try again.");
        setOpeningPortal(false);
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      setOpeningPortal(false);
    }
  };

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
            {!loading && planData && planData.plan !== "agency" && (
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
      </div>

      {/* All Plans */}
      <div>
        <h3 className="text-lg font-heading font-semibold mb-4">All plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_ORDER.map((planKey, index) => {
            const plan = PLANS[planKey];
            const isCurrent = planData?.plan === planKey;
            const isUpgrade = index > currentPlanIndex;
            const isDowngrade = index < currentPlanIndex;

            return (
              <div
                key={planKey}
                className={`rounded-2xl p-6 flex flex-col ${
                  isCurrent ? "bg-foreground text-background" : "border-fade"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-bold">{plan.name}</h4>
                  {isCurrent && (
                    <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-heading font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className={isCurrent ? "text-background/60 text-sm" : "text-muted-foreground text-sm"}>
                      /month
                    </span>
                  )}
                </div>

                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.slice(0, 3).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-sm">
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={16}
                        strokeWidth={2}
                        className={isCurrent ? "text-primary mt-0.5" : "text-primary mt-0.5"}
                      />
                      <span className={isCurrent ? "text-background/80" : "text-muted-foreground"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="defaultReverse" size="sm" disabled className="w-full">
                    Current plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpgrade(planKey)}
                    disabled={upgrading !== null}
                  >
                    {upgrading === planKey ? (
                      <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
                    ) : (
                      <>
                        Upgrade to {plan.name}
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                      </>
                    )}
                  </Button>
                ) : isDowngrade && isPaidPlan ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                  >
                    {openingPortal ? (
                      <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
                    ) : (
                      "Switch plan"
                    )}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
