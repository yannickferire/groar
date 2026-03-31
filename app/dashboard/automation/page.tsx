"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProGate from "@/components/dashboard/ProGate";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  AlertCircleIcon,
  Loading03Icon,
  Link01Icon,
  Add01Icon,
  Delete02Icon,
  Clock01Icon,
  RepeatIcon,
  Target01Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import XIcon from "@/components/icons/XIcon";
import Image from "next/image";
import CardPreview from "@/components/editor/CardPreview";
import { toast } from "sonner";
import { METRIC_ICONS } from "@/lib/metric-icons";
import {
  TRIGGER_LABELS,
  CARD_TEMPLATE_LABELS,
  formatMilestoneNumber,
  type AutoPostMetric,
  type AutoPostTrigger,
  type AutoPostCardTemplate,
  type AutomationVisualSettings,
} from "@/lib/auto-post-shared";

// ─── Types ──────────────────────────────────────────────────────────

type Automation = {
  id: string;
  name: string;
  metric: string; // single metric or JSON array for milestones
  trigger: AutoPostTrigger;
  cardTemplate: AutoPostCardTemplate;
  goal: number | null;
  tweetTemplate: string | null;
  visualSettings: AutomationVisualSettings;
  enabled: boolean;
  scheduleHour: number | null;
  scheduleDay: number;
  startDay: number | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Parse metric field: single string or JSON array */
function parseMetrics(raw: string): AutoPostMetric[] {
  if (raw.startsWith("[")) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch { /* fallback */ }
  }
  return [raw as AutoPostMetric];
}

type XAccount = {
  accountId: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  hasWriteScope: boolean;
  hasMediaScope: boolean;
  tokenExpired: boolean;
};

type AutoPostEntry = {
  id: string;
  metric: string;
  milestone: number;
  tweetId: string | null;
  tweetText: string;
  status: "posted" | "failed" | "skipped_limit" | "pending" | "queued" | "publishing";
  error: string | null;
  postedAt: string | null;
  createdAt: string;
  automationId: string | null;
};

type AutoPostStats = {
  postsThisMonth: number;
  failedThisMonth: number;
  skippedThisMonth: number;
};

// ─── Helpers ────────────────────────────────────────────────────────

const SCHEDULE_HOURS_UTC = [1, 7, 13, 19];

function closestScheduleHour(hour: number): number {
  return SCHEDULE_HOURS_UTC.reduce((prev, curr) =>
    Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
  );
}

/** Compute next scheduled post date for a daily/weekly automation */
function getNextScheduledDate(trigger: "daily" | "weekly", scheduleHour: number, scheduleDay: number): Date {
  const now = new Date();
  const target = new Date(now);
  const hour = closestScheduleHour(scheduleHour);
  target.setUTCHours(hour, 0, 0, 0);
  if (trigger === "weekly") {
    const currentDay = (now.getUTCDay() + 6) % 7; // Mon=0...Sun=6
    let daysUntil = scheduleDay - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && now >= target)) daysUntil += 7;
    target.setUTCDate(target.getUTCDate() + daysUntil);
  } else {
    if (now >= target) target.setUTCDate(target.getUTCDate() + 1);
  }
  return target;
}

function formatNextDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    + " " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatTimeUntil(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "now";
  const totalMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours === 0) return `in ${minutes}m`;
  if (minutes === 0) return `in ${hours}h`;
  return `in ${hours}h ${minutes}m`;
}

function CountdownText({ date }: { date: Date }) {
  const [text, setText] = useState(() => formatTimeUntil(date));
  useEffect(() => {
    const id = setInterval(() => setText(formatTimeUntil(date)), 60_000);
    return () => clearInterval(id);
  }, [date]);
  return <>{text}</>;
}

/** Calculate current day/week number from start date for preview heading */
function calculateDayNumber(startDay: number | null, startDate: string | null, trigger: string): number {
  const base = startDay ?? 1;
  if (!startDate) return base;
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (trigger === "weekly") return base + Math.floor(diffDays / 7);
  return base + diffDays;
}

