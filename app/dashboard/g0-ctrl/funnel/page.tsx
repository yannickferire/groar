"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ArrowDown01Icon,
  Mail01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ─── Types ───

type FunnelUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  xUsername: string | null;
  userCreatedAt: string;
  brandingLogoUrl: string | null;
  plan: string | null;
  status: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  billingPeriod: string | null;
  exportCount: number;
  currentStreak: number;
  longestStreak: number;
  leaderboardScore: number;
  lastLoginDate: string | null;
  totalLoginDays: number;
  uniqueTemplatesCount: number;
  uniqueBackgroundsCount: number;
  providers: string | null;
  hasX: boolean;
  hasTrustMRR: boolean;
  hasApiKey: boolean;
  templateCount: number;
  presetCount: number;
  hasBranding: boolean;
  badgeCount: number;
  feedbackCount: number;
  firstExportAt: string | null;
  lastExportAt: string | null;
  secondTrialAt: string | null;
};

type Stage =
  | "all"
  | "signed_up"
  | "first_export"
  | "trial_started"
  | "active_trial"
  | "trial_expired_no_convert"
  | "multi_export"
  | "converted";

type HeatLevel = "hot" | "warm" | "cold" | "inactive" | "converted";

// ─── Lead Scoring ───

function computeLeadScore(user: FunnelUser): number {
  // Skip Pro users — they already converted
  if (isPro(user)) return -1;

  let score = 0;

  // Recency (0-25)
  const lastActive = user.lastLoginDate || user.lastExportAt || user.userCreatedAt;
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActive <= 1) score += 25;
  else if (daysSinceActive <= 3) score += 20;
  else if (daysSinceActive <= 7) score += 15;
  else if (daysSinceActive <= 14) score += 10;
  else if (daysSinceActive <= 30) score += 5;

  // Engagement (0-35)
  score += Math.min(user.exportCount * 4, 18);
  score += Math.min(user.totalLoginDays * 1.5, 9);
  score += Math.min(user.currentStreak * 2, 8);

  // Setup signals (0-20)
  if (user.hasX) score += 6;
  if (user.hasTrustMRR) score += 5;
  if (user.hasApiKey) score += 4;
  if (user.hasBranding) score += 3;
  if (user.presetCount > 0) score += 2;

  // Intent (0-20)
  if (user.trialStart) score += 8;
  if (user.feedbackCount > 0) score += 5;
  if (user.templateCount > 0) score += 4;
  if (user.uniqueTemplatesCount >= 2) score += 3;

  return Math.min(score, 100);
}

function getHeatLevel(user: FunnelUser): HeatLevel {
  if (isPro(user)) return "converted";
  const score = computeLeadScore(user);
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  if (score >= 15) return "cold";
  return "inactive";
}

function isPro(user: FunnelUser): boolean {
  return (
    user.status === "active" &&
    user.plan !== null &&
    user.plan !== "free"
  );
}

function isActiveTrial(user: FunnelUser): boolean {
  return (
    user.status === "trialing" &&
    !!user.trialEnd &&
    new Date(user.trialEnd) > new Date()
  );
}

function isExpiredTrialNoConvert(user: FunnelUser): boolean {
  return (
    user.status === "trialing" &&
    !!user.trialEnd &&
    new Date(user.trialEnd) <= new Date() &&
    !isPro(user)
  );
}

function getUserStage(user: FunnelUser): Stage {
  if (isPro(user)) return "converted";
  if (isActiveTrial(user)) return "active_trial";
  if (isExpiredTrialNoConvert(user)) return "trial_expired_no_convert";
  if (user.trialStart && user.exportCount > 1) return "multi_export";
  if (user.trialStart) return "trial_started";
  if (user.exportCount > 0) return "first_export";
  return "signed_up";
}

// ─── Helpers ───

