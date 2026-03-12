"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download04Icon,
  CrownIcon,
  UserMultipleIcon,
  Money01Icon,
  Clock01Icon,
  TradeUpIcon,
  TradeDownIcon,
} from "@hugeicons/core-free-icons";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
} from "@/components/ui/motion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import VsCta from "@/components/VsCta";
import Image from "next/image";

type OpenStats = {
  totalUsers: number;
  totalExports: number;
  proAccounts: number;
  proLifetime: number;
  activeTrials: number;
  totalRevenue: number;
  trendDays: number;
  trends: {
    users: number | null;
    exports: number | null;
    pro: number | null;
    trials: number | null;
  };
  exportsOverTime: { day: string; count: number }[];
  signupsOverTime: { day: string; count: number }[];
};

const STACK_GROUPS = [
  {
    label: "Infrastructure",
    items: [
      { name: "Hostinger", role: "Domain", cost: 1.91, logo: "/logos/stack/hostinger.svg" },
      { name: "Vercel", role: "Hosting", cost: 0, logo: "/logos/stack/vercel.svg", darkInvert: true },
      { name: "Supabase", role: "PostgreSQL", cost: 0, logo: "/logos/stack/supabase.svg" },
    ],
  },
  {
    label: "Application",
    items: [
      { name: "Next.js", role: "Framework", cost: 0, logo: "/logos/stack/nextjs.svg", darkInvert: true },
      { name: "Tailwind CSS", role: "Styling", cost: 0, logo: "/logos/stack/tailwind.svg" },
      { name: "shadcn/ui", role: "UI components", cost: 0, logo: "/logos/stack/shadcn.svg", darkInvert: true },
      { name: "Motion", role: "Animations", cost: 0, logo: "/logos/stack/motion.png" },
    ],
  },
  {
    label: "Services",
    items: [
      { name: "Inngest", role: "Cron jobs", cost: 0, logo: "/logos/stack/inngest.svg", darkInvert: true },
      { name: "Resend", role: "Emails", cost: 0, logo: "/logos/stack/resend.svg", darkInvert: true },
      { name: "Creem", role: "Payments", cost: 0, logo: "/logos/stack/creem.svg", darkInvert: true },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "PostHog", role: "Product analysis", cost: 0, logo: "/logos/stack/posthog.svg" },
      { name: "DataFast", role: "Analytics widget", cost: 9, logo: "/logos/stack/datafast.png" },
    ],
  },
];

const ALL_STACK_ITEMS = STACK_GROUPS.flatMap((g) => g.items);

const numberFormatter = (n: number) => n.toLocaleString("en-US");

const exportsChartConfig: ChartConfig = {
  count: {
    label: "Exports",
    color: "var(--primary)",
  },
};

