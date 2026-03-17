"use client";

import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { EditorSettings, PeriodType, LastUnitType, HeadingType, HeadingSettings, PeriodSettings, MetricType, Metric, METRIC_LABELS, BrandingLogo } from "../Editor";
import { parseMetricInput, detectPrefix } from "@/lib/metrics";
import { normalizeHandle } from "@/lib/validation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDownIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon, UserAccountIcon, Analytics01Icon, Heading01Icon, Download04Icon, Copy01Icon, ImageAdd01Icon, Delete02Icon, Loading03Icon, CrownIcon, PlusSignIcon, DashboardSquare01Icon, Target01Icon, AlignBoxBottomLeftIcon, AlignBoxBottomCenterIcon, AlignBoxBottomRightIcon, NewTwitterIcon, GithubIcon, RedditIcon, BrowserIcon, ShuffleIcon } from "@hugeicons/core-free-icons";
import { TEMPLATE_LIST } from "@/lib/templates";
import { compressImage } from "@/lib/image-compress";
import { TemplateType } from "../Editor";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import data from "@emoji-mart/data/sets/15/apple.json";
import Picker from "@emoji-mart/react";
import { getAppleEmojiUrl } from "@/lib/emoji";

type SidebarProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  onExport: () => void;
  onCopy: () => void;
  isExporting: boolean;
  cooldown?: number;
  isPremium?: boolean;
  lockPremiumFeatures?: boolean;
  onPremiumBlock?: (feature: string) => void;
  exportsThisWeek?: number;
  maxExportsPerWeek?: number | null;
  hasUsedTrial?: boolean;
};

const X_METRICS_PRIMARY: MetricType[] = ["followers", "verifiedFollowers", "impressions", "replies", "posts", "builders"];
const X_METRICS_MORE: MetricType[] = ["followings", "engagementRate", "engagement", "profileVisits", "likes", "reposts", "bookmarks"];
const X_METRICS: MetricType[] = [...X_METRICS_PRIMARY, ...X_METRICS_MORE];
const SAAS_METRICS: MetricType[] = ["mrr", "arr", "valuation", "revenue", "churnRate", "ltv", "visitors", "newCustomers", "totalCustomers", "sales", "domainRating"];
const GITHUB_METRICS: MetricType[] = ["githubStars", "githubCommits", "githubForks", "githubContributors", "githubPRsClosed", "githubIssuesResolved"];
const REDDIT_METRICS: MetricType[] = ["redditKarma", "redditUpvotes", "redditUpvoteRatio"];
const ALL_METRICS: MetricType[] = [...X_METRICS, ...SAAS_METRICS, ...GITHUB_METRICS, ...REDDIT_METRICS, "custom"];
const MAX_METRICS = 5;
const AUTO_FILL_X: MetricType[] = ["followers", "followings", "posts"];
const AUTO_FILL_SAAS: MetricType[] = ["mrr", "arr", "revenue"];

type SortableMetricItemProps = {
  metric: Metric;
  onValueChange: (type: MetricType, value: number, prefix?: string) => void;
  onRemove: (type: MetricType) => void;
  onCustomLabelChange?: (label: string) => void;
  canRemove: boolean;
  canDrag: boolean;
  autoFillValue?: number; // undefined = no auto-fill available
  autoFillLoading?: boolean;
  disabled?: boolean;
};

function PeriodNumberInput({ value, onChange, onBlurEmpty, autoFocus }: {
  value: number;
  onChange: (value: number) => void;
  onBlurEmpty?: () => void;
  autoFocus?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when value changes (e.g., from localStorage)
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Limit to 4 digits max
    if (val.length > 4) return;
    setInputValue(val);

    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 0 || inputValue.trim() === "") {
      if (onBlurEmpty && inputValue.trim() === "") {
        onBlurEmpty();
        return;
      }
      setInputValue(value.toString());
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-16 text-center bg-background"
      aria-label="Period number"
    />
  );
}

const SortableMetricItem = memo(function SortableMetricItem({ metric, onValueChange, onRemove, onCustomLabelChange, canRemove, canDrag, autoFillValue, autoFillLoading, disabled }: SortableMetricItemProps) {
  const [inputValue, setInputValue] = useState(metric.prefix ? `${metric.prefix}${metric.value}` : metric.value.toString());

  // Sync local state when metric value changes (e.g., from localStorage)
  useEffect(() => {
    setInputValue(metric.prefix ? `${metric.prefix}${metric.value}` : metric.value.toString());
  }, [metric.value, metric.prefix]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric.type, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Parse and update the metric value
    const parsed = parseMetricInput(value, metric.type);
    if (parsed !== null) {
      const prefix = detectPrefix(value);
      onValueChange(metric.type, parsed, prefix);
      // If user typed a shortcut like "2k", replace with expanded value
      if (/[kmb]$/i.test(value)) {
        setInputValue(prefix ? `${prefix}${parsed}` : parsed.toString());
      // If user typed a decimal like "0.4" for non-rate metrics, show rounded value
      } else if (metric.type !== "engagementRate" && /^[+-]?0\.\d+$/.test(value.trim())) {
        setInputValue(prefix ? `${prefix}${parsed}` : parsed.toString());
      }
    }
  };

  const handleBlur = () => {
    // Clean up display: remove leading zeros and commas, keep prefix
    const parsed = parseMetricInput(inputValue, metric.type);
    if (parsed !== null) {
      const prefix = detectPrefix(inputValue);
      setInputValue(prefix ? `${prefix}${parsed}` : parsed.toString());
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        className={`touch-none ${canDrag ? "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" : "cursor-not-allowed text-muted-foreground/30"}`}
        disabled={!canDrag}
        aria-label={`Reorder ${METRIC_LABELS[metric.type]}`}
        {...attributes}
        {...listeners}
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <Input
        type="text"
        inputMode="text"
        placeholder="0"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        className="w-32 text-center bg-background"
        aria-label={`${METRIC_LABELS[metric.type]} value`}
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap flex-1 flex items-center gap-1.5" aria-hidden="true">
        {metric.type === "custom" ? (
          <input
            type="text"
            value={metric.customLabel || ""}
            onChange={(e) => onCustomLabelChange?.(e.target.value)}
            placeholder="Label"
            className="bg-transparent border-b border-dashed border-muted-foreground/40 focus:border-foreground outline-none w-full text-sm text-muted-foreground"
            maxLength={24}
          />
        ) : METRIC_LABELS[metric.type]}
        {autoFillLoading ? (
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Loading03Icon} size={10} strokeWidth={2} className="animate-spin text-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground/60">loading</span>
          </span>
        ) : autoFillValue !== undefined && (() => {
          const isMatching = metric.value === autoFillValue;
          return isMatching ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[10px] text-emerald-600">auto</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onValueChange(metric.type, autoFillValue, undefined)}
              className="flex items-center gap-1 cursor-pointer hover:opacity-80"
              title="Restore auto-fetched value"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/40">auto</span>
            </button>
          );
        })()}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(metric.type)}
        disabled={!canRemove}
        className="shrink-0"
        aria-label={`Remove ${METRIC_LABELS[metric.type]}`}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
      </Button>
    </div>
  );
});