// ─── Constants ──────────────────────────────────────────────────────

const METRIC_INFO: Record<AutoPostMetric, { label: string; source: string }> = {
  followers: { label: "Followers", source: "X" },
  mrr: { label: "MRR", source: "TrustMRR" },
  revenue: { label: "Revenue", source: "TrustMRR" },
};

// ─── Component ──────────────────────────────────────────────────────

export default function AutomationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [xAccount, setXAccount] = useState<XAccount | null>(null);
  const [history, setHistory] = useState<AutoPostEntry[]>([]);
  const [stats, setStats] = useState<AutoPostStats>({ postsThisMonth: 0, failedThisMonth: 0, skippedThisMonth: 0 });
  const [credits, setCredits] = useState<{ used: number; total: number; remaining: number; costPost: number; costVariant: number }>({ used: 0, total: 1000, remaining: 1000, costPost: 30, costVariant: 5 });
  const [nextMilestones, setNextMilestones] = useState<Record<string, number | null>>({});
  const [currentMetrics, setCurrentMetrics] = useState<Record<string, number>>({});
  const [connecting, setConnecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const autoRes = await fetch("/api/user/automations");

      if (autoRes.ok) {
        const data = await autoRes.json();
        setAutomations(data.automations || []);
        setXAccount(data.xAccount);
        setHistory(data.history || []);
        setStats(data.stats || { postsThisMonth: 0, failedThisMonth: 0, skippedThisMonth: 0 });
        if (data.credits) setCredits(data.credits);
        setNextMilestones(data.nextMilestones || {});
        setCurrentMetrics(data.currentMetrics || {});
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const connectX = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/connections/link-x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/dashboard/automation" }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } catch (err) {
      console.error("Connect X error:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const createAutomation = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/user/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const { automation } = await res.json();
        // Keep spinner active — component unmounts on navigation
        window.location.href = `/dashboard/automation/${automation.id}`;
        return;
      }
    } catch {
      // ignore
    }
    setCreating(false);
  }, []);

  const toggleAutomation = useCallback(async (id: string, enabled: boolean) => {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, enabled } : a));
    try {
      const res = await fetch(`/api/user/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok && enabled) {
        const data = await res.json();
        // Auto-disable other automations of the same frequency
        if (data.disabledIds?.length > 0) {
          setAutomations((prev) => prev.map((a) =>
            data.disabledIds.includes(a.id) ? { ...a, enabled: false } : a
          ));
          const current = automations.find((a) => a.id === id);
          const freqLabel = current?.trigger === "daily" ? "daily" : "weekly";
          toast.info(`${freqLabel.charAt(0).toUpperCase() + freqLabel.slice(1)} automation switched`, {
            description: `Only 1 ${freqLabel} automation can be active. The previous one has been disabled.`,
          });
        }
      }
    } catch {
      setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, enabled: !enabled } : a));
    }
  }, [automations]);

  const deleteAutomation = useCallback(async (id: string) => {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/user/automations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  // ─── Loading / gate ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Left: automation cards */}
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border-fade p-4 flex gap-4">
                <Skeleton className="shrink-0 w-40 h-24 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="ml-auto flex items-center gap-2">
                      <Skeleton className="h-5 w-9 rounded-full" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Right: stats + credits + history */}
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            {/* Credits */}
            <div className="rounded-2xl border-fade p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            {/* History */}
            <div className="rounded-2xl border-fade p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const needsReconnect = xAccount && (!xAccount.hasWriteScope || !xAccount.hasMediaScope || xAccount.tokenExpired);
  const noAccount = !xAccount;
  const canCreate = !noAccount && !needsReconnect;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-heading font-bold">Automation</h1>
          {xAccount && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {xAccount.profileImageUrl && (
                <Image src={xAccount.profileImageUrl} alt="" width={20} height={20} className="rounded-full" />
              )}
              <span>@{xAccount.username}</span>
            </div>
          )}
          {canCreate && (
            <Button onClick={createAutomation} disabled={creating} size="sm" className="gap-1.5 ml-auto hidden lg:inline-flex">
              {creating ? (
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              )}
              New automation
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Auto-post your milestones and metrics to X.
          <br />
          Try not to auto-post more than <span className="font-semibold text-foreground">once a day</span> to keep things authentic.{" "}
          You&apos;ll receive an <a href="/dashboard/settings" className="underline hover:text-foreground">email notification</a> for each post.
        </p>
        {canCreate && (
          <Button onClick={createAutomation} disabled={creating} size="sm" className="gap-1.5 lg:hidden">
            {creating ? (
              <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
            ) : (
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            )}
            New automation
          </Button>
        )}
      </div>

      {/* Reconnect / Connect banners */}
      {needsReconnect && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
          <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={1.5} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Reconnect X to enable auto-posting</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {xAccount?.tokenExpired
                ? "Your X session has expired. Please reconnect to resume auto-posting."
                : "Your X account needs updated permissions to post on your behalf."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={connectX}
            disabled={connecting}
            className="text-muted-foreground hover:text-foreground"
          >
            {connecting ? <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" /> : <HugeiconsIcon icon={Link01Icon} size={14} strokeWidth={2} />}
            Reconnect
          </Button>
        </div>
      )}

      {noAccount && (
        <div className="rounded-xl border border-muted bg-muted/30 p-4 flex items-center gap-3">
          <XIcon className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Connect your X account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Link your X account to start creating automations.</p>
          </div>
          <Button size="sm" onClick={connectX} disabled={connecting}>
            {connecting && <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />}
            Connect X
          </Button>
        </div>
      )}

      {/* ─── Two-column layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* ─── Left: Automations ─────────────────────────────────────── */}
        <div className="space-y-3">
          {automations.length === 0 && canCreate ? (
            <div className="text-center py-16 rounded-2xl border-fade">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-muted-foreground mb-4">No automations yet. Create your first one!</p>
              <Button onClick={createAutomation} disabled={creating} className="gap-1.5">
                {creating ? (
                  <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                )}
                Create automation
              </Button>
            </div>
          ) : (
            automations.map((automation) => {
              const metrics = parseMetrics(automation.metric);
              const primaryMetric = metrics[0];
              const metricLabel = metrics.length > 1
                ? metrics.map((m) => METRIC_INFO[m]?.label || m).join(", ")
                : METRIC_INFO[primaryMetric]?.label || primaryMetric;
              const metricIcon = METRIC_ICONS[primaryMetric];
              const triggerIcon = automation.trigger === "milestone" ? Target01Icon : RepeatIcon;
              return (
                <div
                  key={automation.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/dashboard/automation/${automation.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/automation/${automation.id}`)}
                  className="group rounded-2xl border-fade p-4 flex gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  {/* Preview thumbnail */}
                  <CardPreview
                    metric={primaryMetric}
                    extraMetrics={automation.cardTemplate === "metrics" && metrics.length > 1
                      ? metrics.slice(1).map(m => ({ metric: m, value: currentMetrics[m] || 0 }))
                      : undefined}
                    value={automation.trigger === "milestone"
                      ? (nextMilestones[primaryMetric] ?? currentMetrics[primaryMetric] ?? 1000)
                      : (currentMetrics[primaryMetric] || 1000)}
                    goal={automation.goal || undefined}
                    cardTemplate={automation.cardTemplate}
                    visualSettings={automation.visualSettings}
                    handle={xAccount?.username ? `@${xAccount.username}` : undefined}
                    headingText={automation.trigger !== "milestone"
                      ? `${automation.trigger === "weekly" ? "Week" : "Day"} ${calculateDayNumber(automation.startDay, automation.startDate, automation.trigger)}`
                      : undefined}
                    rounded="none"
                    className="shrink-0 w-40 rounded-lg overflow-hidden border border-muted/50"
                  />

                  {/* Right — name, toggle, details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top: name + next milestone + toggle + delete */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{automation.name}</span>
                      {automation.enabled && (() => {
                        if (automation.trigger === "milestone") {
                          const next = nextMilestones[primaryMetric];
                          if (next == null) return null;
                          return (
                            <span className="text-[11px] text-primary font-medium shrink-0">
                              Next: {["mrr", "revenue"].includes(primaryMetric) ? "$" : ""}
                              {formatMilestoneNumber(next)}
                            </span>
                          );
                        }
                        // daily/weekly — show next scheduled date
                        const nextDate = getNextScheduledDate(
                          automation.trigger as "daily" | "weekly",
                          automation.scheduleHour ?? 7,
                          automation.scheduleDay ?? 0,
                        );
                        return (
                          <span className="text-[11px] text-primary font-medium shrink-0">
                            Next: {formatNextDate(nextDate)}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-2 ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={automation.enabled}
                          onCheckedChange={(checked) => toggleAutomation(automation.id, checked)}
                          disabled={!canCreate}
                        />
                        <span className="text-xs text-muted-foreground">
                          {automation.enabled ? "Active" : "Inactive"}
                        </span>
                        {confirmDeleteId === automation.id ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className="text-destructive">Delete?</span>
                            <button type="button" onClick={() => deleteAutomation(automation.id)} className="font-semibold text-destructive hover:underline">Yes</button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-muted-foreground hover:underline">No</button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(automation.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded-lg hover:bg-muted"
                            title="Delete automation"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom: metric, trigger, template, next milestone — stacked */}
                    <div className="space-y-1.5 text-xs text-muted-foreground mt-2">
                      <p className="flex items-center gap-1.5">
                        {metricIcon && <HugeiconsIcon icon={metricIcon} size={13} strokeWidth={1.5} />}
                        {metricLabel}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={triggerIcon} size={13} strokeWidth={1.5} />
                        {TRIGGER_LABELS[automation.trigger]}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={DashboardSquare01Icon} size={13} strokeWidth={1.5} />
                        {CARD_TEMPLATE_LABELS[automation.cardTemplate]} visual design
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── Right: Credits + Stats + History ─────────────────────── */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border-fade p-3 text-center">
              <p className="text-lg font-heading font-bold">{stats.postsThisMonth}</p>
              <p className="text-[11px] text-muted-foreground">Posted</p>
            </div>
            <div className="rounded-xl border-fade p-3 text-center">
              <p className="text-lg font-heading font-bold">{stats.failedThisMonth}</p>
              <p className="text-[11px] text-muted-foreground">Failed</p>
            </div>
          </div>

          {/* Credits */}
          <div className={`rounded-2xl p-5 space-y-3 ${credits.remaining === 0 ? "border border-amber-500/30 bg-amber-500/5" : "border-fade"}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Credits</h2>
              <span className="text-[11px] text-muted-foreground">
                Resets {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-heading font-bold">{credits.remaining}</span>
                <span className="text-sm text-muted-foreground">/ {credits.total}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${credits.remaining < 100 ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${(credits.remaining / credits.total) * 100}%` }}
                />
              </div>
              {credits.remaining === 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Automations are paused until credits reset.
                </p>
              )}
            </div>
          </div>

          {/* Upcoming */}
          {(() => {
            const queuedEntries = history.filter((e) => e.status === "queued");
            const publishingEntries = history.filter((e) => e.status === "publishing");
            const scheduledAutos = automations.filter((a) => a.enabled && a.trigger !== "milestone" && a.scheduleHour != null);
            if (queuedEntries.length === 0 && publishingEntries.length === 0 && scheduledAutos.length === 0) return null;
            return (
              <div className="rounded-2xl border-fade p-5 space-y-3">
                <h2 className="text-sm font-medium">Upcoming</h2>
                {publishingEntries.map((entry) => {
                  const automation = automations.find((a) => a.id === entry.automationId);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 py-1.5">
                      <HugeiconsIcon icon={Loading03Icon} size={14} strokeWidth={1.5} className="text-primary shrink-0 animate-spin" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{METRIC_INFO[entry.metric as AutoPostMetric]?.label || entry.metric}</span>{" "}
                          <span className="text-muted-foreground">
                            {["mrr", "revenue"].includes(entry.metric) ? "$" : ""}
                            {entry.milestone.toLocaleString()}
                          </span>
                        </p>
                        {automation && (
                          <p className="text-[11px] text-muted-foreground truncate">{automation.name}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-primary font-medium shrink-0">Publishing...</span>
                    </div>
                  );
                })}
                {queuedEntries.map((entry) => {
                  const automation = automations.find((a) => a.id === entry.automationId);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 py-1.5">
                      <HugeiconsIcon icon={Target01Icon} size={14} strokeWidth={1.5} className="text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{METRIC_INFO[entry.metric as AutoPostMetric]?.label || entry.metric}</span>{" "}
                          <span className="text-muted-foreground">
                            {["mrr", "revenue"].includes(entry.metric) ? "$" : ""}
                            {entry.milestone.toLocaleString()}
                          </span>
                        </p>
                        {automation && (
                          <p className="text-[11px] text-muted-foreground truncate">{automation.name}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-amber-500 font-medium shrink-0">
                        {automation?.scheduleHour != null
                          ? `${automation.scheduleHour}:00 UTC`
                          : "Next cycle"}
                      </span>
                    </div>
                  );
                })}
                {scheduledAutos.map((auto) => {
                  const nextDate = getNextScheduledDate(
                    auto.trigger as "daily" | "weekly",
                    auto.scheduleHour!,
                    auto.scheduleDay
                  );
                  return (
                    <div key={auto.id} className="flex items-center gap-3 py-1.5">
                      <HugeiconsIcon icon={RepeatIcon} size={14} strokeWidth={1.5} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{auto.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate capitalize">{auto.trigger}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        <CountdownText date={nextDate} />
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* History */}
          <div className="rounded-2xl border-fade p-5 space-y-3">
            <h2 className="text-sm font-medium">Recent posts</h2>
            {(() => {
              const pastEntries = history.filter((e) => e.status !== "queued" && e.status !== "publishing");
              if (pastEntries.length === 0) {
                return <p className="text-sm text-muted-foreground">No posts yet.</p>;
              }

              const renderEntry = (entry: AutoPostEntry) => (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-muted/30 last:border-0">
                  {entry.status === "posted" ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={1.5} className="text-emerald-500 shrink-0" />
                  ) : entry.status === "failed" ? (
                    <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.5} className="text-red-500 shrink-0" />
                  ) : (
                    <HugeiconsIcon icon={AlertCircleIcon} size={14} strokeWidth={1.5} className="text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{METRIC_INFO[entry.metric as AutoPostMetric]?.label || entry.metric}</span>{" "}
                      <span className="text-muted-foreground">
                        {["mrr", "revenue"].includes(entry.metric) ? "$" : ""}
                        {entry.milestone.toLocaleString()}
                      </span>
                    </p>
                    {entry.error && <p className="text-[11px] text-red-400 truncate">{entry.error}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(entry.postedAt || entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {entry.tweetId && (
                      <a href={`https://x.com/i/web/status/${entry.tweetId}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">
                        View
                      </a>
                    )}
                  </div>
                </div>
              );

              const visibleEntries = pastEntries.slice(0, 5);
              const hasMore = pastEntries.length > 5;

              return (
                <>
                  {visibleEntries.map(renderEntry)}
                  {hasMore && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button type="button" className="text-xs text-primary hover:underline w-full text-center pt-1">
                          View all {pastEntries.length} posts
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>All posts</DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto -mx-1 px-1 space-y-0">
                          {pastEntries.map(renderEntry)}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