function formatShortDate(date: string | null) {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysAgo(date: string | null): string {
  if (!date) return "--";
  const d = Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

// ─── Components ───

function HeatBadge({ level, score }: { level: HeatLevel; score: number }) {
  const config: Record<HeatLevel, { label: string; className: string }> = {
    hot: {
      label: `🔥 Hot (${score})`,
      className: "bg-red-500/10 text-red-600 border-red-500/30",
    },
    warm: {
      label: `Warm (${score})`,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
    cold: {
      label: `Cold (${score})`,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    },
    inactive: {
      label: `Inactive (${score})`,
      className: "bg-muted text-muted-foreground border-border",
    },
    converted: {
      label: "Pro",
      className: "bg-green-500/10 text-green-600 border-green-500/30",
    },
  };
  const c = config[level];
  return <Badge className={c.className}>{c.label}</Badge>;
}

function UserAvatar({ user }: { user: FunnelUser }) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name || "User avatar"}
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
      {(user.name || user.email || "?")[0].toUpperCase()}
    </div>
  );
}

function FunnelBar({
  label,
  count,
  total,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const widthPct = total > 0 ? Math.max((count / total) * 100, 8) : 8;
  return (
    <button
      onClick={onClick}
      className={`group text-left transition-all rounded-lg px-3 py-2 cursor-pointer ${
        active
          ? "bg-foreground/5 ring-1 ring-foreground/10"
          : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </button>
  );
}

// ─── Email Journey ───

const EMAIL_JOURNEY = [
  {
    stage: "Signup",
    emails: [
      {
        name: "Welcome email",
        trigger: "Immediately on signup",
        template: "welcomeEmail",
      },
    ],
  },
  {
    stage: "Trial started",
    emails: [
      {
        name: "Admin notification",
        trigger: "Immediately (to admin)",
        template: "newTrialNotificationEmail",
      },
    ],
  },
  {
    stage: "Trial ending",
    emails: [
      {
        name: "Trial ending in 24h",
        trigger: "24h before trial end",
        template: "trialEndingEmail",
      },
    ],
  },
  {
    stage: "Trial expired",
    emails: [
      {
        name: "Trial expired",
        trigger: "At trial end",
        template: "trialExpiredEmail",
      },
      {
        name: "Follow-up pricing",
        trigger: "5 days after trial end",
        template: "trialFollowUpEmail",
      },
      {
        name: "25% discount (hot leads)",
        trigger: "7 days after trial end (if >2 exports AND X/MRR/branding) — auto",
        template: "hotLeadDiscountEmail",
      },
      {
        name: "Second chance trial (cold leads)",
        trigger: "10 days after trial end (if <=1 export) — auto",
        template: "secondChanceTrialEmail",
      },
    ],
  },
  {
    stage: "Converted to Pro",
    emails: [
      {
        name: "Subscription confirmed",
        trigger: "On purchase",
        template: "subscriptionConfirmedEmail",
      },
    ],
  },
  {
    stage: "Milestone",
    emails: [
      {
        name: "Milestone reached",
        trigger: "On milestone detection (followers, MRR, etc.)",
        template: "milestoneEmail",
      },
    ],
  },
  {
    stage: "API quota",
    emails: [
      { name: "80% usage", trigger: "At 80% quota", template: "apiQuota80Email" },
      { name: "100% usage", trigger: "At 100% (grace starts)", template: "apiQuota100Email" },
      { name: "120% exceeded", trigger: "At 120% (paused)", template: "apiQuota120Email" },
    ],
  },
  {
    stage: "Win-back",
    emails: [
      {
        name: "Win-back",
        trigger: "Manual — lapsed users",
        template: "winBackEmail",
      },
    ],
  },
];

// ─── Main Page ───

export default function FunnelPage() {
  const [users, setUsers] = useState<FunnelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage>("all");
  const [heatFilter, setHeatFilter] = useState<HeatLevel | "all">("all");
  const [grantingTrialId, setGrantingTrialId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [batchReengaging, setBatchReengaging] = useState(false);
  const [batchResult, setBatchResult] = useState<{ hot: number; cold: number; skipped: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/funnel")
      .then((res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then((data) => setUsers(data.users || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // ─── Funnel counts ───
  const funnel = useMemo(() => {
    const total = users.length;
    const signedUp = total;
    const hadExport = users.filter((u) => u.exportCount > 0).length;
    const trialStarted = users.filter((u) => u.trialStart).length;
    const activeTrial = users.filter(isActiveTrial).length;
    const multiExport = users.filter(
      (u) => u.exportCount > 1 && !isPro(u)
    ).length;
    const expiredNoConvert = users.filter(isExpiredTrialNoConvert).length;
    const converted = users.filter(isPro).length;

    return {
      total,
      signedUp,
      hadExport,
      trialStarted,
      activeTrial,
      multiExport,
      expiredNoConvert,
      converted,
    };
  }, [users]);

  // ─── Heat distribution ───
  const heatCounts = useMemo(() => {
    const c = { hot: 0, warm: 0, cold: 0, inactive: 0, converted: 0 };
    for (const u of users) {
      c[getHeatLevel(u)]++;
    }
    return c;
  }, [users]);

  // ─── Filtered users ───
  const filtered = useMemo(() => {
    let list = users;

    if (stageFilter !== "all") {
      list = list.filter((u) => getUserStage(u) === stageFilter);
    }

    if (heatFilter !== "all") {
      list = list.filter((u) => getHeatLevel(u) === heatFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.xUsername && u.xUsername.toLowerCase().includes(q))
      );
    }

    // Sort by lead score descending (Pro users last)
    return list.sort((a, b) => {
      const scoreA = computeLeadScore(a);
      const scoreB = computeLeadScore(b);
      if (scoreA === -1 && scoreB === -1) return 0;
      if (scoreA === -1) return 1;
      if (scoreB === -1) return -1;
      return scoreB - scoreA;
    });
  }, [users, stageFilter, heatFilter, search]);

  // ─── Actions ───
  const grantTrial = useCallback(async (userId: string) => {
    setGrantingTrialId(userId);
    try {
      const res = await fetch("/api/admin/users/grant-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: "trialing",
                trialStart: new Date().toISOString(),
                trialEnd: new Date(
                  Date.now() + 3 * 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : u
        )
      );
    } catch {
      alert("Failed to grant trial");
    } finally {
      setGrantingTrialId(null);
    }
  }, []);

  // Count eligible old leads for batch re-engage
  const batchEligibleCount = useMemo(() => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    return users.filter(
      (u) =>
        u.status === "trialing" &&
        u.trialEnd &&
        new Date(u.trialEnd) <= tenDaysAgo &&
        !isPro(u) &&
        !u.secondTrialAt
    ).length;
  }, [users]);

  const batchReengage = useCallback(async () => {
    if (!confirm(`This will send emails to ~${batchEligibleCount} old leads (hot → discount, cold → second trial). Continue?`)) return;
    setBatchReengaging(true);
    setBatchResult(null);
    try {
      const res = await fetch("/api/admin/users/batch-reengage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBatchResult(data);
    } catch {
      alert("Batch re-engage failed");
    } finally {
      setBatchReengaging(false);
    }
  }, [batchEligibleCount]);

  const sendSecondChanceEmail = useCallback(async (userId: string) => {
    setSendingEmailId(userId);
    try {
      const res = await fetch("/api/admin/users/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, template: "second-chance-trial" }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      alert("Failed to send email");
    } finally {
      setSendingEmailId(null);
    }
  }, []);

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center py-32">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const stageFilters: { key: Stage; label: string; count: number }[] = [
    { key: "all", label: "All", count: funnel.total },
    { key: "signed_up", label: "Signed up only", count: users.filter((u) => getUserStage(u) === "signed_up").length },
    { key: "first_export", label: "1 export", count: users.filter((u) => getUserStage(u) === "first_export").length },
    { key: "trial_started", label: "Trial started", count: users.filter((u) => getUserStage(u) === "trial_started").length },
    { key: "active_trial", label: "Active trial", count: funnel.activeTrial },
    { key: "trial_expired_no_convert", label: "Trial expired", count: funnel.expiredNoConvert },
    { key: "multi_export", label: "Multi export", count: users.filter((u) => getUserStage(u) === "multi_export").length },
    { key: "converted", label: "Pro", count: funnel.converted },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">User Funnel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {funnel.converted} converted / {funnel.total} users (
            {funnel.total > 0
              ? Math.round((funnel.converted / funnel.total) * 100)
              : 0}
            %)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {batchEligibleCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={batchReengaging}
              onClick={batchReengage}
            >
              {batchReengaging ? "Sending..." : `Re-engage ${batchEligibleCount} old leads`}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/g0-ctrl">Back to Admin</Link>
          </Button>
        </div>
      </div>

      {/* Batch result */}
      {batchResult && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm">
          Batch re-engage done: <strong>{batchResult.hot}</strong> hot leads (discount sent),{" "}
          <strong>{batchResult.cold}</strong> cold leads (second trial granted),{" "}
          <strong>{batchResult.skipped}</strong> skipped. Total: {batchResult.total}.
        </div>
      )}

      {/* Funnel Visualization */}
      <div className="rounded-2xl border-fade p-5 space-y-1">
        <h2 className="text-sm font-medium mb-3">Conversion Funnel</h2>
        <FunnelBar
          label="Signed up"
          count={funnel.signedUp}
          total={funnel.total}
          color="bg-foreground/20"
          active={stageFilter === "signed_up"}
          onClick={() =>
            setStageFilter(stageFilter === "signed_up" ? "all" : "signed_up")
          }
        />
        <FunnelBar
          label="First export"
          count={funnel.hadExport}
          total={funnel.total}
          color="bg-blue-500"
          active={stageFilter === "first_export"}
          onClick={() =>
            setStageFilter(
              stageFilter === "first_export" ? "all" : "first_export"
            )
          }
        />
        <FunnelBar
          label="Trial started"
          count={funnel.trialStarted}
          total={funnel.total}
          color="bg-violet-500"
          active={stageFilter === "trial_started"}
          onClick={() =>
            setStageFilter(
              stageFilter === "trial_started" ? "all" : "trial_started"
            )
          }
        />
        <FunnelBar
          label="Multiple exports (2+)"
          count={funnel.multiExport + funnel.converted}
          total={funnel.total}
          color="bg-amber-500"
          active={stageFilter === "multi_export"}
          onClick={() =>
            setStageFilter(
              stageFilter === "multi_export" ? "all" : "multi_export"
            )
          }
        />
        <FunnelBar
          label="Converted to Pro"
          count={funnel.converted}
          total={funnel.total}
          color="bg-green-500"
          active={stageFilter === "converted"}
          onClick={() =>
            setStageFilter(stageFilter === "converted" ? "all" : "converted")
          }
        />
      </div>

      {/* Drop-off Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">
            Signup &rarr; 1st export
          </p>
          <p className="text-2xl font-heading font-bold mt-1">
            {funnel.total > 0
              ? Math.round((funnel.hadExport / funnel.total) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {funnel.total - funnel.hadExport} lost
          </p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">
            Signup &rarr; Trial
          </p>
          <p className="text-2xl font-heading font-bold mt-1">
            {funnel.total > 0
              ? Math.round((funnel.trialStarted / funnel.total) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {funnel.total - funnel.trialStarted} never tried
          </p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">
            Trial &rarr; Pro
          </p>
          <p className="text-2xl font-heading font-bold mt-1">
            {funnel.trialStarted > 0
              ? Math.round((funnel.converted / funnel.trialStarted) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {funnel.expiredNoConvert} expired
          </p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">
            Expired trials, &le;1 export
          </p>
          <p className="text-2xl font-heading font-bold mt-1">
            {users.filter(
              (u) => isExpiredTrialNoConvert(u) && u.exportCount <= 1
            ).length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            re-engagement candidates
          </p>
        </div>
      </div>

      {/* Heat Distribution */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "all" as const, label: `All (${funnel.total})` },
            { key: "hot" as const, label: `Hot (${heatCounts.hot})` },
            { key: "warm" as const, label: `Warm (${heatCounts.warm})` },
            { key: "cold" as const, label: `Cold (${heatCounts.cold})` },
            {
              key: "inactive" as const,
              label: `Inactive (${heatCounts.inactive})`,
            },
            {
              key: "converted" as const,
              label: `Pro (${heatCounts.converted})`,
            },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setHeatFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              heatFilter === f.key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Email Journey */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none group/trigger">
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={12}
            strokeWidth={2}
            className="transition-transform group-data-[state=open]/trigger:rotate-180"
          />
          Email Journey Map
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 rounded-2xl border-fade overflow-hidden">
            {EMAIL_JOURNEY.map((stage, i) => (
              <div
                key={stage.stage}
                className={`px-4 py-3 ${
                  i > 0 ? "border-t border-border/50" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-xs font-medium">{stage.stage}</span>
                </div>
                <div className="ml-4 space-y-1.5">
                  {stage.emails.map((email) => (
                    <div
                      key={email.template}
                      className="flex items-start gap-2 text-xs"
                    >
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={12}
                        strokeWidth={2}
                        className="text-muted-foreground shrink-0 mt-0.5"
                      />
                      <div>
                        <span className="font-medium">{email.name}</span>
                        <span className="text-muted-foreground ml-1.5">
                          — {email.trigger}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Search + Stage Filters */}
      <div className="space-y-3">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by name, email or X handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {stageFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStageFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                stageFilter === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="rounded-2xl border-fade overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left font-medium px-4 py-3">User</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">
                Score
              </th>
              <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">
                Signals
              </th>
              <th className="text-right font-medium px-4 py-3 hidden md:table-cell">
                Exports
              </th>
              <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">
                Last active
              </th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const score = computeLeadScore(user);
              const heat = getHeatLevel(user);
              const canGrantTrial =
                !isPro(user) &&
                !isActiveTrial(user) &&
                isExpiredTrialNoConvert(user) &&
                user.exportCount <= 1;
              const canSendEmail = canGrantTrial;

              return (
                <tr
                  key={user.id}
                  className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">
                          {user.name || "--"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {user.email}
                          {user.xUsername && ` · @${user.xUsername}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <HeatBadge level={heat} score={score} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {user.hasX && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          X
                        </span>
                      )}
                      {user.hasTrustMRR && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          MRR
                        </span>
                      )}
                      {user.hasApiKey && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          API
                        </span>
                      )}
                      {user.hasBranding && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Logo
                        </span>
                      )}
                      {user.trialStart && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600">
                          {user.secondTrialAt ? "2nd Trial" : "Trial"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {user.exportCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {daysAgo(
                        user.lastLoginDate ||
                          user.lastExportAt ||
                          user.userCreatedAt
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {canSendEmail && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={sendingEmailId === user.id}
                          onClick={() => sendSecondChanceEmail(user.id)}
                          title="Send second chance email"
                        >
                          {sendingEmailId === user.id ? (
                            <HugeiconsIcon
                              icon={Loading03Icon}
                              size={14}
                              strokeWidth={2}
                              className="animate-spin"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={Mail01Icon}
                              size={14}
                              strokeWidth={2}
                              className="text-muted-foreground"
                            />
                          )}
                        </Button>
                      )}
                      {canGrantTrial && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          disabled={grantingTrialId === user.id}
                          onClick={() => grantTrial(user.id)}
                        >
                          {grantingTrialId === user.id
                            ? "Granting..."
                            : "Grant trial"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
