"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  Loading03Icon,
  Tick02Icon,
  Delete02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "sonner";
import XPostPreview from "@/components/XPostPreview";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { FONT_LIST } from "@/lib/fonts";
import { getAppleEmojiUrl } from "@/lib/emoji";
import {
  AUTO_POST_METRICS,
  CARD_TEMPLATE_LABELS,
  DEFAULT_TEMPLATES,
  PROGRESS_TEMPLATES,
  TRIGGERS,
  getDefaultTemplates,
  parseTweetVariants,
  serializeTweetVariants,
  type AutoPostMetric,
  type AutoPostTrigger,
  type AutoPostCardTemplate,
  type AutomationVisualSettings,
} from "@/lib/auto-post-shared";

// ─── Types ──────────────────────────────────────────────────────────

type Automation = {
  id: string;
  name: string;
  metric: string; // single metric or JSON array
  trigger: AutoPostTrigger;
  cardTemplate: AutoPostCardTemplate;
  goal: number | null;
  tweetTemplate: string | null;
  visualSettings: AutomationVisualSettings;
  enabled: boolean;
  scheduleHour: number | null;
  scheduleDay: number;
  startDay: number;
  startDate: string;
};

type XAccount = {
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  hasWriteScope: boolean;
};

// ─── Constants ──────────────────────────────────────────────────────

const METRIC_INFO: Record<AutoPostMetric, { label: string; source: "x" | "trustmrr" }> = {
  followers: { label: "Followers", source: "x" },
  mrr: { label: "MRR", source: "trustmrr" },
  revenue: { label: "Revenue", source: "trustmrr" },
};

const PRESET_EMOJIS = [
  { emoji: "🎉", unified: "1f389", name: "Party Popper" },
  { emoji: "🔥", unified: "1f525", name: "Fire" },
  { emoji: "🚀", unified: "1f680", name: "Rocket" },
  { emoji: "⭐", unified: "2b50", name: "Star" },
  { emoji: "🏆", unified: "1f3c6", name: "Trophy" },
  { emoji: "💰", unified: "1f4b0", name: "Money Bag" },
  { emoji: "📈", unified: "1f4c8", name: "Chart Increasing" },
  { emoji: "🐯", unified: "1f42f", name: "Tiger Face" },
  { emoji: "💎", unified: "1f48e", name: "Gem Stone" },
  { emoji: "🎯", unified: "1f3af", name: "Bullseye" },
];

const ALL_TEMPLATE_VARIABLES = [
  { name: "{milestone}", desc: "Milestone value (e.g. 1K)", templates: ["milestone"] as AutoPostCardTemplate[] },
  { name: "{value}", desc: "Current value", templates: ["milestone", "metrics", "progress"] as AutoPostCardTemplate[] },
  { name: "{goal}", desc: "Goal target", templates: ["progress"] as AutoPostCardTemplate[] },
  { name: "{metric}", desc: "Metric name", templates: ["milestone", "metrics", "progress"] as AutoPostCardTemplate[] },
  { name: "{period}", desc: "Day or week counter number", templates: ["metrics"] as AutoPostCardTemplate[] },
];

// Available schedule hours (UTC) — aligned with Inngest cron
const SCHEDULE_HOURS_UTC = [1, 7, 13, 15, 19];