type ConnectedAccount = {
  accountId: string;
  username: string | null;
  latest: {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
  } | null;
};

export default function Sidebar({ settings, onSettingsChange, onExport, onCopy, isExporting, cooldown = 0, isPremium = false, lockPremiumFeatures = false, onPremiumBlock, exportsThisWeek = 0, maxExportsPerWeek = null, hasUsedTrial = false }: SidebarProps) {
  const isMobile = useIsMobile(940);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [deletingLogoId, setDeletingLogoId] = useState<string | null>(null);
  const [brandingLogos, setBrandingLogos] = useState<BrandingLogo[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [trustmrrLatest, setTrustmrrLatest] = useState<{ mrrCents: number; revenueTotalCents: number } | null>(null);
  const [loadingX, setLoadingX] = useState(false);
  const [loadingTrustmrr, setLoadingTrustmrr] = useState(false);
  const [handleMode, setHandleMode] = useState<"custom" | string>("custom"); // "custom" or account username
  const handleTouchedRef = useRef(settings.handle !== ""); // track if user has interacted with handle
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.value = "";
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load branding logos on mount
  useEffect(() => {
    if (isPremium) {
      fetch("/api/user/branding")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (!data?.logos) return;
          setBrandingLogos(data.logos);
          const current = settingsRef.current;
          // Auto-select first logo if none selected or selected logo no longer exists
          if (data.logos.length > 0 && (!current.branding?.logoUrl || !data.logos.some((l: BrandingLogo) => l.url === current.branding?.logoUrl))) {
            onSettingsChange({
              ...current,
              branding: { ...current.branding, logoUrl: data.logos[0].url, position: current.branding?.position || "center", enabled: true },
            });
          }
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  // Fetch connected X accounts and analytics (server auto-fetches if stale)
  const fetchXAnalytics = useCallback(() => {
    if (!isPremium) return;
    setLoadingX(true);
    fetch("/api/analytics?days=1")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.accounts && data.accounts.length > 0) {
          const accounts: ConnectedAccount[] = data.accounts.map((a: { accountId: string; username: string | null; latest: { followersCount: number; followingCount: number; tweetCount: number } | null }) => ({
            accountId: a.accountId,
            username: a.username,
            latest: a.latest ? {
              followersCount: a.latest.followersCount || 0,
              followingCount: a.latest.followingCount || 0,
              tweetCount: a.latest.tweetCount || 0,
            } : null,
          }));
          setConnectedAccounts(accounts);

          // Auto-select connected account: match current handle, or default to first account
          const current = settingsRef.current;
          const currentHandle = current.handle.replace("@", "").toLowerCase();
          const match = accounts.find((a: ConnectedAccount) => a.username?.toLowerCase() === currentHandle);
          const selected = match || accounts[0];
          if (selected?.username) {
            setHandleMode(selected.username);
            if (selected.latest) {
              const metricMap: Partial<Record<string, number>> = {
                followers: selected.latest.followersCount,
                followings: selected.latest.followingCount,
                posts: selected.latest.tweetCount,
              };
              const updatedMetrics = current.metrics.map(m => {
                const autoValue = metricMap[m.type];
                return autoValue !== undefined ? { ...m, value: autoValue } : m;
              });
              const newHandle = match ? current.handle : `@${selected.username}`;
              onSettingsChange({ ...current, handle: newHandle, metrics: updatedMetrics });
            } else if (!match) {
              onSettingsChange({ ...current, handle: `@${selected.username}` });
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingX(false));
  }, [isPremium, onSettingsChange]);

  useEffect(() => {
    fetchXAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  // Fetch TrustMRR data for SaaS metric auto-fill (server auto-fetches if stale)
  const fetchTrustMRR = useCallback(() => {
    if (!isPremium) return;
    setLoadingTrustmrr(true);
    fetch("/api/analytics/trustmrr")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.hasData && data.latest) {
          const latest = {
            mrrCents: data.latest.mrrCents ?? 0,
            revenueTotalCents: data.latest.revenueTotalCents ?? 0,
          };
          setTrustmrrLatest(latest);

          // Auto-populate SaaS metrics if present in current settings
          const current = settingsRef.current;
          const saasMap: Partial<Record<string, number>> = {
            mrr: latest.mrrCents / 100,
            arr: Math.round(latest.mrrCents * 12) / 100,
            revenue: latest.revenueTotalCents / 100,
          };
          const hasSaasMetric = current.metrics.some(m => m.type in saasMap);
          if (hasSaasMetric) {
            const updatedMetrics = current.metrics.map(m => {
              const autoValue = saasMap[m.type];
              return autoValue !== undefined ? { ...m, value: autoValue } : m;
            });
            onSettingsChange({ ...current, metrics: updatedMetrics });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTrustmrr(false));
  }, [isPremium, onSettingsChange]);

  useEffect(() => {
    fetchTrustMRR();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size: 10MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("logo", compressed);

      const res = await fetch("/api/user/branding", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.logo) {
        setBrandingLogos(prev => [...prev, data.logo]);
        // Auto-select the newly uploaded logo
        onSettingsChange({
          ...settings,
          branding: { ...settings.branding, logoUrl: data.logo.url, position: settings.branding?.position || "center", enabled: true },
        });
      }
    } catch {
      // Upload failed — spinner stops, user can retry
    } finally {
      setIsUploadingLogo(false);
    }
  }, [settings, onSettingsChange]);

  const handleLogoDelete = useCallback(async (logoId: string, logoUrl: string) => {
    setDeletingLogoId(logoId);
    try {
      await fetch(`/api/user/branding?id=${logoId}`, { method: "DELETE" });
      setBrandingLogos(prev => prev.filter(l => l.id !== logoId));
      // If deleted logo was selected, select another or clear
      if (settings.branding?.logoUrl === logoUrl) {
        const remaining = brandingLogos.filter(l => l.id !== logoId);
        onSettingsChange({
          ...settings,
          branding: { ...settings.branding, logoUrl: remaining[0]?.url, position: settings.branding?.position || "center" },
        });
      }
    } catch {
      // Delete failed — spinner stops, user can retry
    } finally {
      setDeletingLogoId(null);
    }
  }, [settings, onSettingsChange, brandingLogos]);

  const buildMetricMap = useCallback((account?: ConnectedAccount | null): Partial<Record<MetricType, number>> => {
    const map: Partial<Record<MetricType, number>> = {};
    if (account?.latest) {
      map.followers = account.latest.followersCount;
      map.followings = account.latest.followingCount;
      map.posts = account.latest.tweetCount;
    }
    if (trustmrrLatest) {
      map.mrr = trustmrrLatest.mrrCents / 100;
      map.arr = Math.round(trustmrrLatest.mrrCents * 12) / 100;
      map.revenue = trustmrrLatest.revenueTotalCents / 100;
    }
    return map;
  }, [trustmrrLatest]);

  const handleAccountSelect = useCallback((value: string) => {
    setHandleMode(value);
    if (value === "custom") return;

    const account = connectedAccounts.find(a => a.username === value);
    if (!account) return;

    // Set handle
    const newHandle = `@${account.username}`;

    // Auto-populate metrics from analytics data
    const metricMap = buildMetricMap(account);
    if (Object.keys(metricMap).length > 0) {
      const updatedMetrics = settings.metrics.map(m => {
        const autoValue = metricMap[m.type];
        return autoValue !== undefined ? { ...m, value: autoValue } : m;
      });

      onSettingsChange({ ...settings, handle: newHandle, metrics: updatedMetrics });
    } else {
      onSettingsChange({ ...settings, handle: newHandle });
    }
  }, [connectedAccounts, settings, onSettingsChange, buildMetricMap]);

  const updateSetting = useCallback(<K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  }, [settings, onSettingsChange]);

  const updateHeading = useCallback((heading: HeadingSettings) => {
    let period: PeriodSettings = null;
    if (heading?.type === "period" && heading.periodType) {
      period = { type: heading.periodType, number: heading.periodFrom ?? 1 };
    } else if (heading?.type === "last" && heading.lastUnit) {
      period = { type: heading.lastUnit === "hour" ? "day" : heading.lastUnit, number: heading.lastCount ?? 1 };
    }
    onSettingsChange({ ...settings, heading, period });
  }, [settings, onSettingsChange]);

  const addMetric = useCallback((type: MetricType) => {
    const selectedAccount = connectedAccounts.find(a => a.username === handleMode);
    const metricMap = buildMetricMap(selectedAccount);
    const newMetric: Metric = { type, value: metricMap[type] ?? 0 };
    updateSetting("metrics", [...settings.metrics, newMetric]);
  }, [updateSetting, settings.metrics, connectedAccounts, handleMode, buildMetricMap]);

  const removeMetric = useCallback((type: MetricType) => {
    updateSetting("metrics", settings.metrics.filter(m => m.type !== type));
  }, [updateSetting, settings.metrics]);

  const updateMetricValue = useCallback((type: MetricType, value: number, prefix?: string) => {
    updateSetting("metrics", settings.metrics.map(m =>
      m.type === type ? { ...m, value, prefix } : m
    ));
  }, [updateSetting, settings.metrics]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.metrics.findIndex(m => m.type === active.id);
      const newIndex = settings.metrics.findIndex(m => m.type === over.id);
      updateSetting("metrics", arrayMove(settings.metrics, oldIndex, newIndex));
    }
  }, [updateSetting, settings.metrics]);

  const availableMetrics = useMemo(() => ALL_METRICS.filter(
    type => !settings.metrics.some(m => m.type === type)
  ), [settings.metrics]);

  // Metrics that have auto-fill data available (type -> value)
  const autoFillMap = useMemo(() => {
    const selectedAccount = connectedAccounts.find(a => a.username === handleMode);
    return buildMetricMap(selectedAccount);
  }, [connectedAccounts, handleMode, buildMetricMap]);

  const metricLabel = useCallback((type: MetricType) => (
    <span className="flex items-center justify-between flex-1">
      {METRIC_LABELS[type]}
      {type in autoFillMap && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
    </span>
  ), [autoFillMap]);

  return (
    <aside className="w-full min-[940px]:w-96 flex flex-col gap-6 p-4 border rounded-3xl bg-card min-h-full">
      {/* Template Selector */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
            Template
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {TEMPLATE_LIST.map((template) => {
              const isSelected = (settings.template || "metrics") === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    if (lockPremiumFeatures && template.premium) { onPremiumBlock?.("Premium template"); return; }
                    const updates: Partial<EditorSettings> = { template: template.id as TemplateType };
                    if (template.id === "announcement" && (!settings.announcements || settings.announcements.length === 0)) {
                      updates.announcements = [{ emoji: "✅", text: "Item 1" }];
                    }
                    if (template.id === "announcement" && !settings.heading) {
                      updates.heading = { type: "period", periodType: "day", periodFrom: 1 };
                    }
                    if (template.id === "milestone" && !settings.milestoneEmoji) {
                      updates.milestoneEmoji = "🎉";
                      updates.milestoneEmojiUnified = "1f389";
                      updates.milestoneEmojiCount = 3;
                    }
                    onSettingsChange({ ...settings, ...updates });
                  }}
                  className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-colors ${
                    lockPremiumFeatures && template.premium
                      ? "opacity-50 cursor-not-allowed border-transparent bg-white dark:bg-card"
                      : isSelected
                        ? "border-primary bg-white dark:bg-card"
                        : "border-transparent bg-white dark:bg-card hover:border-muted"
                  }`}
                >
                  {/* Mini preview */}
                  <div className={`w-full h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-primary/10" : "bg-muted/50"
                  }`}>
                    {template.id === "metrics" && (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-5 h-1 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className={`w-3 h-0.5 rounded-full ${isSelected ? "bg-primary/50" : "bg-muted-foreground/20"}`} />
                      </div>
                    )}
                    {template.id === "milestone" && (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-3 h-0.5 rounded-full opacity-50 ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className={`w-5 h-1 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className={`w-3 h-0.5 rounded-full opacity-50 ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      </div>
                    )}
                    {template.id === "progress" && (
                      <div className="flex flex-col items-center gap-1 w-full px-2">
                        <div className={`w-full h-1.5 rounded-full ${isSelected ? "bg-primary/20" : "bg-muted-foreground/15"}`}>
                          <div className={`w-3/4 h-full rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        </div>
                      </div>
                    )}
                    {template.id === "announcement" && (
                      <div className="flex flex-col items-center gap-0.5 w-full px-2">
                        <div className={`w-4 h-0.5 rounded-full mb-0.5 ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className={`w-full h-1 rounded-sm ${isSelected ? "bg-primary/50" : "bg-muted-foreground/20"}`} />
                        <div className={`w-full h-1 rounded-sm ${isSelected ? "bg-primary/50" : "bg-muted-foreground/20"}`} />
                        <div className={`w-full h-1 rounded-sm ${isSelected ? "bg-primary/50" : "bg-muted-foreground/20"}`} />
                      </div>
                    )}
                  </div>

                  {/* Pro badge */}
                  {!isPremium && template.premium && (
                    <span className={`absolute -bottom-1.5 -right-1.5 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 text-[9px] font-bold leading-none ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border"
                    }`}>
                      <HugeiconsIcon icon={CrownIcon} size={10} strokeWidth={2} />
                      PRO
                    </span>
                  )}

                  {/* Label */}
                  <span className={`text-[10px] font-semibold transition-colors ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {template.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      {/* Main Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <HugeiconsIcon icon={UserAccountIcon} size={18} strokeWidth={1.5} aria-hidden="true" />
          Main Info
        </h3>

        <div className="flex flex-col gap-2">
          <Label htmlFor="handle">X Handle</Label>
          {connectedAccounts.length > 0 ? (
            <div className="flex gap-2">
              <Select value={handleMode} onValueChange={handleAccountSelect}>
                <SelectTrigger className={`bg-background ${handleMode === "custom" ? "w-28 shrink-0" : "flex-1"}`}>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  {connectedAccounts.map((account) => (
                    <SelectItem key={account.accountId} value={account.username || account.accountId}>
                      @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {handleMode === "custom" && (
                <Input
                  id="handle"
                  type="text"
                  placeholder="@yourhandle"
                  value={settings.handle}
                  onFocus={() => { if (!handleTouchedRef.current && settings.handle === "") { updateSetting("handle", "@"); handleTouchedRef.current = true; } }}
                  onChange={(e) => { updateSetting("handle", e.target.value); handleTouchedRef.current = true; }}
                  onBlur={(e) => updateSetting("handle", normalizeHandle(e.target.value))}
                  className="flex-1 bg-background"
                />
              )}
            </div>
          ) : (
            <Input
              id="handle"
              type="text"
              placeholder="@yourhandle"
              value={settings.handle}
              onFocus={() => { if (!handleTouchedRef.current && settings.handle === "") { updateSetting("handle", "@"); handleTouchedRef.current = true; } }}
              onChange={(e) => { updateSetting("handle", e.target.value); handleTouchedRef.current = true; }}
              onBlur={(e) => updateSetting("handle", normalizeHandle(e.target.value))}
              className="bg-background"
            />
          )}
        </div>

        {/* Heading - for metrics and announcement templates */}
        {((settings.template || "metrics") === "metrics" || settings.template === "announcement") && (
          settings.heading ? (
            <div className="flex flex-col gap-2">
              <Label>Heading</Label>
              <div className="flex gap-2">
                <Select
                  value={settings.heading.type}
                  onValueChange={(value) => {
                    const newType = value as HeadingType;
                    const h = settings.heading;
                    const userText = h?.text && h.text !== "Your quote" && h.text !== "Your text" ? h.text : "";
                    const defaults: Record<HeadingType, HeadingSettings> = {
                      "period": { type: "period", periodType: h?.periodType || "week", periodFrom: h?.periodFrom ?? 1 },
                      "last": { type: "last", lastCount: h?.lastCount ?? 1, lastUnit: h?.lastUnit || "day" },
                      "date-range": { type: "date-range", dateFrom: h?.dateFrom || new Date().toISOString().slice(0, 10), dateTo: h?.dateTo || new Date().toISOString().slice(0, 10) },
                      "today": { type: "today" },
                      "yesterday": { type: "yesterday" },
                      "quote": { type: "quote", text: userText || "Your quote" },
                      "custom": { type: "custom", text: userText || "Your text" },
                    };
                    updateHeading(defaults[newType]);
                  }}
                >
                  <SelectTrigger className="flex-1 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="period">Period</SelectItem>
                    <SelectItem value="last">Last</SelectItem>
                    <SelectItem value="date-range">Date range</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateHeading(null)}
                  className="shrink-0"
                  aria-label="Remove heading"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </div>

              {/* Period controls: type selector + from number + optional "to" for range */}
              {settings.heading.type === "period" && (
                <div className="flex gap-2 items-center">
                  <Select
                    value={settings.heading.periodType || "week"}
                    onValueChange={(value) => updateHeading({ ...settings.heading!, periodType: value as PeriodType })}
                  >
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <PeriodNumberInput
                    value={settings.heading.periodFrom ?? 1}
                    onChange={(value) => updateHeading({ ...settings.heading!, periodFrom: value })}
                  />
                  {settings.heading.periodTo !== undefined ? (
                    <>
                      <span className="text-muted-foreground text-sm">–</span>
                      <PeriodNumberInput
                        value={settings.heading.periodTo}
                        onChange={(value) => updateHeading({ ...settings.heading!, periodTo: value })}
                        onBlurEmpty={() => {
                          const { periodTo: _, ...rest } = settings.heading!;
                          updateHeading(rest as HeadingSettings);
                        }}
                        autoFocus
                      />
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => updateHeading({ ...settings.heading!, periodTo: (settings.heading!.periodFrom ?? 1) + 3 })}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      – to
                    </Button>
                  )}
                </div>
              )}

              {/* Last controls: "Last X days/weeks/months/years" */}
              {settings.heading.type === "last" && (
                <div className="flex gap-2 items-center">
                  <PeriodNumberInput
                    value={settings.heading.lastCount ?? 7}
                    onChange={(value) => updateHeading({ ...settings.heading!, lastCount: value })}
                  />
                  <Select
                    value={settings.heading.lastUnit || "day"}
                    onValueChange={(value) => updateHeading({ ...settings.heading!, lastUnit: value as LastUnitType })}
                  >
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">{(settings.heading.lastCount ?? 1) === 1 ? "hour" : "hours"}</SelectItem>
                      <SelectItem value="day">{(settings.heading.lastCount ?? 1) === 1 ? "day" : "days"}</SelectItem>
                      <SelectItem value="week">{(settings.heading.lastCount ?? 1) === 1 ? "week" : "weeks"}</SelectItem>
                      <SelectItem value="month">{(settings.heading.lastCount ?? 1) === 1 ? "month" : "months"}</SelectItem>
                      <SelectItem value="year">{(settings.heading.lastCount ?? 1) === 1 ? "year" : "years"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date range controls */}
              {settings.heading.type === "date-range" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal bg-background">
                      {settings.heading.dateFrom && settings.heading.dateTo
                        ? `${new Date(settings.heading.dateFrom + "T00:00:00").toLocaleDateString()} – ${new Date(settings.heading.dateTo + "T00:00:00").toLocaleDateString()}`
                        : "Pick a date range"}
                      <ChevronDownIcon className="size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={
                        settings.heading.dateFrom && settings.heading.dateTo
                          ? { from: new Date(settings.heading.dateFrom + "T00:00:00"), to: new Date(settings.heading.dateTo + "T00:00:00") }
                          : undefined
                      }
                      onSelect={(range: DateRange | undefined) => {
                        const toLocalISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        updateHeading({
                          ...settings.heading!,
                          dateFrom: range?.from ? toLocalISO(range.from) : settings.heading!.dateFrom,
                          dateTo: range?.to ? toLocalISO(range.to) : range?.from ? toLocalISO(range.from) : settings.heading!.dateTo,
                        });
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Text input for quote / custom */}
              {(settings.heading.type === "quote" || settings.heading.type === "custom") && (
                <textarea
                  key={settings.heading.type}
                  ref={(el) => {
                    if (el && !el.dataset.initialized) {
                      el.dataset.initialized = "true";
                      el.focus({ preventScroll: true });
                      el.select();
                    }
                  }}
                  value={settings.heading.text || ""}
                  onChange={(e) => {
                    if (settings.heading?.type === "quote" && e.target.value.length > 50) return;
                    updateHeading({ ...settings.heading!, text: e.target.value });
                  }}
                  maxLength={settings.heading?.type === "quote" ? 50 : undefined}
                  placeholder={
                    settings.heading.type === "quote" ? "Your favorite quote..." :
                    "Your text..."
                  }
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground bg-background"
              onClick={() => updateHeading({ type: "period", periodType: "week", periodFrom: 1 })}
            >
              <HugeiconsIcon icon={Heading01Icon} size={18} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
              Add heading
            </Button>
          )
        )}
      </div>

      {/* Metrics - hidden for announcement template */}
      {settings.template !== "announcement" && <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <HugeiconsIcon icon={Analytics01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
            {(settings.template || "metrics") === "metrics" ? "Metrics" : "Metric"}
            {(() => {
              const max = (settings.metricsLayout === "grid" || settings.aspectRatio === "banner") ? 3 : MAX_METRICS;
              return (settings.template || "metrics") === "metrics" && settings.metrics.length >= max ? (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="text-xs text-primary italic font-normal normal-case tracking-normal">
                    {max} max
                  </span>
                </>
              ) : null;
            })()}
          </h3>
          <div className="flex items-center gap-1.5">
            {(() => {
              const forceAbbreviate = settings.metrics.some(m => m.value > 999_999_999);
              const isAbbreviated = forceAbbreviate || settings.abbreviateNumbers !== false;
              return (
                <label className={`flex items-center gap-1.5 ${forceAbbreviate ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                  <span className="text-xs text-muted-foreground">
                    Abbreviate numbers
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAbbreviated}
                    aria-label="Abbreviate numbers"
                    disabled={forceAbbreviate}
                    onClick={() => !forceAbbreviate && updateSetting("abbreviateNumbers", settings.abbreviateNumbers === false)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      isAbbreviated ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        isAbbreviated ? "translate-x-4.5" : "translate-x-0.75"
                      }`}
                    />
                  </button>
                </label>
              );
            })()}
          </div>
        </div>

        {/* Layout toggle for metrics template */}
        {(settings.template || "metrics") === "metrics" && settings.metrics.length >= 2 && (
          <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
            <button
              type="button"
              onClick={() => updateSetting("metricsLayout", "stack")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                (settings.metricsLayout || "stack") === "stack"
                  ? "bg-background shadow-sm text-foreground"
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
              onClick={() => updateSetting("metricsLayout", "grid")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                settings.metricsLayout === "grid"
                  ? "bg-background shadow-sm text-foreground"
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
        )}

        {/* Multi-metric for "metrics" template */}
        {(settings.template || "metrics") === "metrics" ? (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={settings.metrics.map(m => m.type)}
                strategy={verticalListSortingStrategy}
              >
                {settings.metrics.map((metric, index) => {
                  const effectiveMax = (settings.metricsLayout === "grid" || settings.aspectRatio === "banner") ? 3 : MAX_METRICS;
                  const isColumnOverflow = index >= effectiveMax;
                  return (
                    <div key={metric.type} className={isColumnOverflow ? "opacity-40" : ""}>
                      {isColumnOverflow && index === effectiveMax && (
                        <p className="text-[10px] text-muted-foreground italic mb-1">Hidden (max {effectiveMax})</p>
                      )}
                      <SortableMetricItem
                        metric={metric}
                        onValueChange={updateMetricValue}
                        onRemove={removeMetric}
                        onCustomLabelChange={metric.type === "custom" ? (label) => {
                          updateSetting("metrics", settings.metrics.map(m =>
                            m.type === "custom" ? { ...m, customLabel: label } : m
                          ));
                        } : undefined}
                        canRemove={settings.metrics.length > 1}
                        canDrag={settings.metrics.length > 1 && !isColumnOverflow}
                        disabled={isColumnOverflow}
                        autoFillValue={autoFillMap[metric.type]}
                        autoFillLoading={
                          (AUTO_FILL_X.includes(metric.type) && loadingX) ||
                          (AUTO_FILL_SAAS.includes(metric.type) && loadingTrustmrr)
                        }
                      />
                    </div>
                  );
                })}
              </SortableContext>
            </DndContext>

            {availableMetrics.length > 0 && (
              settings.metrics.length >= ((settings.metricsLayout === "grid" || settings.aspectRatio === "banner") ? 3 : MAX_METRICS) ? (
                <Button variant="outline" className="w-full justify-start text-muted-foreground bg-background" disabled>
                  <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
                  Add metric
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-muted-foreground bg-background">
                      <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
                      Add metric
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-background max-h-[60vh] overflow-y-auto" style={{ width: isMobile ? "var(--radix-dropdown-menu-trigger-width)" : "calc(var(--radix-dropdown-menu-trigger-width) * 0.5)" }}>
                    {isMobile ? (
                      <>
                        {[
                          { label: "X", icon: NewTwitterIcon, metrics: availableMetrics.filter(t => X_METRICS.includes(t)) },
                          { label: "GitHub", icon: GithubIcon, metrics: availableMetrics.filter(t => GITHUB_METRICS.includes(t)) },
                          { label: "Reddit", icon: RedditIcon, metrics: availableMetrics.filter(t => REDDIT_METRICS.includes(t)) },
                          { label: "SaaS", icon: BrowserIcon, metrics: availableMetrics.filter(t => SAAS_METRICS.includes(t)) },
                        ].filter(g => g.metrics.length > 0).map((group, i) => (
                          <div key={group.label}>
                            {i > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="flex items-center gap-1.5"><HugeiconsIcon icon={group.icon} size={14} strokeWidth={1.5} /> {group.label}</DropdownMenuLabel>
                            {group.metrics.map((type) => (
                              <DropdownMenuItem key={type} onClick={() => addMetric(type)}>
                                {metricLabel(type)}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        ))}
                        {availableMetrics.includes("custom") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => addMetric("custom")}>
                              Custom
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {availableMetrics.some(t => X_METRICS.includes(t)) && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><HugeiconsIcon icon={NewTwitterIcon} size={14} strokeWidth={1.5} /> X</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-background">
                              {availableMetrics.filter(t => X_METRICS_PRIMARY.includes(t)).map((type) => (
                                <DropdownMenuItem key={type} onClick={() => addMetric(type)}>
                                  {metricLabel(type)}
                                </DropdownMenuItem>
                              ))}
                              {availableMetrics.some(t => X_METRICS_MORE.includes(t)) && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="bg-background">
                                    {availableMetrics.filter(t => X_METRICS_MORE.includes(t)).map((type) => (
                                      <DropdownMenuItem key={type} onClick={() => addMetric(type)}>
                                        {metricLabel(type)}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {availableMetrics.some(t => GITHUB_METRICS.includes(t)) && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><HugeiconsIcon icon={GithubIcon} size={14} strokeWidth={1.5} /> GitHub</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-background">
                              {availableMetrics.filter(t => GITHUB_METRICS.includes(t)).map((type) => (
                                <DropdownMenuItem key={type} onClick={() => addMetric(type)}>
                                  {metricLabel(type)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {availableMetrics.some(t => REDDIT_METRICS.includes(t)) && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><HugeiconsIcon icon={RedditIcon} size={14} strokeWidth={1.5} /> Reddit</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-background">
                              {availableMetrics.filter(t => REDDIT_METRICS.includes(t)).map((type) => (
                                <DropdownMenuItem key={type} onClick={() => addMetric(type)}>
                                  {metricLabel(type)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {availableMetrics.some(t => SAAS_METRICS.includes(t)) && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><HugeiconsIcon icon={BrowserIcon} size={14} strokeWidth={1.5} /> SaaS</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-background">
                              {availableMetrics.filter(t => SAAS_METRICS.includes(t)).map((type) => (
                                <DropdownMenuItem key={type} onClick={() => addMetric(type)}>
                                  {metricLabel(type)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {availableMetrics.includes("custom") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => addMetric("custom")}>
                              Custom
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </>
        ) : (
          /* Single metric for "milestone" and "progress" templates */
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="text"
                placeholder="0"
                value={settings.metrics[0]?.prefix ? `${settings.metrics[0].prefix}${settings.metrics[0].value}` : (settings.metrics[0]?.value.toString() || "0")}
                onChange={(e) => {
                  const parsed = parseMetricInput(e.target.value, settings.metrics[0]?.type || "followers");
                  if (parsed !== null) {
                    const prefix = detectPrefix(e.target.value);
                    updateSetting("metrics", [{ type: settings.metrics[0]?.type || "followers", value: parsed, prefix }]);
                  }
                }}
                className="flex-1 bg-background"
                aria-label="Metric value"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 bg-background justify-between font-normal">
                    {METRIC_LABELS[settings.metrics[0]?.type || "followers"]}
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background max-h-[60vh] overflow-y-auto" style={{ width: isMobile ? "var(--radix-dropdown-menu-trigger-width)" : "calc(var(--radix-dropdown-menu-trigger-width) * 0.5)" }}>
                  {isMobile ? (
                    <>
                      {(() => {
                        const handleSelect = (type: MetricType) => {
                          const selectedAccount = connectedAccounts.find(a => a.username === handleMode);
                          const metricMap = buildMetricMap(selectedAccount);
                          const autoValue = metricMap[type];
                          updateSetting("metrics", [{ type, value: autoValue ?? settings.metrics[0]?.value ?? 0 }]);
                        };
                        return [
                          { label: "X", icon: NewTwitterIcon, metrics: X_METRICS.filter(t => t !== "engagementRate") },
                          { label: "GitHub", icon: GithubIcon, metrics: GITHUB_METRICS },
                          { label: "Reddit", icon: RedditIcon, metrics: REDDIT_METRICS.filter(t => t !== "redditUpvoteRatio") },
                          { label: "SaaS", icon: BrowserIcon, metrics: SAAS_METRICS.filter(t => t !== "churnRate") },
                        ].map((group, i) => (
                          <div key={group.label}>
                            {i > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="flex items-center gap-1.5"><HugeiconsIcon icon={group.icon} size={14} strokeWidth={1.5} /> {group.label}</DropdownMenuLabel>
                            {group.metrics.map((type) => (
                              <DropdownMenuItem key={type} onClick={() => handleSelect(type)}>
                                {metricLabel(type)}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        ));
                      })()}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        updateSetting("metrics", [{ type: "custom" as MetricType, value: settings.metrics[0]?.value ?? 0 }]);
                      }}>
                        Custom
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger><HugeiconsIcon icon={NewTwitterIcon} size={14} strokeWidth={1.5} /> X</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-background">
                          {X_METRICS_PRIMARY.filter(type => type !== "engagementRate").map((type) => {
                            const handleClick = () => {
                              const selectedAccount = connectedAccounts.find(a => a.username === handleMode);
                              const metricMap = buildMetricMap(selectedAccount);
                              const autoValue = metricMap[type];
                              updateSetting("metrics", [{ type, value: autoValue ?? settings.metrics[0]?.value ?? 0 }]);
                            };
                            return (
                              <DropdownMenuItem key={type} onClick={handleClick}>
                                {metricLabel(type)}
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-background">
                              {X_METRICS_MORE.filter(type => type !== "engagementRate").map((type) => {
                                const handleClick = () => {
                                  const selectedAccount = connectedAccounts.find(a => a.username === handleMode);
                                  const metricMap = buildMetricMap(selectedAccount);
                                  const autoValue = metricMap[type];
                                  updateSetting("metrics", [{ type, value: autoValue ?? settings.metrics[0]?.value ?? 0 }]);
                                };
                                return (
                                  <DropdownMenuItem key={type} onClick={handleClick}>
                                    {metricLabel(type)}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger><HugeiconsIcon icon={GithubIcon} size={14} strokeWidth={1.5} /> GitHub</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-background">
                          {GITHUB_METRICS.map((type) => (
                            <DropdownMenuItem
                              key={type}
                              onClick={() => {
                                updateSetting("metrics", [{ type, value: settings.metrics[0]?.value ?? 0 }]);
                              }}
                            >
                              {metricLabel(type)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger><HugeiconsIcon icon={RedditIcon} size={14} strokeWidth={1.5} /> Reddit</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-background">
                          {REDDIT_METRICS.filter(type => type !== "redditUpvoteRatio").map((type) => (
                            <DropdownMenuItem
                              key={type}
                              onClick={() => {
                                updateSetting("metrics", [{ type, value: settings.metrics[0]?.value ?? 0 }]);
                              }}
                            >
                              {metricLabel(type)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger><HugeiconsIcon icon={BrowserIcon} size={14} strokeWidth={1.5} /> SaaS</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-background">
                          {SAAS_METRICS.filter(type => type !== "churnRate").map((type) => {
                            const metricMap = buildMetricMap();
                            return (
                            <DropdownMenuItem
                              key={type}
                              onClick={() => {
                                const autoValue = metricMap[type];
                                updateSetting("metrics", [{ type, value: autoValue ?? settings.metrics[0]?.value ?? 0 }]);
                              }}
                            >
                              {metricLabel(type)}
                            </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        updateSetting("metrics", [{ type: "custom" as MetricType, value: settings.metrics[0]?.value ?? 0 }]);
                      }}>
                        Custom
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {settings.metrics[0]?.type === "custom" && (
              <Input
                type="text"
                placeholder="Label (e.g. Products)"
                value={settings.metrics[0]?.customLabel || ""}
                onChange={(e) => {
                  updateSetting("metrics", [{ ...settings.metrics[0], customLabel: e.target.value }]);
                }}
                className="bg-background"
                maxLength={24}
                aria-label="Custom metric label"
              />
            )}
          </div>
        )}

      </div>}

      {/* Emoji decoration - only for milestone template */}
      {(settings.template || "metrics") === "milestone" && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Emoji
          </h3>
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border transition-colors ${
                    settings.milestoneEmoji
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background hover:bg-muted/50"
                  }`}
                >
                  {settings.milestoneEmojiUnified ? (
                    <img src={getAppleEmojiUrl(settings.milestoneEmojiUnified)} alt="" className="w-6 h-6 object-contain" draggable={false} />
                  ) : (
                    <span className="text-lg">😀</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" align="start" side="right">
                <Picker
                  data={data}
                  set="apple"
                  theme="light"
                  onEmojiSelect={(emoji: { native: string; unified: string; name: string }) => {
                    onSettingsChange({ ...settings, milestoneEmoji: emoji.native, milestoneEmojiUnified: emoji.unified, milestoneEmojiName: emoji.name });
                  }}
                  previewPosition="none"
                  skinTonePosition="search"
                  perLine={10}
                  maxFrequentRows={1}
                />
              </PopoverContent>
            </Popover>
            {settings.milestoneEmoji && (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-[10px] text-muted-foreground w-2.5 text-right shrink-0">0</span>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={[settings.milestoneEmojiCount ?? 3]}
                  onValueChange={([v]) => updateSetting("milestoneEmojiCount", v)}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground w-2.5 shrink-0">10</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goal - only for progress template */}
      {(settings.template || "metrics") === "progress" && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <HugeiconsIcon icon={Target01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
            Goal
          </h3>
          <Input
            type="text"
            inputMode="text"
            placeholder="10000"
            value={settings.goal?.toString() || ""}
            onChange={(e) => {
              const parsed = parseMetricInput(e.target.value, settings.metrics[0]?.type || "followers");
              if (parsed !== null) {
                updateSetting("goal", parsed);
              }
            }}
            className="bg-background"
            aria-label="Goal value"
          />
        </div>
      )}

      {/* Liste - only for announcement template */}
      {settings.template === "announcement" && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
            List
          </h3>
          <div className="flex flex-col gap-2">
            {(settings.announcements || []).map((feature, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="shrink-0 w-9 h-9 rounded-xl border border-input bg-background flex items-center justify-center hover:bg-muted/50 transition-colors"
                    >
                      {feature.emojiUnified ? (
                        <img src={getAppleEmojiUrl(feature.emojiUnified)} alt="" className="w-5 h-5 object-contain" draggable={false} />
                      ) : (
                        <span className="text-lg">{feature.emoji || "✅"}</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0" align="start" side="right">
                    <Picker
                      data={data}
                      set="apple"
                      theme="light"
                      onEmojiSelect={(emoji: { native: string; unified: string; name: string }) => {
                        const updated = [...(settings.announcements || [])];
                        updated[index] = { ...updated[index], emoji: emoji.native, emojiUnified: emoji.unified, emojiName: emoji.name };
                        updateSetting("announcements", updated);
                      }}
                      previewPosition="none"
                      skinTonePosition="search"
                      perLine={10}
                      maxFrequentRows={1}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="text"
                  value={feature.text}
                  onChange={(e) => {
                    const updated = [...(settings.announcements || [])];
                    updated[index] = { ...updated[index], text: e.target.value };
                    updateSetting("announcements", updated);
                  }}
                  placeholder={`Feature ${index + 1}`}
                  className="bg-background flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const updated = (settings.announcements || []).filter((_, i) => i !== index);
                    updateSetting("announcements", updated);
                  }}
                  className="shrink-0"
                  aria-label="Remove feature"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
                </Button>
              </div>
            ))}
            {(settings.announcements || []).length < 4 && (
              <Button
                variant="outline"
                className="w-full bg-background"
                onClick={() => {
                  const updated = [...(settings.announcements || []), { text: "" }];
                  updateSetting("announcements", updated);
                }}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.5} />
                Add feature
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Branding (Premium only) */}
      {isPremium && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <HugeiconsIcon icon={ImageAdd01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
            Branding
            {settings.branding?.logoUrl && (
              <button
                type="button"
                role="switch"
                aria-checked={settings.branding?.enabled !== false}
                aria-label="Toggle branding"
                onClick={() => updateSetting("branding", { ...settings.branding!, enabled: settings.branding?.enabled === false })}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-auto ${
                  settings.branding?.enabled !== false ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    settings.branding?.enabled !== false ? "translate-x-4.5" : "translate-x-0.75"
                  }`}
                />
              </button>
            )}
          </h3>

          <div className="flex flex-col gap-2">
            {brandingLogos.length > 0 ? (
              <div className="flex flex-col gap-2">
                {/* Logo selector popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors w-full"
                    >
                      {settings.branding?.logoUrl ? (
                        <Image
                          src={settings.branding.logoUrl}
                          alt="Selected logo"
                          width={120}
                          height={40}
                          className="rounded object-contain max-h-10"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">Select logo</span>
                      )}
                      <ChevronDownIcon className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="grid grid-cols-2 gap-2">
                      {brandingLogos.map((logo) => (
                        <div
                          key={logo.id}
                          className="relative group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              updateSetting("branding", { ...settings.branding, logoUrl: logo.url, position: settings.branding?.position || "center", enabled: true });
                            }}
                            className={`w-full p-2 rounded-lg border-2 transition-all flex items-center justify-center min-h-12 ${
                              settings.branding?.logoUrl === logo.url
                                ? "border-primary bg-primary/5"
                                : "border-transparent bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            <Image
                              src={logo.url}
                              alt="Logo"
                              width={96}
                              height={40}
                              className="object-contain max-h-10"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleLogoDelete(logo.id, logo.url); }}
                            disabled={deletingLogoId === logo.id}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {deletingLogoId === logo.id ? (
                              <HugeiconsIcon icon={Loading03Icon} size={12} strokeWidth={2} className="animate-spin" />
                            ) : (
                              <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      ))}
                      {/* Add logo tile */}
                      {brandingLogos.length < 6 && (
                        <label className={`flex flex-col items-center justify-center gap-1 min-h-12 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors ${isUploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            onChange={handleLogoUpload}
                            ref={fileInputRef}
                            className="hidden"
                            disabled={isUploadingLogo}
                          />
                          <HugeiconsIcon
                            icon={isUploadingLogo ? Loading03Icon : PlusSignIcon}
                            size={16}
                            strokeWidth={1.5}
                            className={`text-muted-foreground ${isUploadingLogo ? "animate-spin" : ""}`}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {isUploadingLogo ? "Uploading..." : "Add logo"}
                          </span>
                        </label>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Position & size controls */}
                {settings.branding?.logoUrl && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {([
                        { pos: "left" as const, icon: AlignBoxBottomLeftIcon },
                        { pos: "center" as const, icon: AlignBoxBottomCenterIcon },
                        { pos: "right" as const, icon: AlignBoxBottomRightIcon },
                      ]).map(({ pos, icon }) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => updateSetting("branding", { ...settings.branding!, position: pos })}
                          className={`p-1.5 rounded-lg transition-all border ${
                            (settings.branding?.position || "center") === pos
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-background text-muted-foreground hover:bg-muted border-border"
                          }`}
                        >
                          <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} />
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-0">
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">20</span>
                        <Slider
                          min={20}
                          max={40}
                          step={1}
                          value={[settings.branding?.logoSize ?? 30]}
                          onValueChange={([v]) => updateSetting("branding", { ...settings.branding!, logoSize: v })}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground">40</span>
                      </div>
                      <div className="relative h-3 mx-3.5">
                        <span
                          className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                          style={{ left: `calc(${(((settings.branding?.logoSize ?? 30) - 20) / 20) * 100}% + ${8 - (((settings.branding?.logoSize ?? 30) - 20) / 20) * 16}px)` }}
                        >
                          {settings.branding?.logoSize ?? 30}px
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  ref={fileInputRef}
                  className="hidden"
                  disabled={isUploadingLogo}
                />
                <HugeiconsIcon
                  icon={isUploadingLogo ? Loading03Icon : ImageAdd01Icon}
                  size={20}
                  strokeWidth={1.5}
                  className={`text-muted-foreground ${isUploadingLogo ? "animate-spin" : ""}`}
                />
                <span className="text-sm text-muted-foreground">
                  {isUploadingLogo ? "Uploading..." : "Upload logo"}
                </span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex-1" />
      <div className="flex gap-2">
        <Button
          onClick={onExport}
          disabled={isExporting || cooldown > 0}
          size="xl"
          className="flex-1 group transition-[transform,box-shadow] duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        >
          <span className="relative mr-2">
            <HugeiconsIcon icon={Download04Icon} size={22} strokeWidth={2} className="transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-0 group-hover:scale-75" />
            <span className="absolute inset-0 flex items-center justify-center text-xl opacity-0 scale-75 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-[-8deg]">🐯</span>
          </span>
          {isExporting ? "Loading..." : cooldown > 0 ? `Wait ${cooldown}s` : "Download image"}
        </Button>
        <Button
          onClick={onCopy}
          disabled={isExporting || cooldown > 0}
          size="xl"
          className="shrink-0 gradient-muted text-foreground border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-1px_0_0_rgba(0,0,0,0.06)] hover:brightness-[1.03] hover:scale-[1.02] active:scale-[0.98] transition-[transform,filter] duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          title="Copy to clipboard (⌘C)"
        >
          <HugeiconsIcon icon={Copy01Icon} size={20} strokeWidth={2} />
          <span className="hidden min-[360px]:inline">Copy</span>
        </Button>
      </div>
      {!isPremium && maxExportsPerWeek !== null && (() => {
        const remaining = Math.max(maxExportsPerWeek - exportsThisWeek, 0);
        const isOut = remaining === 0;
        const nextMonday = new Date();
        const day = nextMonday.getDay();
        nextMonday.setDate(nextMonday.getDate() + ((8 - day) % 7 || 7));
        const dayName = nextMonday.toLocaleDateString("en", { weekday: "long" });
        return (
          <p className={`-mt-3 mb-1 text-xs text-center ${isOut ? "text-red-500" : "text-muted-foreground/60"}`}>
            {remaining}/{maxExportsPerWeek} exports left this week
            {isOut && <span className="block">Resets {dayName}</span>}
          </p>
        );
      })()}
    </aside>
  );
}
