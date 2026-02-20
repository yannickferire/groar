"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon, ArrowRight01Icon, CheckmarkCircle02Icon, UserLove01Icon, News01Icon, CrownIcon, Download04Icon, Link01Icon, Fire02Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ExportsEmptyState from "@/components/dashboard/ExportsEmptyState";
import TrialBanner from "@/components/dashboard/TrialBanner";
import ExportCard, { ExportCardSkeleton } from "@/components/dashboard/ExportCard";
import { PlanType, PLANS, ProTierInfo } from "@/lib/plans";
import XLogo from "@/components/icons/XLogo";
import GoogleLogo from "@/components/icons/GoogleLogo";
import { authClient } from "@/lib/auth-client";

type Export = {
  id: string;
  imageUrl: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

type ConnectedAccount = {
  providerId: string;
};

type AnalyticsAccount = {
  username: string | null;
  latest: {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    date: string;
  } | null;
};

function DashboardContent() {
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [exports, setExports] = useState<Export[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [plan, setPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
  const [planActivated, setPlanActivated] = useState(false);
  const [analyticsAccounts, setAnalyticsAccounts] = useState<AnalyticsAccount[]>([]);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(true);
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);

  // Get first name from session
  const firstName = session?.user?.name?.split(" ")[0];

  // Check for checkout success
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const expectedPlan = searchParams.get("plan") as PlanType | null;

  const fetchData = useCallback(async () => {
    try {
      const [exportsRes, connectionsRes, planRes, analyticsRes, pricingRes] = await Promise.all([
        fetch("/api/exports"),
        fetch("/api/connections"),
        fetch("/api/user/plan"),
        fetch("/api/analytics?days=30"),
        fetch("/api/pricing"),
      ]);
      const exportsData = await exportsRes.json();
      const connectionsData = await connectionsRes.json();
      const planData = await planRes.json();
      const analyticsData = await analyticsRes.json();
      const pricingData = await pricingRes.json();
      setProTierInfo(pricingData.proTier || null);
      setExports(exportsData.exports || []);
      setConnectedAccounts(connectionsData.accounts || []);
      setPlan(planData.plan || "free");
      setIsTrialing(!!planData.isTrialing);
      setTrialEnd(planData.trialEnd || null);
      setHasUsedTrial(!!planData.hasUsedTrial);
      setAnalyticsAccounts(analyticsData.accounts || []);
      return planData.plan || "free";
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle trial start from landing page signup
  const trialParam = searchParams.get("trial") === "start";
  useEffect(() => {
    const trialIntent = localStorage.getItem("groar-trial-intent") === "true";
    const shouldStartTrial = trialParam || trialIntent;
    if (!shouldStartTrial) return;

    const hasPendingExport = localStorage.getItem("groar-pending-export") === "true";
    // Clean up localStorage flags
    try {
      localStorage.removeItem("groar-trial-intent");
      localStorage.removeItem("groar-pending-export");
    } catch {}
    fetch("/api/user/trial", { method: "POST" })
      .finally(() => {
        if (hasPendingExport) {
          // Redirect to editor with autoexport to finish the pending export
          router.replace("/dashboard/editor?autoexport=1");
        } else {
          // No pending export — just activate trial and stay on dashboard
          router.replace("/dashboard");
        }
      });
  }, [trialParam, router]);

  // Show minimal loading when trial redirect is in progress
  const [trialRedirecting, setTrialRedirecting] = useState(false);
  useEffect(() => {
    if (trialParam || localStorage.getItem("groar-trial-intent") === "true") {
      if (localStorage.getItem("groar-pending-export") === "true") {
        setTrialRedirecting(true);
      }
    }
  }, [trialParam]);

  if (trialRedirecting) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="space-y-6 max-w-md text-center">
          <p className="text-8xl">🐯</p>
          <p className="text-xl text-muted-foreground">Sharpening the claws...</p>
          <div className="flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  // Handle checkout success - poll for plan activation
  useEffect(() => {
    if (checkoutSuccess && expectedPlan && expectedPlan !== "free") {
      setPendingPlan(expectedPlan);

      // Poll for plan activation
      const pollInterval = setInterval(async () => {
        const currentPlan = await fetchData();
        if (currentPlan === expectedPlan) {
          clearInterval(pollInterval);
          setPendingPlan(null);
          setPlanActivated(true);
          // Clean URL after activation
          setTimeout(() => {
            router.replace("/dashboard");
            setPlanActivated(false);
          }, 3000);
        }
      }, 2000);

      // Stop polling after 30 seconds
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setPendingPlan(null);
      }, 30000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [checkoutSuccess, expectedPlan, fetchData, router]);

  const exportCount = exports.length;
  const hasExports = exportCount > 0;
  const googleConnectionCount = connectedAccounts.filter(a => a.providerId === "google").length;
  const xConnectionCount = connectedAccounts.filter(a => a.providerId === "twitter").length;
  const isFree = plan === "free";

  // This week's exports count
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const exportsThisWeek = exports.filter(e => new Date(e.createdAt) >= startOfWeek).length;

  // Streak: count consecutive days with at least 1 export (including today)
  const streak = (() => {
    if (exports.length === 0) return 0;
    const daySet = new Set(exports.map(e => new Date(e.createdAt).toDateString()));
    let count = 0;
    const d = new Date();
    // If no export today, start from yesterday
    if (!daySet.has(d.toDateString())) {
      d.setDate(d.getDate() - 1);
    }
    while (daySet.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const hasXAccounts = analyticsAccounts.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back{firstName ? `, ${firstName}` : ""}. Here&apos;s an overview of your activity.
        </p>
      </div>

      <TrialBanner isTrialing={isTrialing} trialEnd={trialEnd} plan={plan} proTierInfo={proTierInfo} hasUsedTrial={hasUsedTrial} />

      {/* CTA – mobile only */}
      <div className="md:hidden">
        <Button asChild variant="default" size="lg">
          <Link href="/dashboard/editor">
            <HugeiconsIcon icon={AddSquareIcon} size={18} strokeWidth={2} />
            Create new visual
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/plan" className="rounded-2xl border-fade hover-effect p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5"><HugeiconsIcon icon={CrownIcon} size={14} strokeWidth={1.5} />Current plan</p>
          {loading ? (
            <div className="h-9 w-12 rounded bg-sidebar mt-1" />
          ) : pendingPlan ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-mono font-bold">{PLANS[pendingPlan].name}</p>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : planActivated ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-mono font-bold">{PLANS[plan].name}</p>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={2} className="text-primary" />
            </div>
          ) : (
            <p className="text-3xl font-mono font-bold mt-1">{PLANS[plan].name}</p>
          )}
        </Link>
        <Link href="/dashboard/history" className="rounded-2xl border-fade hover-effect p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5"><HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} />Total exports</p>
          {loading ? (
            <div className="h-9 w-12 rounded bg-sidebar mt-1" />
          ) : (
            <p className="text-3xl font-mono font-bold mt-1">{exportCount}</p>
          )}
        </Link>
        <Link href="/dashboard/connections" className="rounded-2xl border-fade hover-effect p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5"><HugeiconsIcon icon={Link01Icon} size={14} strokeWidth={1.5} />Connections</p>
          {loading ? (
            <div className="h-9 w-12 rounded bg-sidebar mt-1" />
          ) : (
            <div className="flex items-center gap-3 mt-1">
              {googleConnectionCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <p className="text-3xl font-mono font-bold">{googleConnectionCount}</p>
                  <GoogleLogo />
                </div>
              )}
              {xConnectionCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <p className="text-3xl font-mono font-bold">{xConnectionCount}</p>
                  <XLogo />
                </div>
              )}
              {googleConnectionCount === 0 && xConnectionCount === 0 && (
                <p className="text-3xl font-mono font-bold">0</p>
              )}
            </div>
          )}
        </Link>
        <div className="rounded-2xl border-fade p-5">
          {loading ? (
            <>
              <div className="h-3 w-20 rounded bg-sidebar" />
              <div className="h-9 w-12 rounded bg-sidebar mt-2" />
            </>
          ) : isFree ? (
            <>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5"><HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={1.5} />Exports this week</p>
              <p className="text-3xl font-mono font-bold mt-1">{Math.max(PLANS.free.maxExportsPerWeek - exportsThisWeek, 0)}<span className="text-lg text-muted-foreground font-normal">/{PLANS.free.maxExportsPerWeek}</span></p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5"><HugeiconsIcon icon={Fire02Icon} size={14} strokeWidth={1.5} />Streak</p>
              <p className="text-3xl font-mono font-bold mt-1">{streak}<span className="text-lg text-muted-foreground font-normal"> {streak === 1 ? "day" : "days"}</span></p>
            </>
          )}
        </div>
      </div>

      {/* Recent exports */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-heading font-semibold">Recent exports</h2>
            <Link
              href="/dashboard/history"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
            </Link>
          </div>
          {hasExports && (
            <Button asChild variant="default" className="hidden md:inline-flex">
              <Link href="/dashboard/editor">
                <HugeiconsIcon icon={AddSquareIcon} size={18} strokeWidth={2} />
                Create new
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
            {[...Array(4)].map((_, i) => (
              <ExportCardSkeleton key={i} />
            ))}
          </div>
        ) : hasExports ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
            {exports.slice(0, 4).map((exp) => (
              <ExportCard
                key={exp.id}
                id={exp.id}
                imageUrl={exp.imageUrl}
                handle={(exp.metrics as { handle?: string }).handle}
                createdAt={exp.createdAt}
                isPremium={!isFree}
              />
            ))}
          </div>
        ) : (
          <ExportsEmptyState />
        )}
      </div>

      {/* Analytics summary */}
      {!loading && !isFree && hasXAccounts && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-heading font-semibold">Analytics</h2>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View details
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analyticsAccounts.map((account) => (
              <div key={account.username} className="rounded-2xl border-fade p-5 space-y-3">
                <p className="text-xs text-muted-foreground font-medium">@{account.username}</p>
                {account.latest ? (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={UserLove01Icon} size={16} strokeWidth={1.5} className="text-muted-foreground" />
                      <p className="text-2xl font-heading font-bold">{account.latest.followersCount.toLocaleString()}</p>
                      <span className="text-xs text-muted-foreground">followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={News01Icon} size={16} strokeWidth={1.5} className="text-muted-foreground" />
                      <p className="text-2xl font-heading font-bold">{account.latest.tweetCount.toLocaleString()}</p>
                      <span className="text-xs text-muted-foreground">posts</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-5xl mx-auto space-y-10">
        <div>
          <div className="h-8 w-32 rounded bg-sidebar" />
          <div className="h-4 w-64 rounded bg-sidebar mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border-fade p-5">
              <div className="h-3 w-20 rounded bg-sidebar" />
              <div className="h-9 w-12 rounded bg-sidebar mt-2" />
            </div>
          ))}
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
