"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ExportsEmptyState from "@/components/dashboard/ExportsEmptyState";
import ExportCard, { ExportCardSkeleton } from "@/components/dashboard/ExportCard";
import { getUserPlan } from "@/lib/plans";
import XLogo from "@/components/icons/XLogo";
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

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const [exports, setExports] = useState<Export[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const plan = getUserPlan();

  // Get first name from session
  const firstName = session?.user?.name?.split(" ")[0];

  const fetchData = useCallback(async () => {
    try {
      const [exportsRes, connectionsRes] = await Promise.all([
        fetch("/api/exports"),
        fetch("/api/connections"),
      ]);
      const exportsData = await exportsRes.json();
      const connectionsData = await connectionsRes.json();
      setExports(exportsData.exports || []);
      setConnectedAccounts(connectionsData.accounts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCount = exports.length;
  const hasExports = exportCount > 0;
  const connectionCount = connectedAccounts.length;
  const hasXConnection = connectedAccounts.some(a => a.providerId === "twitter");

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
          ) : (
            <p className="text-3xl font-heading font-bold mt-1">{PLAN_LABELS[plan]}</p>
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
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-heading font-bold">{connectionCount}</p>
              {hasXConnection && (
                <XLogo className="w-4 h-4" />
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
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 -top-px relative"
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