/** Convert UTC hour to local hour string (e.g. "9:00 AM") */
function utcHourToLocal(utcHour: number): string {
  const d = new Date();
  d.setUTCHours(utcHour, utcHour === 15 ? 30 : 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Find the closest available UTC hour to the given hour */
function closestScheduleHour(hour: number): number {
  return SCHEDULE_HOURS_UTC.reduce((prev, curr) =>
    Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
  );
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Helpers ────────────────────────────────────────────────────────

/** Toggle an item in an array (add if missing, remove if present — keep at least 1) */
function toggleInArray<T>(arr: T[], item: T): T[] {
  const idx = arr.indexOf(item);
  if (idx >= 0) {
    if (arr.length <= 1) return arr; // keep at least 1
    return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
  }
  return [...arr, item];
}

/** Parse metric field: single string "followers" or JSON array '["followers","mrr"]' */
function parseMetrics(raw: string): AutoPostMetric[] {
  if (raw.startsWith("[")) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch { /* fallback */ }
  }
  return [raw as AutoPostMetric];
}

function serializeMetrics(metrics: AutoPostMetric[]): string {
  if (metrics.length === 1) return metrics[0];
  return JSON.stringify(metrics);
}

// ─── Component ──────────────────────────────────────────────────────

export default function AutomationEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [xAccount, setXAccount] = useState<XAccount | null>(null);
  const [trustmrrConnected, setTrustmrrConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generatingVariant, setGeneratingVariant] = useState(false);
  const [testingPost, setTestingPost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [brandingLogos, setBrandingLogos] = useState<{ id: string; url: string }[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<Record<string, number>>({});
  const [nextMilestones, setNextMilestones] = useState<Record<string, number | null>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastFocusedTextarea = useRef<{ index: number; el: HTMLTextAreaElement } | null>(null);

  // Fetch automation + X account + TrustMRR status
  useEffect(() => {
    (async () => {
      try {
        const [autoRes, accountRes, brandingRes, planRes] = await Promise.all([
          fetch(`/api/user/automations/${id}`),
          fetch("/api/user/automations"),
          fetch("/api/user/branding"),
          fetch("/api/user/plan"),
        ]);
        if (autoRes.ok) {
          const { automation: a } = await autoRes.json();
          setAutomation(a);
        }
        if (accountRes.ok) {
          const data = await accountRes.json();
          setXAccount(data.xAccount);
          setTrustmrrConnected(data.trustmrrConnected ?? false);
          if (data.currentMetrics) setCurrentMetrics(data.currentMetrics);
          if (data.nextMilestones) setNextMilestones(data.nextMilestones);
        }
        if (brandingRes.ok) {
          const data = await brandingRes.json();
          if (data?.logos) setBrandingLogos(data.logos);
        }
        if (planRes.ok) {
          const data = await planRes.json();
          setIsAdmin(!!data.isAdmin);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Auto-focus and select the name input when loaded
  useEffect(() => {
    if (!loading && automation && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [loading, !!automation]);

  // Auto-save with debounce
  const persistField = useCallback((patch: Record<string, unknown>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/user/automations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    }, 600);
  }, [id]);

  const update = useCallback((patch: Partial<Automation>) => {
    setAutomation((prev) => prev ? { ...prev, ...patch } : prev);
    persistField(patch);
  }, [persistField]);

  const updateVisual = useCallback((patch: Partial<AutomationVisualSettings>) => {
    setAutomation((prev) => {
      if (!prev) return prev;
      const visualSettings = { ...prev.visualSettings, ...patch };
      persistField({ visualSettings });
      return { ...prev, visualSettings };
    });
  }, [persistField]);

  const deleteAutomation = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/automations/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/automation");
    } catch {
      // ignore
    }
  }, [id, router]);

  // ─── Loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-48" />
          <div className="flex items-center gap-2 ml-auto">
            <Skeleton className="h-5 w-9 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
          {/* Controls */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Type & Metric */}
            <div className="rounded-2xl border-fade p-5 space-y-4">
              <Skeleton className="h-3 w-10" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
              <Skeleton className="h-3 w-12" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
            {/* Tweet variants */}
            <div className="rounded-2xl border-fade p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            </div>
            {/* Visual design */}
            <div className="rounded-2xl border-fade p-5 space-y-4">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 rounded-lg" />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-16 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-6 space-y-2">
              <div className="rounded-2xl border-fade p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
              <Skeleton className="h-3 w-64 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="w-full max-w-6xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">Automation not found.</p>
        <Button asChild variant="outline">
          <a href="/dashboard/automation">Back to automations</a>
        </Button>
      </div>
    );
  }

  const vs = automation.visualSettings;
  const backgrounds = vs.backgrounds ?? (vs.background ? [vs.background] : ["noisy-lights"]);
  const fonts = vs.fonts ?? (vs.font ? [vs.font] : ["bricolage"]);
  const emojis = vs.emojis ?? (vs.milestoneEmojiUnified ? [{ emoji: vs.milestoneEmoji || "🎉", unified: vs.milestoneEmojiUnified, name: vs.milestoneEmojiName || "Party Popper" }] : [{ emoji: "🎉", unified: "1f389", name: "Party Popper" }]);
  const selectedMetrics = parseMetrics(automation.metric);
  const primaryMetric = selectedMetrics[0]; // first metric for preview/defaults
  const safeMetric = AUTO_POST_METRICS.includes(primaryMetric as AutoPostMetric) ? primaryMetric : AUTO_POST_METRICS[0];
  const defaultVariants = getDefaultTemplates(automation.trigger, safeMetric as AutoPostMetric, automation.cardTemplate);
  const variants = parseTweetVariants(automation.tweetTemplate);
  const tweetVariants = variants.length > 0 ? variants : defaultVariants;
  const isUsingDefaults = variants.length === 0 || (() => {
    const v = JSON.stringify(variants);
    // Check against all default templates (milestone/metrics + progress)
    const matchesDefault = TRIGGERS.some(t => AUTO_POST_METRICS.some(m => JSON.stringify(DEFAULT_TEMPLATES[t][m]) === v));
    const matchesProgress = (["daily", "weekly"] as const).some(t => AUTO_POST_METRICS.some(m => JSON.stringify(PROGRESS_TEMPLATES[t][m]) === v));
    return matchesDefault || matchesProgress;
  })();
  const isMetricsTemplate = automation.cardTemplate === "metrics";
  const showGoal = automation.cardTemplate === "progress";
  const showEmoji = automation.cardTemplate === "milestone";

  // Compute current day/week number for preview
  const currentDayNumber = (() => {
    const start = automation.startDate ? new Date(automation.startDate) : new Date();
    const diffMs = new Date().getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const base = automation.startDay ?? 1;
    return automation.trigger === "weekly" ? base + Math.floor(diffDays / 7) : base + diffDays;
  })();

  // Connection checks
  const xConnected = !!xAccount;
  const isMetricDisabled = (m: AutoPostMetric) => {
    const info = METRIC_INFO[m];
    if (info.source === "x" && !xConnected) return true;
    if (info.source === "trustmrr" && !trustmrrConnected) return true;
    return false;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/automation")}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={20} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <input
            ref={nameInputRef}
            value={automation.name}
            onChange={(e) => update({ name: e.target.value })}
            className="text-xl font-heading font-bold bg-transparent border-none outline-none w-full"
            placeholder="Automation name"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(saving || saved) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {saving ? (
                <HugeiconsIcon icon={Loading03Icon} size={12} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={Tick02Icon} size={12} className="text-emerald-500" />
              )}
              {saving ? "Saving..." : "Saved"}
            </span>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              disabled={testingPost}
              onClick={async () => {
                setTestingPost(true);
                try {
                  const res = await fetch(`/api/user/automations/${id}/test`, { method: "POST" });
                  const data = await res.json();
                  if (data.success) {
                    toast.success("Test post sent!");
                  } else {
                    toast.error(data.error || "Test failed");
                  }
                } catch {
                  toast.error("Test failed");
                } finally {
                  setTestingPost(false);
                }
              }}
              className="text-xs text-blue-500 border-blue-500/30"
            >
              {testingPost ? (
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
              ) : "Test"}
            </Button>
          )}
          <Switch
            checked={automation.enabled}
            onCheckedChange={(checked) => update({ enabled: checked })}
          />
          <span className="text-xs text-muted-foreground">
            {automation.enabled ? "Active" : "Inactive"}
          </span>
          <div className="w-px h-5 bg-border mx-1" />
          {confirmDelete ? (
            <span className="flex items-center gap-2 text-sm">
              <button type="button" onClick={deleteAutomation} className="font-semibold text-destructive hover:underline">Delete</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-muted-foreground hover:underline">Cancel</button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-muted"
              title="Delete automation"
            >
              <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Connection status */}
      {(!xConnected || !trustmrrConnected) && (
        <div className="flex flex-wrap gap-3">
          {!xConnected && (
            <a
              href="/dashboard/connections"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              X not connected — connect to enable automations
            </a>
          )}
          {!trustmrrConnected && (
            <a
              href="/dashboard/connections"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
              TrustMRR not connected — MRR & Revenue metrics unavailable
            </a>
          )}
        </div>
      )}

      {/* Main layout: controls + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
        {/* ─── Controls column ─────────────────────────────────────────── */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* Type & Metric */}
          <div className="rounded-2xl border-fade p-5 space-y-4">
            {/* Type: Metrics, Milestone, Progress */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { template: "milestone" as const, trigger: "milestone" as const, label: "Milestone", desc: "Post when you hit a milestone" },
                  { template: "metrics" as const, trigger: "daily" as const, label: "Metrics", desc: "Share your metrics regularly" },
                  { template: "progress" as const, trigger: "daily" as const, label: "Progress", desc: "Track progress towards a goal" },
                ]).map(({ template, trigger, label, desc }) => {
                  const isSelected = automation.cardTemplate === template
                    && (template === "milestone" ? automation.trigger === "milestone" : automation.trigger !== "milestone");
                  return (
                    <button
                      key={template}
                      onClick={() => {
                        const newTrigger = template === "milestone" ? "milestone" : (automation.trigger !== "milestone" ? automation.trigger : "daily");
                        update({
                          trigger: newTrigger,
                          cardTemplate: template,
                          ...(isUsingDefaults ? { tweetTemplate: serializeTweetVariants(getDefaultTemplates(newTrigger, primaryMetric, template)) } : {}),
                        });
                      }}
                      className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 transition-colors text-left ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{label}</span>
                      <span className="text-[11px] text-muted-foreground">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency for Metrics/Progress */}
            {automation.trigger !== "milestone" && (
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Frequency</label>
                <div className="flex flex-wrap items-center gap-2">
                  {(["daily", "weekly"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => {
                        update({
                          trigger: freq,
                          ...(isUsingDefaults ? { tweetTemplate: serializeTweetVariants(getDefaultTemplates(freq, primaryMetric, automation.cardTemplate)) } : {}),
                        });
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        automation.trigger === freq
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {freq === "daily" ? "Daily" : "Weekly"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {automation.trigger === "milestone" ? "When to post" : "Schedule"}
              </label>
              {automation.trigger === "milestone" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => update({ scheduleHour: null })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      automation.scheduleHour == null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Immediately
                  </button>
                  <button
                    onClick={() => update({ scheduleHour: automation.scheduleHour ?? closestScheduleHour(7) })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      automation.scheduleHour != null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Scheduled
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {automation.trigger === "weekly" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Day</label>
                    <select
                      value={automation.scheduleDay ?? 0}
                      onChange={(e) => update({ scheduleDay: parseInt(e.target.value) })}
                      className="block w-full px-2.5 py-1.5 rounded-lg border border-muted bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {DAYS.map((day, i) => (
                        <option key={i} value={i}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(automation.trigger !== "milestone" || automation.scheduleHour != null) && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Time</label>
                    <select
                      value={closestScheduleHour(automation.scheduleHour ?? 7)}
                      onChange={(e) => update({ scheduleHour: parseInt(e.target.value) })}
                      className="block w-full px-2.5 py-1.5 rounded-lg border border-muted bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {SCHEDULE_HOURS_UTC.map((h) => (
                        <option key={h} value={h}>{utcHourToLocal(h)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Goal (progress template only) */}
            {showGoal && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Goal</label>
                <input
                  type="number"
                  value={automation.goal ?? ""}
                  onChange={(e) => update({ goal: parseInt(e.target.value) || null })}
                  placeholder={primaryMetric === "mrr" || primaryMetric === "revenue" ? "e.g. 1000" : "e.g. 10000"}
                  className="w-full px-3 py-1.5 rounded-lg border border-muted bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Day/week counter (for {period} variable in metrics template) */}
            {automation.cardTemplate === "metrics" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Next {automation.trigger === "weekly" ? "week" : "day"} =
                </span>
                <input
                  type="number"
                  min={1}
                  value={currentDayNumber}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    update({ startDay: val, startDate: new Date().toISOString().slice(0, 10) });
                  }}
                  className="w-16 px-2 py-1 rounded-lg border border-muted bg-transparent text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[11px] text-muted-foreground">
                  (auto-increments after each post)
                </span>
              </div>
            )}

            {/* Metric */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Metric{isMetricsTemplate && selectedMetrics.length > 1 && <span className="text-primary ml-1">({selectedMetrics.length})</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {AUTO_POST_METRICS.map((m) => {
                  const info = METRIC_INFO[m];
                  const disabled = isMetricDisabled(m);
                  const isSelected = isMetricsTemplate ? selectedMetrics.includes(m) : primaryMetric === m;
                  return (
                    <button
                      key={m}
                      disabled={disabled}
                      onClick={() => {
                        if (isMetricsTemplate) {
                          // Multi-select for metrics template
                          const updated = toggleInArray(selectedMetrics, m);
                          update({ metric: serializeMetrics(updated) });
                        } else {
                          // Single-select for milestone/progress
                          update({
                            metric: m,
                            ...(isUsingDefaults ? { tweetTemplate: serializeTweetVariants(getDefaultTemplates(automation.trigger, m, automation.cardTemplate)) } : {}),
                          });
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        disabled
                          ? "opacity-30 cursor-not-allowed bg-muted/50 text-muted-foreground"
                          : isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                      title={disabled ? `Requires ${info.source === "x" ? "X" : "TrustMRR"} connection` : info.label}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tweet variants */}
          <div className="rounded-2xl border-fade p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Texte
                {tweetVariants.length > 1 && (
                  <span className="text-primary font-normal ml-1.5 text-xs">({tweetVariants.length} variants — randomized)</span>
                )}
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={generatingVariant}
                onClick={async () => {
                  setGeneratingVariant(true);
                  try {
                    const res = await fetch("/api/user/automations/rewrite", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        existingVariants: tweetVariants,
                        metric: primaryMetric,
                      }),
                    });
                    if (res.ok) {
                      const { text } = await res.json();
                      if (text) {
                        const updated = [...tweetVariants, text];
                        update({ tweetTemplate: serializeTweetVariants(updated) });
                      }
                    }
                  } catch {
                    // ignore
                  } finally {
                    setGeneratingVariant(false);
                  }
                }}
                className={generatingVariant ? "animate-pulse" : ""}
              >
                <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                {generatingVariant ? "Generating..." : "Add variant"}
              </Button>
            </div>
            {tweetVariants.map((variant, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {tweetVariants.length > 1 ? `Variant ${i + 1}` : ""}
                  </span>
                  {tweetVariants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = tweetVariants.filter((_, j) => j !== i);
                        update({ tweetTemplate: serializeTweetVariants(updated) });
                      }}
                      className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Textarea
                  value={variant}
                  onChange={(e) => {
                    const updated = [...tweetVariants];
                    updated[i] = e.target.value;
                    update({ tweetTemplate: serializeTweetVariants(updated) });
                  }}
                  onFocus={(e) => { lastFocusedTextarea.current = { index: i, el: e.target as HTMLTextAreaElement }; }}
                  placeholder={defaultVariants[0]}
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5">
              {ALL_TEMPLATE_VARIABLES
                .filter((v) => v.templates.includes(automation.cardTemplate))
                .map((v) => (
                <button
                  key={v.name}
                  type="button"
                  title={v.desc}
                  onClick={() => {
                    const ref = lastFocusedTextarea.current;
                    if (ref) {
                      const el = ref.el;
                      const start = el.selectionStart;
                      const end = el.selectionEnd;
                      const text = el.value;
                      const newText = text.slice(0, start) + v.name + text.slice(end);
                      const updated = [...tweetVariants];
                      updated[ref.index] = newText;
                      update({ tweetTemplate: serializeTweetVariants(updated) });
                      // Restore cursor after the inserted variable
                      requestAnimationFrame(() => {
                        el.focus();
                        const pos = start + v.name.length;
                        el.setSelectionRange(pos, pos);
                      });
                    }
                  }}
                  className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono cursor-pointer hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Visual design (template + visual settings merged) */}
          <div className="rounded-2xl border-fade p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Visual design</p>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[11px] text-muted-foreground">Abbreviate</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={vs.abbreviateNumbers !== false}
                  onClick={() => updateVisual({ abbreviateNumbers: vs.abbreviateNumbers === false })}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    vs.abbreviateNumbers !== false ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      vs.abbreviateNumbers !== false ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Layout (metrics template with 2+ metrics) */}
            {isMetricsTemplate && selectedMetrics.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Layout</label>
                <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
                  <button
                    type="button"
                    onClick={() => updateVisual({ metricsLayout: "stack" })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      (vs.metricsLayout || "stack") === "stack"
                        ? "bg-white dark:bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-4 h-0.5 rounded-full bg-current" />
                      <div className="w-3 h-0.5 rounded-full bg-current" />
                      <div className="w-3 h-0.5 rounded-full bg-current" />
                    </div>
                    Stack
                  </button>
                  <button
                    type="button"
                    onClick={() => updateVisual({ metricsLayout: "grid" })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      vs.metricsLayout === "grid"
                        ? "bg-white dark:bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-0.5">
                      <div className="w-0.5 h-2 rounded-sm bg-current" />
                      <div className="w-0.5 h-2.5 rounded-sm bg-current" />
                      <div className="w-0.5 h-2 rounded-sm bg-current" />
                    </div>
                    Columns
                  </button>
                </div>
              </div>
            )}

            {/* Backgrounds — multi-select */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Background{backgrounds.length > 1 && <span className="text-primary ml-1">({backgrounds.length} — randomized)</span>}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BACKGROUNDS.map((bg) => {
                  const selected = backgrounds.includes(bg.id);
                  return (
                    <button
                      key={bg.id}
                      onClick={() => updateVisual({ backgrounds: toggleInArray(backgrounds, bg.id) })}
                      className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        selected ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-90"
                      }`}
                      title={bg.name}
                    >
                      {bg.image && <Image src={bg.image} alt={bg.name} fill className="object-cover" sizes="40px" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font + Text color */}
            <div className="flex items-start gap-4">
              {/* Color picker */}
              <div className="shrink-0 space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Color</label>
                <Input
                  type="color"
                  value={vs.textColor}
                  onChange={(e) => updateVisual({ textColor: e.target.value })}
                  onBlur={(e) => {
                    if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      updateVisual({ textColor: "#ffffff" });
                    }
                  }}
                  className="block w-10 h-10 p-0 cursor-pointer border-0 rounded-lg overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                  aria-label="Text color picker"
                />
              </div>
              {/* Font */}
              <div className="space-y-2 flex-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Font{fonts.length > 1 && <span className="text-primary ml-1">({fonts.length} — randomized)</span>}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FONT_LIST.map((font) => {
                    const selected = fonts.includes(font.id);
                    return (
                      <button
                        key={font.id}
                        onClick={() => updateVisual({ fonts: toggleInArray(fonts, font.id) })}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                          selected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                        style={{ fontFamily: `var(${font.variable}), sans-serif` }}
                      >
                        {font.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Emoji (milestone only) — multi-select */}
            {showEmoji && (
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Emoji{emojis.length > 1 && <span className="text-primary ml-1">({emojis.length} — randomized)</span>}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_EMOJIS.map((e) => {
                    const selected = emojis.some((em) => em.unified === e.unified);
                    return (
                      <button
                        key={e.unified}
                        onClick={() => {
                          const updated = selected
                            ? emojis.filter((em) => em.unified !== e.unified)
                            : [...emojis, { emoji: e.emoji, unified: e.unified, name: e.name }];
                          if (updated.length === 0) return; // keep at least 1
                          updateVisual({ emojis: updated });
                        }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 transition-all ${
                          selected ? "border-primary bg-primary/5 scale-110" : "border-muted hover:scale-105"
                        }`}
                        title={e.name}
                      >
                        <img
                          src={getAppleEmojiUrl(e.unified)}
                          alt={e.name}
                          className="w-5 h-5"
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-2.5 text-right shrink-0">0</span>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[vs.milestoneEmojiCount ?? 3]}
                    onValueChange={([v]) => updateVisual({ milestoneEmojiCount: v })}
                    className="flex-1"
                  />
                  <span className="text-[10px] text-muted-foreground w-2.5 shrink-0">10</span>
                </div>
              </div>
            )}

            {/* Logo */}
            {brandingLogos.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Logo</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => updateVisual({ logoUrl: undefined })}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      !vs.logoUrl
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    None
                  </button>
                  {brandingLogos.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => updateVisual({ logoUrl: logo.url })}
                      className={`p-1.5 rounded-lg border-2 transition-all flex items-center justify-center min-h-9 ${
                        vs.logoUrl === logo.url
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <Image
                        src={logo.url}
                        alt="Logo"
                        width={64}
                        height={24}
                        className="object-contain max-h-6"
                      />
                    </button>
                  ))}
                </div>
                {vs.logoUrl && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => updateVisual({ logoPosition: pos })}
                          className={`px-2.5 py-1 rounded-md text-[10px] capitalize border transition-all ${
                            (vs.logoPosition || "center") === pos
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground border-border"
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">20</span>
                        <Slider
                          min={20}
                          max={40}
                          step={1}
                          value={[vs.logoSize ?? 30]}
                          onValueChange={([v]) => updateVisual({ logoSize: v })}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground">40</span>
                      </div>
                      <div className="relative h-3 mx-3.5">
                        <span
                          className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                          style={{ left: `calc(${(((vs.logoSize ?? 30) - 20) / 20) * 100}% + ${8 - (((vs.logoSize ?? 30) - 20) / 20) * 16}px)` }}
                        >
                          {vs.logoSize ?? 30}px
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* ─── Preview column ──────────────────────────────────────────── */}
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-6 space-y-2">
            <XPostPreview
              displayName={xAccount?.displayName || xAccount?.username || "You"}
              username={xAccount?.username || "username"}
              profileImageUrl={xAccount?.profileImageUrl || null}
              tweetText={tweetVariants[0] || defaultVariants[0]}
              metric={primaryMetric}
              extraMetrics={isMetricsTemplate ? selectedMetrics.slice(1) : undefined}
              value={automation.trigger === "milestone"
                ? (nextMilestones[primaryMetric] ?? currentMetrics[primaryMetric] ?? 1000)
                : (currentMetrics[primaryMetric] || 1000)}
              goal={automation.goal || undefined}
              dayNumber={automation.trigger !== "milestone" && automation.cardTemplate !== "progress" ? currentDayNumber : undefined}
              trigger={automation.trigger}
              cardTemplate={automation.cardTemplate}
              visualSettings={vs}
            />
            <p className="text-[11px] text-muted-foreground text-center">Preview with current data — actual post may differ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