const signupsChartConfig: ChartConfig = {
  count: {
    label: "Signups",
    color: "var(--chart-2)",
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TrendBadge({
  value,
  days,
}: {
  value: number | null;
  days: number;
}) {
  if (value === null) return null;

  const isPositive = value > 0;
  const isZero = value === 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium rounded-full px-2 py-0.5 ${
        isZero
          ? "text-muted-foreground bg-muted"
          : isPositive
            ? "text-emerald-600 bg-emerald-500/15"
            : "text-red-600 bg-red-500/15"
      }`}
    >
      {!isZero && (
        <HugeiconsIcon
          icon={isPositive ? TradeUpIcon : TradeDownIcon}
          size={12}
          strokeWidth={2.5}
        />
      )}
      {isZero ? "—" : `${Math.abs(value)}%`}
      <span className="text-[10px] opacity-60 ml-0.5">
        · vs prev {days}d
      </span>
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  loaded,
  prefix,
  suffix,
  trend,
  trendDays,
}: {
  icon: typeof Download04Icon;
  label: string;
  value: number;
  loaded: boolean;
  prefix?: string;
  suffix?: string;
  trend?: number | null;
  trendDays?: number;
}) {
  return (
    <div className="rounded-2xl border-fade p-4 md:p-5 h-full flex flex-col justify-center items-center">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
        {label}
      </p>
      <div className="text-2xl sm:text-3xl font-mono font-bold mt-2 flex justify-center">
        <AnimatePresence mode="wait">
          {loaded ? (
            <motion.span
              key="value"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {prefix}
              <AnimatedCounter value={value} formatter={numberFormatter} />
              {suffix}
            </motion.span>
          ) : (
            <motion.span
              key="skeleton"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block h-9 w-16 rounded-lg bg-muted-foreground/10 animate-pulse"
            />
          )}
        </AnimatePresence>
      </div>
      {loaded && trend !== undefined && trendDays && (
        <div className="mt-2 flex justify-center">
          <TrendBadge value={trend} days={trendDays} />
        </div>
      )}
    </div>
  );
}

function GrowthChart({
  title,
  data,
  config,
  colorVar,
  loaded,
}: {
  title: string;
  data: { day: string; count: number }[];
  config: ChartConfig;
  colorVar: string;
  loaded: boolean;
}) {
  if (!loaded) {
    return (
      <div className="rounded-2xl border-fade p-5 md:p-8">
        <div className="h-5 w-40 rounded bg-muted-foreground/10 animate-pulse mb-6" />
        <div className="aspect-video rounded-lg bg-muted-foreground/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-fade p-5 md:p-8">
      <h3 className="font-heading font-bold text-lg mb-6">{title}</h3>
      <ChartContainer config={config} className="h-50 w-full">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`fill-${colorVar}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--${colorVar})`} stopOpacity={0.3} />
              <stop offset="95%" stopColor={`var(--${colorVar})`} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => formatDate(value as string)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={`var(--${colorVar})`}
            strokeWidth={2}
            fill={`url(#fill-${colorVar})`}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export default function OpenPage() {
  const [stats, setStats] = useState<OpenStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/open")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const totalCost = ALL_STACK_ITEMS.reduce((sum, s) => sum + s.cost, 0);
  const trendDays = stats?.trendDays ?? 7;

  // Hide all trends if more than one is negative
  const trendValues = stats ? [stats.trends.users, stats.trends.exports, stats.trends.pro, stats.trends.trials] : [];
  const negativeCount = trendValues.filter((v) => v !== null && v < 0).length;
  const showTrends = negativeCount <= 1;

  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto py-8 md:py-16 mt-4 flex flex-col gap-24">
        {/* Hero */}
        <FadeInView>
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold">
              Open Stats
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto text-balance">
              Here&apos;s how we are currently doing.
              <br />
              Live metrics, revenue, growth and stack.
            </p>
          </div>
        </FadeInView>

        {/* Key Metrics */}
        <FadeInView delay={0.15}>
          <StaggerContainer
            staggerDelay={0.08}
            delayChildren={0.1}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            <StaggerItem>
              <StatCard
                icon={UserMultipleIcon}
                label="Registered users"
                value={stats?.totalUsers ?? 0}
                loaded={loaded}
                trend={showTrends ? stats?.trends.users : undefined}
                trendDays={trendDays}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={Clock01Icon}
                label="Active trials"
                value={stats?.activeTrials ?? 0}
                loaded={loaded}
                trend={showTrends ? stats?.trends.trials : undefined}
                trendDays={trendDays}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={CrownIcon}
                label="Pro accounts"
                value={stats?.proAccounts ?? 0}
                loaded={loaded}
                trend={showTrends ? stats?.trends.pro : undefined}
                trendDays={trendDays}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={Download04Icon}
                label="Visuals exported"
                value={stats?.totalExports ?? 0}
                loaded={loaded}
                trend={showTrends ? stats?.trends.exports : undefined}
                trendDays={trendDays}
              />
            </StaggerItem>
          </StaggerContainer>
        </FadeInView>

        {/* Revenue */}
        <FadeInView delay={0.25}>
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold">Revenue</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <StatCard
                icon={CrownIcon}
                label="Lifetime deals sold"
                value={stats?.proLifetime ?? 0}
                loaded={loaded}
              />
              <StatCard
                icon={Money01Icon}
                label="Total revenue"
                value={stats?.totalRevenue ?? 0}
                loaded={loaded}
                prefix="$"
              />
            </div>
          </div>
        </FadeInView>

        {/* Growth Charts */}
        <FadeInView delay={0.3}>
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold">Growth</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GrowthChart
                title="Exports (last 90 days)"
                data={stats?.exportsOverTime ?? []}
                config={exportsChartConfig}
                colorVar="primary"
                loaded={loaded}
              />
              <GrowthChart
                title="Signups (last 90 days)"
                data={stats?.signupsOverTime ?? []}
                config={signupsChartConfig}
                colorVar="chart-2"
                loaded={loaded}
              />
            </div>
          </div>
        </FadeInView>

        {/* Stack & Costs */}
        <FadeInView delay={0.35}>
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">
              Stack & Costs
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Total monthly cost:{" "}
              <span className="font-mono font-bold text-foreground">
                ${totalCost.toFixed(2)}
              </span>
            </p>
            <div className="space-y-8">
              {STACK_GROUPS.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {group.items.map((service) => (
                      <div
                        key={service.name}
                        className="rounded-xl border-fade p-4 flex items-start gap-3"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          {service.logo ? (
                            <Image
                              src={service.logo}
                              alt={service.name}
                              width={18}
                              height={18}
                              className={`w-4.5 h-4.5 object-contain${service.darkInvert ? " dark:invert" : ""}`}
                            />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {service.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-heading font-bold text-sm">
                            {service.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {service.role}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground mt-0.5">
                            {service.cost === 0
                              ? "Free"
                              : `$${service.cost % 1 === 0 ? service.cost : service.cost.toFixed(2)}/mo`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeInView>

        {/* CTA */}
        <FadeInView delay={0.4}>
          <VsCta />
        </FadeInView>
      </main>

      <Footer />
    </div>
  );
}
