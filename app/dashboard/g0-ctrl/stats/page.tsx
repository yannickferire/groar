"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Label } from "recharts";
import { BACKGROUNDS } from "@/lib/backgrounds";

type StatsData = {
  total: number;
  templates: { template: string; count: number }[];
  backgrounds: { backgroundId: string; count: number }[];
  metrics: { metric_type: string; count: number }[];
  metricCounts: { metric_count: number; exports: number }[];
  exportsOverTime: { day: string; count: number }[];
};

const PIE_COLORS = [
  "#f59e0b",  // primary (amber)
  "#3b82f6",  // blue
  "#10b981",  // emerald
  "#8b5cf6",  // violet
  "#ef4444",  // red
  "#06b6d4",  // cyan
  "#f97316",  // orange
  "#ec4899",  // pink
  "#22c55e",  // green
  "#a855f7",  // purple
  "#64748b",  // slate
  "#eab308",  // yellow
];

function formatMetricName(name: string): string {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Build chart configs from data
  const templateConfig = useMemo<ChartConfig>(() => {
    if (!data) return {};
    return Object.fromEntries(
      data.templates.map((t, i) => [t.template, { label: t.template.charAt(0).toUpperCase() + t.template.slice(1), color: PIE_COLORS[i % PIE_COLORS.length] }])
    );
  }, [data]);

  const metricConfig = useMemo<ChartConfig>(() => {
    if (!data) return {};
    return Object.fromEntries(
      data.metrics.map((m, i) => [m.metric_type, { label: formatMetricName(m.metric_type), color: PIE_COLORS[i % PIE_COLORS.length] }])
    );
  }, [data]);

  const backgroundConfig = useMemo<ChartConfig>(() => {
    if (!data) return {};
    return Object.fromEntries(
      data.backgrounds.map((b, i) => [b.backgroundId, { label: b.backgroundId, color: PIE_COLORS[i % PIE_COLORS.length] }])
    );
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

  const templateTotal = data.templates.reduce((s, t) => s + t.count, 0);
  const metricTotal = data.metrics.reduce((s, m) => s + m.count, 0);

  // Prepare bar chart data
  const barData = data.exportsOverTime.map((d) => ({
    date: new Date(d.day).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    count: d.count,
  }));

  // Prepare pie data
  const templatePieData = data.templates.map((t) => ({
    name: t.template,
    value: t.count,
    fill: templateConfig[t.template]?.color || PIE_COLORS[0],
  }));

  const metricPieData = data.metrics.map((m) => ({
    name: m.metric_type,
    value: m.count,
    fill: metricConfig[m.metric_type]?.color || PIE_COLORS[0],
  }));

  const backgroundPieData = data.backgrounds.slice(0, 10).map((b) => ({
    name: b.backgroundId,
    value: b.count,
    fill: backgroundConfig[b.backgroundId]?.color || PIE_COLORS[0],
  }));


  const barChartConfig: ChartConfig = {
    count: { label: "Exports", color: "#f59e0b" },
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/g0-ctrl">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} strokeWidth={2} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Export Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {templateTotal} total exports
          </p>
        </div>
      </div>

      {/* Exports over time — bar chart */}
      {barData.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Exports (last 30 days)</h2>
          <div className="rounded-xl border-fade p-4">
            <ChartContainer config={barChartConfig} className="h-48 w-full">
              <BarChart data={barData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Templates pie */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Templates</h2>
          <div className="rounded-xl border-fade p-4">
            <ChartContainer config={templateConfig} className="h-64 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={templatePieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {templatePieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-primary text-2xl font-bold">{templateTotal}</tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-xs">exports</tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {data.templates.map((t, i) => (
                <div key={t.template} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="capitalize">{t.template}</span>
                  <span className="text-muted-foreground">({Math.round((t.count / templateTotal) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Metrics pie */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Metrics used</h2>
          <div className="rounded-xl border-fade p-4">
            <ChartContainer config={metricConfig} className="h-64 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={metricPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {metricPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-primary text-2xl font-bold">{metricTotal}</tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-xs">uses</tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {data.metrics.map((m, i) => (
                <div key={m.metric_type} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span>{formatMetricName(m.metric_type)}</span>
                  <span className="text-muted-foreground">({Math.round((m.count / metricTotal) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </section>



      </div>

      {/* Backgrounds — thumbnail + bar */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Backgrounds ({data.backgrounds.length})</h2>
        <div className="rounded-xl border-fade p-4 space-y-1.5">
          {(() => {
            const bgTotal = data.backgrounds.reduce((s, b) => s + b.count, 0);
            const maxCount = data.backgrounds[0]?.count || 1;
            const bgMap = new Map(BACKGROUNDS.map((bg) => [bg.id, bg]));
            return data.backgrounds.map((b) => {
              const bg = bgMap.get(b.backgroundId);
              const pct = Math.round((b.count / bgTotal) * 100);
              const barWidth = Math.round((b.count / maxCount) * 100);
              return (
                <div key={b.backgroundId} className="flex items-center gap-2 h-8">
                  {/* Thumbnail */}
                  <div className="w-8 h-8 rounded shrink-0 overflow-hidden border border-border/50">
                    {bg?.image ? (
                      <img src={bg.image} alt={bg.name || b.backgroundId} className="w-full h-full object-cover" />
                    ) : bg?.gradient || bg?.color ? (
                      <div className="w-full h-full" style={{ background: bg.gradient || bg.color }} />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  {/* Name */}
                  <span className="text-xs w-32 shrink-0 truncate">{bg?.name || b.backgroundId}</span>
                  {/* Bar */}
                  <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-500/80 rounded"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  {/* Count */}
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{b.count} ({pct}%)</span>
                </div>
              );
            });
          })()}
        </div>
      </section>
    </div>
  );
}
