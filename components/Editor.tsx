"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "./editor/Sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import Preview from "./editor/Preview";
import StyleControls from "./editor/StyleControls";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";
import { FONTS } from "@/lib/fonts";
import { TEMPLATES } from "@/lib/templates";
import { useToast } from "@/components/ui/toast";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";
import { FREE_WEEKLY_LIMIT } from "@/lib/plans";
import TrialSignupModal from "@/components/TrialSignupModal";
import { checkPremiumFeatures } from "@/lib/premium-check";
import posthog from "posthog-js";
import XIcon from "@/components/icons/XIcon";
import { getStartOfWeek } from "@/lib/week";
import { ALL_BACKGROUNDS, defaultSettings, loadSettings, saveSettings } from "./editor/utils";
import { METRIC_LABELS, type EditorSettings, type FontFamily, type TemplateType, type MetricType } from "./editor/types";

// Re-export types and constants so existing imports from "@/components/Editor" still work
export type { PeriodType, LastUnitType, MetricType, Metric, BackgroundPreset, BackgroundSettings, PeriodSettings, HeadingType, HeadingSettings, AspectRatioType, FontFamily, TemplateType, MetricsLayout, TextAlign, BrandingSettings, BrandingLogo, EditorSettings } from "./editor/types";
export { METRIC_LABELS } from "./editor/types";

type EditorProps = {
  isPremium?: boolean;
  isDashboard?: boolean;
};

