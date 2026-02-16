"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon, ArrowRight01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ExportsEmptyState from "@/components/dashboard/ExportsEmptyState";
import ExportCard, { ExportCardSkeleton } from "@/components/dashboard/ExportCard";
import { PlanType, PLANS } from "@/lib/plans";
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

  // Get first name from session
  const firstName = session?.user?.name?.split(" ")[0];

  // Check for checkout success
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const expectedPlan = searchParams.get("plan") as PlanType | null;

  const fetchData = useCallback(async () => {
    try {
      const [exportsRes, connectionsRes, planRes] = await Promise.all([
        fetch("/api/exports"),
        fetch("/api/connections"),
        fetch("/api/user/plan"),
      ]);
      const exportsData = await exportsRes.json();
      const connectionsData = await connectionsRes.json();
      const planData = await planRes.json();
      setExports(exportsData.exports || []);
      setConnectedAccounts(connectionsData.accounts || []);
      setPlan(planData.plan || "free");
      return planData.plan || "free";
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back{firstName ? `, ${firstName}` : ""}. Here&apos;s an overview of your activity.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/dashboard/plan" className="rounded-2xl border-fade hover-effect p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current plan</p>
          {loading ? (
            <div className="h-9 w-12 rounded bg-sidebar mt-1" />
          ) : pendingPlan ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-heading font-bold">{PLANS[pendingPlan].name}</p>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : planActivated ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-heading font-bold">{PLANS[plan].name}</p>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={2} className="text-primary" />
            </div>
          ) : (
            <p className="text-3xl font-heading font-bold mt-1">{PLANS[plan].name}</p>
          )}
        </Link>
        <Link href="/dashboard/history" className="rounded-2xl border-fade hover-effect p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total exports</p>
          {loading ? (
            <div className="h-9 w-12 rounded bg-sidebar mt-1" />
          ) : (
            <p className="text-3xl font-heading font-bold mt-1">{exportCount}</p>
          )}
        </Link>
        <Link href="/dashboard/connections" className="rounded-2xl border-fade hover-effect p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Connections</p>
          {loading ? (
            <div className="h-9 w-12 rounded bg-sidebar mt-1" />
          ) : (
            <div className="flex items-center gap-3 mt-1">
              {googleConnectionCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <p className="text-3xl font-heading font-bold">{googleConnectionCount}</p>
                  <GoogleLogo />
                </div>
              )}
              {xConnectionCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <p className="text-3xl font-heading font-bold">{xConnectionCount}</p>
                  <XLogo />
                </div>
              )}
              {googleConnectionCount === 0 && xConnectionCount === 0 && (
                <p className="text-3xl font-heading font-bold">0</p>
              )}
            </div>
          )}
        </Link>
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
            <Button asChild variant="default">
              <Link href="/dashboard/editor">
                <HugeiconsIcon icon={AddSquareIcon} size={18} strokeWidth={2} />
                Create new
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
            {[...Array(8)].map((_, i) => (
              <ExportCardSkeleton key={i} />
            ))}
          </div>
        ) : hasExports ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
            {exports.slice(0, 8).map((exp) => (
              <ExportCard
                key={exp.id}
                id={exp.id}
                imageUrl={exp.imageUrl}
                handle={(exp.metrics as { handle?: string }).handle}
                createdAt={exp.createdAt}
              />
            ))}
          </div>
        ) : (
          <ExportsEmptyState />
        )}
      </div>
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
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
