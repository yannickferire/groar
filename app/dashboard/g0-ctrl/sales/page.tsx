"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type Sale = {
  name: string | null;
  email: string | null;
  xUsername: string | null;
  signupAt: string;
  trialStart: string | null;
  paidAt: string;
  billingPeriod: string;
  hadTrial: boolean;
  minutesToPay: number;
  minutesTrialToPay: number | null;
  exportCount: number;
};

type SalesData = {
  total: number;
  withTrial: number;
  withoutTrial: number;
  monthly: number;
  lifetime: number;
  conversionTimeBuckets: Record<string, number>;
  sales: Sale[];
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function getDurationColor(minutes: number | null): string {
  if (minutes == null) return "text-muted-foreground";
  if (minutes < 5) return "text-emerald-500";
  if (minutes < 60) return "text-amber-500";
  if (minutes < 1440) return "text-orange-500";
  return "text-red-500";
}

const chartConfig: ChartConfig = {
  count: { label: "Sales", color: "hsl(var(--chart-1))" },
};

export default function SalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/sales")
      .then((res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.conversionTimeBuckets).map(([label, count]) => ({
      label,
      count,
    }));
  }, [data]);

  const instantBuyRate = useMemo(() => {
    if (!data || data.total === 0) return 0;
    const instant = (data.conversionTimeBuckets["< 5 min"] || 0) + (data.conversionTimeBuckets["5-60 min"] || 0);
    return Math.round((instant / data.total) * 100);
  }, [data]);

  const withinTrialRate = useMemo(() => {
    if (!data || data.total === 0) return 0;
    const withinTrial = (data.conversionTimeBuckets["< 5 min"] || 0) + (data.conversionTimeBuckets["5-60 min"] || 0) + (data.conversionTimeBuckets["1h - 24h"] || 0) + (data.conversionTimeBuckets["1-3 days"] || 0);
    return Math.round((withinTrial / data.total) * 100);
  }, [data]);

  const afterTrialRate = useMemo(() => {
    if (!data || data.total === 0) return 0;
    const after = data.conversionTimeBuckets["3+ days"] || 0;
    return Math.round((after / data.total) * 100);
  }, [data]);

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/g0-ctrl">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} strokeWidth={2} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Sales Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data.total} paying customers</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Total sales</p>
          <p className="text-2xl font-heading font-bold mt-1">{data.total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">lifetime with trial</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Instant buy ({"< 1h"})</p>
          <p className="text-2xl font-heading font-bold mt-1">{instantBuyRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(data.conversionTimeBuckets["< 5 min"] || 0) + (data.conversionTimeBuckets["5-60 min"] || 0)} / {data.total}
          </p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Buy within trial</p>
          <p className="text-2xl font-heading font-bold mt-1">{withinTrialRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(data.conversionTimeBuckets["< 5 min"] || 0) + (data.conversionTimeBuckets["5-60 min"] || 0) + (data.conversionTimeBuckets["1h - 24h"] || 0) + (data.conversionTimeBuckets["1-3 days"] || 0)} / {data.total}
          </p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Buy after trial</p>
          <p className="text-2xl font-heading font-bold mt-1">{afterTrialRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.conversionTimeBuckets["3+ days"] || 0} / {data.total}
          </p>
        </div>
      </div>

      {/* Conversion time chart */}
      <div className="rounded-2xl border-fade p-5">
        <h2 className="text-sm font-medium mb-4">Time from trial start to purchase</h2>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Sales table */}
      <div className="rounded-2xl border-fade overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left font-medium px-4 py-3">Customer</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Plan</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Signup</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Trial start</th>
              <th className="text-left font-medium px-4 py-3">Paid at</th>
              <th className="text-right font-medium px-4 py-3">Time to buy</th>
              <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">Exports</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.map((sale, i) => (
              <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-xs">{sale.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sale.xUsername ? `@${sale.xUsername}` : sale.email || "—"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sale.billingPeriod === "lifetime"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {sale.billingPeriod}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground">{formatDate(sale.signupAt)}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground">{formatDate(sale.trialStart)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">{formatDate(sale.paidAt)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-bold ${getDurationColor(sale.hadTrial ? sale.minutesTrialToPay : sale.minutesToPay)}`}>
                    {formatDuration(sale.hadTrial ? sale.minutesTrialToPay : sale.minutesToPay)}
                  </span>
                  {!sale.hadTrial && (
                    <span className="text-[10px] text-muted-foreground ml-1">direct</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">{sale.exportCount}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