export default function Editor({ isPremium = false, isDashboard = false }: EditorProps) {
  const searchParams = useSearchParams();
  const importId = searchParams.get("import");
  const milestoneTemplate = searchParams.get("template");
  const milestoneMetric = searchParams.get("metric");
  const milestoneValue = searchParams.get("value");

  // On landing page, detect if user has a premium plan to hide the upgrade modal
  // Also sync today's export count from DB when logged in
  const [hideUpgradeModal, setHideUpgradeModal] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [exportsThisWeek, setExportsThisWeek] = useState(0);
  const [maxExportsPerWeek, setMaxExportsPerWeek] = useState<number | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const dbExportCountLoaded = useRef(false);
  useEffect(() => {
    fetch("/api/user/plan")
      .then((res) => {
        if (res.status === 401) return null; // Not logged in
        return res.json();
      })
      .then((data) => {
        if (!data) return; // Not logged in
        if (data.plan && data.plan !== "free") {
          setHideUpgradeModal(true);
          // API is coming soon — only enable for beta users
          const apiBetaEmails = ["yannick@ferire.com", "victor.petersen2@gmail.com"];
          if (data.email && apiBetaEmails.includes(data.email)) {
            fetch("/api/user/api-keys").then(r => r.ok ? r.json() : null).then(d => {
              if (d?.keys?.length > 0) setHasApiKeys(true);
            }).catch(() => {});
          }
        }
        // Track if user has already used their trial (trialing or expired)
        if (data.hasUsedTrial) setHasUsedTrial(true);
        // Track exports for sidebar display
        if (data.exportsThisWeek !== undefined) {
          setExportsThisWeek(Number(data.exportsThisWeek));
          setMaxExportsPerWeek(data.limits?.maxExportsPerWeek ?? null);
          const dbCount = Number(data.exportsThisWeek);
          const localCount = parseInt(localStorage.getItem(getWeekKey()) || "0", 10);
          const maxCount = Math.max(dbCount, localCount);
          localStorage.setItem(getWeekKey(), maxCount.toString());
          setWeekExportCount(maxCount);
          dbExportCountLoaded.current = true;
        }
      })
      .catch(() => {});
  }, []);

  const lockPremiumFeatures = isDashboard && !isPremium;

  const { state: settings, setState: setSettings, undo, redo, reset: resetSettings } = useUndoRedo<EditorSettings>(defaultSettings);
  const settingsLoadedRef = useRef(false);

  // Load settings from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (settingsLoadedRef.current) return;
    settingsLoadedRef.current = true;
    const loaded = loadSettings();
    if (!isPremium) loaded.branding = undefined;
    // Dashboard trial expired: reset any premium features to free defaults
    if (lockPremiumFeatures) {
      const bg = ALL_BACKGROUNDS.find(b => b.id === loaded.background.presetId);
      if (bg?.premium) loaded.background = defaultSettings.background;
      if (loaded.font && FONTS[loaded.font]?.premium) loaded.font = defaultSettings.font;
      if (loaded.template && TEMPLATES[loaded.template]?.premium) loaded.template = defaultSettings.template;
      if (loaded.aspectRatio && ASPECT_RATIOS[loaded.aspectRatio]?.premium) loaded.aspectRatio = defaultSettings.aspectRatio;
    }
    resetSettings(loaded);
  }, [isPremium, lockPremiumFeatures, resetSettings]);
  // Track first editor interaction (landing only)
  const editorInteractedRef = useRef(false);
  const settingsChangeCountRef = useRef(0);
  useEffect(() => {
    if (isDashboard || editorInteractedRef.current) return;
    // Skip the first 2 renders (initial + localStorage load)
    settingsChangeCountRef.current++;
    if (settingsChangeCountRef.current <= 2) return;
    editorInteractedRef.current = true;
    posthog.capture("editor_interacted", { source: "landing" });
    window?.datafast?.("editor_interacted", { source: "landing" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!importId);
  const [cooldown, setCooldown] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"limit" | "premium-features">("limit");
  const [trialReason, setTrialReason] = useState<"limit" | "premium-features" | undefined>();
  const [premiumFeaturesList, setPremiumFeaturesList] = useState<string[]>([]);
  const [weekExportCount, setWeekExportCount] = useState(0);
  // Fetch card image from /api/card on demand (called at export time, not continuously)
  const fetchCardImage = useCallback(async (): Promise<Blob | null> => {
    const exportSettings = {
      ...settings,
      showWatermark: isPremium ? (settings.showWatermark || false) : true,
    };
    try {
      const res = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportSettings),
      });
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  }, [settings, isPremium]);
  const previewRef = useRef<HTMLDivElement>(null);
  const shareToXRef = useRef<((toastId?: string | number) => Promise<void>) | null>(null);
  const exportToastIdRef = useRef<string | number | null>(null);
  const { showToast } = useToast();

  // Track weekly exports for free users (Monday-based, matches server)
  const getWeekKey = () => {
    const weekStart = getStartOfWeek();
    return `groar-exports-${weekStart.getFullYear()}-${(weekStart.getMonth() + 1).toString().padStart(2, "0")}-${weekStart.getDate().toString().padStart(2, "0")}`;
  };

  const getWeekExportCount = useCallback(() => {
    if (typeof window === "undefined") return 0;
    const count = localStorage.getItem(getWeekKey());
    return count ? parseInt(count, 10) : 0;
  }, []);

  const incrementExportCount = useCallback(() => {
    const key = getWeekKey();
    const current = getWeekExportCount();
    const newCount = current + 1;
    localStorage.setItem(key, newCount.toString());
    setWeekExportCount(newCount);
    return newCount;
  }, [getWeekExportCount]);

  // Load week's export count on mount
  useEffect(() => {
    setWeekExportCount(getWeekExportCount());
  }, [getWeekExportCount]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Load settings from import if specified (localStorage is already loaded via useState initializer)
  useEffect(() => {
    if (!importId) return;
    setIsLoading(true);
    fetch(`/api/exports/${importId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.export?.metrics) {
          const raw = data.export.metrics;
          const imported = (typeof raw === "string" ? JSON.parse(raw) : raw) as Partial<EditorSettings>;
          if (imported.metrics) {
            imported.metrics = imported.metrics.map(m => m.id ? m : { ...m, id: crypto.randomUUID() });
          }
          resetSettings({
            ...defaultSettings,
            ...imported,
            background: { ...defaultSettings.background, ...imported.background },
          });
        }
      })
      .catch(() => {
        resetSettings(loadSettings());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [importId]);

  // Pre-fill from milestone notification link (?template=milestone&metric=followers&value=1000)
  useEffect(() => {
    if (milestoneTemplate !== "milestone" || !milestoneValue) return;
    const numericValue = parseInt(milestoneValue, 10);
    if (isNaN(numericValue)) return;

    // Apply first preset style, or randomize if no presets
    const applyStyle = async () => {
      let styleOverrides: Partial<EditorSettings> = {};
      if (isPremium) {
        try {
          const res = await fetch("/api/user/presets");
          if (res.ok) {
            const data = await res.json();
            if (data.presets?.length > 0) {
              styleOverrides = data.presets[0].settings;
            }
          }
        } catch {}
      }
      // If no preset found, randomize
      if (!Object.keys(styleOverrides).length) {
        const available = isPremium ? ALL_BACKGROUNDS : ALL_BACKGROUNDS.filter((b) => !b.premium);
        const randomBg = available[Math.floor(Math.random() * available.length)];
        const randomColor = ["#faf7e9", "#ffffff", "#1a1a2e", "#0f0f0f"][Math.floor(Math.random() * 4)];
        const fonts: FontFamily[] = isPremium ? ["bricolage", "inter", "space-grotesk", "dm-mono"] : ["dm-mono"];
        styleOverrides = {
          background: { presetId: randomBg.id },
          textColor: randomColor,
          font: fonts[Math.floor(Math.random() * fonts.length)],
        };
      }

      setSettings((prev) => ({
        ...prev,
        ...styleOverrides,
        template: "milestone" as TemplateType,
        metrics: [{
          id: crypto.randomUUID(),
          type: (milestoneMetric || "followers") as MetricType,
          value: numericValue,
        }],
      }));
    };
    applyStyle();
  }, [milestoneTemplate, milestoneMetric, milestoneValue, isPremium]);

  // Save settings to localStorage when they change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveSettings(settings);
    }, 500);
    return () => clearTimeout(timeout);
  }, [settings]);

  // Smooth scroll to re-center editor when aspect ratio changes (skip initial load from localStorage)
  const prevAspectRatio = useRef(settings.aspectRatio);
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (settings.aspectRatio !== prevAspectRatio.current) {
      prevAspectRatio.current = settings.aspectRatio;
      if (!initialLoadDone.current) return;
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [settings.aspectRatio]);

  // Mark initial load as done after a short delay (after localStorage + import loads)
  useEffect(() => {
    const timer = setTimeout(() => { initialLoadDone.current = true; }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleExport = useCallback(async (copyOnly = false) => {
    if (cooldown > 0) return;

    // Dismiss previous export toast if any
    if (exportToastIdRef.current) {
      toast.dismiss(exportToastIdRef.current);
      exportToastIdRef.current = null;
    }

    // Free user checks (premium features + weekly limit)
    if (!isPremium) {
      // Check premium features (landing page only — dashboard handles at UI level)
      if (!isDashboard && !hideUpgradeModal) {
        const usage = checkPremiumFeatures(settings, ALL_BACKGROUNDS);
        if (usage.isPremium) {
          setPremiumFeaturesList(usage.features);
          posthog.capture("premium_feature_blocked", {
            features: usage.features,
            has_used_trial: hasUsedTrial,
            source: isDashboard ? "dashboard" : "landing",
          });
          if (hasUsedTrial) {
            setUpgradeReason("premium-features");
            setShowUpgradeModal(true);
            posthog.capture("upgrade_modal_viewed", { reason: "premium-features", source: isDashboard ? "dashboard" : "landing" });
          } else {
            setTrialReason("premium-features");
            setShowTrialModal(true);
          }
          return;
        }
      }

      // Check weekly limit (both landing + dashboard)
      if (weekExportCount >= FREE_WEEKLY_LIMIT) {
        posthog.capture("export_limit_reached", {
          week_export_count: weekExportCount,
          has_used_trial: hasUsedTrial,
          source: isDashboard ? "dashboard" : "landing",
        });
        if (hasUsedTrial) {
          setUpgradeReason("limit");
          setShowUpgradeModal(true);
          posthog.capture("upgrade_modal_viewed", { reason: "limit", source: isDashboard ? "dashboard" : "landing" });
        } else {
          setTrialReason("limit");
          setShowTrialModal(true);
        }
        return;
      }
    }

    setIsExporting(true);

    try {
      const cardImageBlob = await fetchCardImage();
      if (!cardImageBlob) {
        showToast("Failed to generate image. Please try again.", "error");
        setIsExporting(false);
        return;
      }

      // Download file (skip for copy-only mode)
      if (!copyOnly) {
        const url = URL.createObjectURL(cardImageBlob);
        const link = document.createElement("a");
        link.download = `groar-${settings.handle.replace("@", "")}-${Date.now()}.jpg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }

      // Copy image to clipboard as PNG (clipboard API requires PNG format)
      try {
        const blobUrl = URL.createObjectURL(cardImageBlob);
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            URL.revokeObjectURL(blobUrl);
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d")!.drawImage(img, 0, 0);
            canvas.toBlob((b) => b ? resolve(b) : reject(), "image/png");
          };
          img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(); };
          img.src = blobUrl;
        });
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
      } catch {
        // Clipboard not supported — image was already downloaded
      }

      // Save to database if logged in (premium)
      if (isPremium) {
        try {
          const file = new File([cardImageBlob], `export-${Date.now()}.jpg`, { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("image", file);
          formData.append("metrics", JSON.stringify(settings));

          const res = await fetch("/api/exports", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            if (data.code === "LIMIT_REACHED") {
              showToast("Daily export limit reached. Upgrade for unlimited exports!", "error");
              return;
            }
          }
        } catch {
          // Save to DB failed — export still succeeds locally
        }
      }

      // Detect browser/OS for debug tracking
      const ua = navigator.userAgent;
      const detectBrowser = () => {
        if (ua.includes("Brave")) return "Brave";
        if (ua.includes("Edg/")) return "Edge";
        if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("CriOS")) return "Chrome iOS";
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Safari")) return "Safari";
        return "Other";
      };
      const isIOS = /iP(hone|od|ad)/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
      const detectOS = () => {
        if (isIOS) return "iOS";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("Mac OS")) return "macOS";
        if (ua.includes("Windows")) return "Windows";
        if (ua.includes("Linux")) return "Linux";
        return "Other";
      };

      const followersValue = settings.metrics.find((m) => m.type === "followers")?.value ?? 0;

      // Track all exports in export_usage (DB) with device debug info
      fetch("/api/stats/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followers: isDashboard ? 0 : followersValue,
          backgroundId: settings.background.presetId,
          template: settings.template,
          handle: settings.handle,
          font: settings.font || "bricolage",
          fontResolved: true,
          isWebkit: false,
          isIos: isIOS,
          browser: detectBrowser(),
          os: detectOS(),
          deviceType: navigator.maxTouchPoints > 0 ? "Mobile" : "Desktop",
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          source: isDashboard ? "dashboard" : "landing",
        }),
      }).catch(() => {});

      // Landing page: update counters in real-time
      if (!isDashboard) {
        window.dispatchEvent(
          new CustomEvent("groar:export", { detail: { followers: followersValue } })
        );
      }

      // Track successful export in PostHog
      posthog.capture("image_exported", {
        template: settings.template,
        aspect_ratio: settings.aspectRatio,
        background_id: settings.background.presetId,
        is_premium: isPremium,
        handle: settings.handle,
        source: isDashboard ? "dashboard" : "landing",
      });
      if (!isDashboard) {
        window?.datafast?.("image_exported", {
          type: isPremium ? "premium" : "free",
        });
      }

      // Track for leaderboard (dashboard users only)
      if (isDashboard) {
        fetch("/api/user/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "export",
            template: settings.template,
            backgroundId: settings.background.presetId,
            localHour: new Date().getHours(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.pointsToday !== undefined) {
              window.dispatchEvent(new CustomEvent("groar:points", {
                detail: { earned: data.pointsEarned ?? 0, today: data.pointsToday },
              }));
            }
          })
          .catch(() => {});
      }

      // Start cooldown after successful export
      setCooldown(5);

      if (isPremium || hideUpgradeModal) {
        const toastId = toast.custom((id) => (
          <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 md:p-5 shadow-lg max-w-[calc(100vw-2rem)] w-90 flex flex-col gap-2 md:gap-3 font-[DM_Mono,monospace]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="text-sm md:text-base font-semibold">{copyOnly ? "Copied to clipboard!" : "Image downloaded!"}</span>
              </div>
              <button onClick={() => { toast.dismiss(id); exportToastIdRef.current = null; }} className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 -m-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="hidden md:block text-xs text-muted-foreground -mt-1">If you tag <a href="https://x.com/yannick_ferire" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@yannick_ferire</a> on your post with 🐯 GROAR visual, I&apos;ll repost you!</p>
            <button
              onClick={() => shareToXRef.current?.(id)}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background rounded-xl px-4 py-2 md:py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <XIcon className="w-4 h-4 fill-current" />
              Share on X
            </button>
            <p className="text-[11px] text-muted-foreground/70 text-center -mt-1">Image copied to clipboard — just paste it!</p>
          </div>
        ), { duration: Infinity });
        exportToastIdRef.current = toastId;
      } else {
        // Increment export count and show upsell after 1st export
        const newCount = incrementExportCount();
        if (newCount >= 1) {
          if (hasUsedTrial) {
            setUpgradeReason("limit");
            setShowUpgradeModal(true);
            posthog.capture("upgrade_modal_viewed", { reason: "post_export_limit", source: isDashboard ? "dashboard" : "landing" });
          } else {
            setTrialReason(undefined); // post-export
            setShowTrialModal(true);
          }
        }
      }
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [settings, isPremium, isDashboard, hideUpgradeModal, hasUsedTrial, showToast, cooldown, getWeekExportCount, incrementExportCount, fetchCardImage]);

  const shareToX = useCallback(async (toastId?: string | number) => {
    const mainMetric = settings.metrics[0];
    const template = settings.template || "metrics";
    let metricLine = "";

    if (mainMetric) {
      const metricLabel = (mainMetric.type === "custom" && mainMetric.customLabel ? mainMetric.customLabel : METRIC_LABELS[mainMetric.type]).toLowerCase();
      const value = mainMetric.value ?? 0;

      if (template === "milestone") {
        metricLine = `Just hit ${value.toLocaleString()} ${metricLabel}! 🎉\n\n`;
      } else if (template === "progress") {
        metricLine = `${value.toLocaleString()} ${metricLabel} and counting 🚀\n\n`;
      } else if (settings.heading?.type === "period" && settings.heading.periodType) {
        const from = settings.heading.periodFrom ?? 1;
        const to = settings.heading.periodTo;
        const prefix = mainMetric.prefix || "+";
        if (to) {
          const periodLabel = `${settings.heading.periodType}s ${from}–${to}`;
          metricLine = `${prefix}${value.toLocaleString()} ${metricLabel} over ${periodLabel} 📈\n\n`;
        } else {
          const periodLabel = `${from > 1 ? `${from} ` : ""}${settings.heading.periodType}${from > 1 ? "s" : ""}`;
          metricLine = `${prefix}${value.toLocaleString()} ${metricLabel} this ${periodLabel} 📈\n\n`;
        }
      } else if (settings.heading?.type === "last" && settings.heading.lastUnit) {
        const count = settings.heading.lastCount ?? 7;
        const unit = settings.heading.lastUnit;
        const prefix = mainMetric.prefix || "+";
        metricLine = `${prefix}${value.toLocaleString()} ${metricLabel} in the last ${count} ${unit}${count > 1 ? "s" : ""} 📈\n\n`;
      } else {
        const prefix = mainMetric.prefix || "+";
        metricLine = `${prefix}${value.toLocaleString()} ${metricLabel} 📈\n\n`;
      }
    }

    const tweetText = `${metricLine}Made with 🐯 GROAR by @yannick_ferire`;
    const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    // Open X intent immediately (must be synchronous from user gesture to avoid popup blockers on mobile)
    window.open(intentUrl, "_blank", "noopener");

    // Copy image to clipboard as PNG (clipboard API requires PNG)
    const shareBlob = await fetchCardImage();
    if (shareBlob) {
      try {
        const blobUrl = URL.createObjectURL(shareBlob);
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            URL.revokeObjectURL(blobUrl);
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d")!.drawImage(img, 0, 0);
            canvas.toBlob((b) => b ? resolve(b) : reject(), "image/png");
          };
          img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(); };
          img.src = blobUrl;
        });
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
      } catch {
        // Clipboard not supported
      }
    }
    if (toastId) {
      toast.dismiss(toastId);
      exportToastIdRef.current = null;
    }
    posthog.capture("share_to_x", { source: isDashboard ? "dashboard" : "landing" });
  }, [settings.metrics, settings.template, settings.heading, isDashboard, fetchCardImage]);
  shareToXRef.current = shareToX;

  const handleCopy = useCallback(() => handleExport(true), [handleExport]);

  useKeyboardShortcuts(
    useMemo(() => [
      { key: "s", meta: true, action: handleExport },
      { key: "c", meta: true, action: handleCopy, whenIdle: true },
      { key: "z", meta: true, action: undo },
      { key: "z", meta: true, shift: true, action: redo },
    ], [handleExport, handleCopy, undo, redo])
  );


  // Dismiss export toast on unmount (page change)
  useEffect(() => {
    return () => {
      if (exportToastIdRef.current) {
        toast.dismiss(exportToastIdRef.current);
        exportToastIdRef.current = null;
      }
    };
  }, []);

  const handlePremiumBlock = useCallback((feature: string) => {
    posthog.capture("premium_feature_blocked", {
      features: [feature],
      has_used_trial: hasUsedTrial,
      source: isDashboard ? "dashboard" : "landing",
    });
    if (hasUsedTrial) {
      setPremiumFeaturesList([feature]);
      setUpgradeReason("premium-features");
      setShowUpgradeModal(true);
      posthog.capture("upgrade_modal_viewed", { reason: "premium-features", source: isDashboard ? "dashboard" : "landing" });
    } else {
      setPremiumFeaturesList([feature]);
      setTrialReason("premium-features");
      setShowTrialModal(true);
    }
  }, [hasUsedTrial, isDashboard]);

  const handleSaveAsTemplate = useCallback(async (s: EditorSettings, name?: string) => {
    try {
      const res = await fetch("/api/user/card-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "My template", settings: s }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save template");
        return;
      }
      toast.custom((id) => (
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 md:p-5 shadow-lg max-w-[calc(100vw-2rem)] w-90 flex flex-col gap-2 md:gap-3 font-[DM_Mono,monospace]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span className="text-sm md:text-base font-semibold">Template saved!</span>
            </div>
            <button onClick={() => toast.dismiss(id)} className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 -m-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <a
            href="/dashboard/api"
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background rounded-xl px-4 py-2 md:py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            View API integration
          </a>
        </div>
      ), { duration: 5000 });
    } catch {
      toast.error("Failed to save template");
    }
  }, []);

  const editorContent = (
    <section id="editor" className="relative flex flex-col md:flex-row gap-3 md:rounded-4xl md:bg-fade md:p-3 scroll-mt-18">
      <Sidebar
        settings={settings}
        onSettingsChange={setSettings}
        onExport={() => handleExport(false)}
        onCopy={handleCopy}
        isExporting={isExporting}
        cooldown={cooldown}
        isPremium={isPremium}
        lockPremiumFeatures={lockPremiumFeatures}
        onPremiumBlock={handlePremiumBlock}
        exportsThisWeek={exportsThisWeek}
        maxExportsPerWeek={maxExportsPerWeek}
        hasUsedTrial={hasUsedTrial}
      />
      <div className="flex-1 flex flex-col gap-3">
        <Preview ref={previewRef} settings={settings} backgrounds={ALL_BACKGROUNDS} isPremium={isPremium} />
        <StyleControls
          settings={settings}
          onSettingsChange={setSettings}
          backgrounds={ALL_BACKGROUNDS}
          isPremium={isPremium}
          lockPremiumFeatures={lockPremiumFeatures}
          onPremiumBlock={handlePremiumBlock}
          onSaveAsTemplate={handleSaveAsTemplate}
          hasApiKeys={hasApiKeys}
        />
      </div>
    </section>
  );

  // Dashboard: show share CTA or upgrade banner + editor
  if (isDashboard) {
    return (
      <>
        {!isPremium && weekExportCount >= FREE_WEEKLY_LIMIT ? (
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-6 max-w-md mx-auto">
            <p className="text-8xl">🐯</p>
            <h3 className="text-2xl font-heading font-bold">No exports left this week</h3>
            <p className="text-muted-foreground">
              Your 3 weekly exports reset every Monday.
              <br />
              Upgrade to Pro for unlimited exports.
            </p>
            {!hasUsedTrial ? (
              <div className="flex flex-col items-center gap-1.5">
                <Button
                  size="lg"
                  onClick={() => {
                    fetch("/api/user/trial", { method: "POST" })
                      .then(() => { window?.datafast?.("trial_started"); window.location.reload(); })
                      .catch(() => { window.location.href = "/dashboard/plan#plans"; });
                  }}
                >
                  Start free trial
                </Button>
                <span className="text-xs text-muted-foreground">No credit card required</span>
              </div>
            ) : (
              <Button asChild size="lg">
                <a href="/dashboard/plan#plans">Upgrade to Pro</a>
              </Button>
            )}
          </div>
        ) : (
          <>
            {isPremium ? (
              <div className="text-center text-sm text-muted-foreground mb-4">
                If you tag{" "}
                <a href="https://x.com/yannick_ferire" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@yannick_ferire</a>
                {" "}on your post with 🐯 GROAR visual, I&apos;ll repost you!
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground mb-4">
                {!hasUsedTrial ? (
                  <button
                    onClick={() => {
                      fetch("/api/user/trial", { method: "POST" })
                        .then(() => { window?.datafast?.("trial_started"); window.location.reload(); })
                        .catch(() => { window.location.href = "/dashboard/plan#plans"; });
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Start free trial
                  </button>
                ) : (
                  <a href="/dashboard/plan#plans" className="text-primary hover:underline font-medium">Upgrade to Pro</a>
                )}
                {" "}to unlock all backgrounds, templates, and more.
              </div>
            )}
            {editorContent}
          </>
        )}
      </>
    );
  }

  // Landing page: wrapper with glow effects + optional upgrade modal
  return (
    <FadeIn delay={0.6} duration={0.7}>
      <div className="relative w-full max-w-6xl mx-auto mt-6">
        {/* Top horizontal glow */}
        <div
          className="absolute -top-24 left-1/2 w-[140%] h-48 rounded-[100%] blur-3xl pointer-events-none animate-[glowRise_0.8s_ease-out_0.95s_forwards]"
          style={{ background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 60%)", opacity: 0, transform: "translateX(-50%) translateY(40px)", "--fade-opacity": 0.4 } as React.CSSProperties}
        />
        {/* Center vertical glow */}
        <div
          className="absolute top-0 left-1/2 w-full h-[140%] rounded-[100%] blur-3xl pointer-events-none animate-[glowRise_0.8s_ease-out_0.95s_forwards]"
          style={{ background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 60%)", opacity: 0, transform: "translateX(-50%) translateY(40px)", "--fade-opacity": 0.1 } as React.CSSProperties}
        />
        {editorContent}
        {!hideUpgradeModal && (
          <>
            <UpgradeModal
              open={showUpgradeModal}
              onOpenChange={setShowUpgradeModal}
              exportCount={weekExportCount}
              reason={upgradeReason}
              premiumFeatures={premiumFeaturesList}
            />
            <TrialSignupModal
              open={showTrialModal}
              onOpenChange={setShowTrialModal}
              reason={trialReason}
              exportCount={weekExportCount}
              premiumFeatures={premiumFeaturesList}
            />
          </>
        )}
      </div>
    </FadeIn>
  );
}
