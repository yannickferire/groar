"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toJpeg } from "html-to-image";
import { inlineBackgroundImages, buildFontEmbedCSS } from "@/lib/export-preprocess";
import Sidebar from "./editor/Sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Preview from "./editor/Preview";
import StyleControls from "./editor/StyleControls";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";
import { FONTS } from "@/lib/fonts";
import { TEMPLATES } from "@/lib/templates";
import { useToast } from "@/components/ui/toast";
import { FadeIn } from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";
import UpgradeModal, { FREE_WEEKLY_LIMIT } from "@/components/UpgradeModal";
import TrialSignupModal from "@/components/TrialSignupModal";
import { checkPremiumFeatures } from "@/lib/premium-check";

// Convert data URL to File for upload
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const STORAGE_KEY = "groar-editor-settings";

// Solid color preset (displayed last in StyleControls)
const SOLID_COLOR_PRESET: BackgroundPreset = {
  id: "solid-color",
  name: "Solid Color",
  color: "#f59e0b", // Primary color as default
};

// Combine solid color with image backgrounds
const ALL_BACKGROUNDS = [SOLID_COLOR_PRESET, ...BACKGROUNDS];

export type PeriodType = "day" | "week" | "month" | "year";

export type MetricType = "followers" | "followings" | "posts" | "impressions" | "replies" | "engagementRate" | "engagement" | "profileVisits" | "likes" | "reposts" | "bookmarks";

export type Metric = {
  type: MetricType;
  value: number;
  prefix?: string;
};

export const METRIC_LABELS: Record<MetricType, string> = {
  followers: "Followers",
  followings: "Followings",
  posts: "Posts",
  impressions: "Impressions",
  replies: "Replies",
  engagementRate: "Engagement Rate",
  engagement: "Engagement",
  profileVisits: "Profile Visits",
  likes: "Likes",
  reposts: "Reposts",
  bookmarks: "Bookmarks",
};

export type BackgroundPreset = {
  id: string;
  name: string;
  image?: string;
  color?: string;
  gradient?: string;
  premium?: boolean;
};

export type BackgroundSettings = {
  presetId: string;
  solidColor?: string;
};

export type PeriodSettings = {
  type: PeriodType;
  number: number;
} | null;

// Premium feature types
export type AspectRatioType = "post" | "square" | "banner";
export type FontFamily = "bricolage" | "inter" | "space-grotesk" | "dm-mono";
export type TemplateType = "metrics" | "milestone" | "progress";

export type BrandingSettings = {
  logoUrl?: string;
  position: "left" | "center" | "right";
};

export type EditorSettings = {
  // Existing fields
  handle: string;
  period: PeriodSettings;
  metrics: Metric[];
  background: BackgroundSettings;
  textColor: string;
  // Premium fields (optional for backward compatibility)
  aspectRatio?: AspectRatioType;
  font?: FontFamily;
  template?: TemplateType;
  branding?: BrandingSettings;
  goal?: number;
  abbreviateNumbers?: boolean;
};

const defaultSettings: EditorSettings = {
  handle: "@yannick_ferire",
  period: { type: "week", number: 1 },
  metrics: [{ type: "followers", value: 56 }],
  background: { presetId: BACKGROUNDS[0]?.id || "solid-color", solidColor: "#f59e0b" },
  textColor: "#faf7e9",
  // Premium defaults
  aspectRatio: "post",
  font: "dm-mono",
  template: "metrics",
  abbreviateNumbers: true,
};

function loadSettings(): EditorSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the structure and merge with defaults for backward compatibility
      if (parsed.handle && parsed.metrics && parsed.background && parsed.textColor) {
        return {
          ...defaultSettings,
          ...parsed,
          // Ensure nested objects are properly merged
          background: { ...defaultSettings.background, ...parsed.background },
          branding: parsed.branding,
        };
      }
    }
  } catch {
    // Invalid JSON, use defaults
  }
  return defaultSettings;
}

function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage not available
  }
}

type EditorProps = {
  isPremium?: boolean;
  isDashboard?: boolean;
};

export default function Editor({ isPremium = false, isDashboard = false }: EditorProps) {
  const searchParams = useSearchParams();
  const importId = searchParams.get("import");

  // On landing page, detect if user has a premium plan to hide the upgrade modal
  // Also sync today's export count from DB when logged in
  const [hideUpgradeModal, setHideUpgradeModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const dbExportCountLoaded = useRef(false);
  useEffect(() => {
    if (isDashboard) return; // Dashboard already knows
    fetch("/api/user/plan")
      .then((res) => {
        if (res.status === 401) return null; // Not logged in
        return res.json();
      })
      .then((data) => {
        if (!data) return; // Not logged in
        setIsLoggedIn(true);
        if (data.plan && data.plan !== "free") setHideUpgradeModal(true);
        // Track if user has already used their trial (trialing or expired)
        if (data.trialEnd) setHasUsedTrial(true);
        // Sync export count from DB (more accurate than localStorage)
        if (data.exportsThisWeek !== undefined) {
          const dbCount = Number(data.exportsThisWeek);
          const localCount = parseInt(localStorage.getItem(getWeekKey()) || "0", 10);
          const maxCount = Math.max(dbCount, localCount);
          localStorage.setItem(getWeekKey(), maxCount.toString());
          setWeekExportCount(maxCount);
          dbExportCountLoaded.current = true;
        }
      })
      .catch(() => {});
  }, [isDashboard]);

  const lockPremiumFeatures = isDashboard && !isPremium;

  const [settings, setSettings] = useState<EditorSettings>(() => {
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
    return loaded;
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!importId);
  const [cooldown, setCooldown] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"limit" | "premium-features">("limit");
  const [trialReason, setTrialReason] = useState<"limit" | "premium-features" | undefined>();
  const [premiumFeaturesList, setPremiumFeaturesList] = useState<string[]>([]);
  const [weekExportCount, setWeekExportCount] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Track weekly exports for free users
  const getWeekKey = () => {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `groar-exports-${now.getFullYear()}-w${week}`;
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
          setSettings({
            ...defaultSettings,
            ...imported,
            background: { ...defaultSettings.background, ...imported.background },
          });
        }
      })
      .catch(() => {
        setSettings(loadSettings());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [importId]);

  // Save settings to localStorage when they change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveSettings(settings);
    }, 500);
    return () => clearTimeout(timeout);
  }, [settings]);

  // Smooth scroll to re-center editor when aspect ratio changes
  const prevAspectRatio = useRef(settings.aspectRatio);
  useEffect(() => {
    if (settings.aspectRatio !== prevAspectRatio.current) {
      prevAspectRatio.current = settings.aspectRatio;
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [settings.aspectRatio]);

  const handleExport = useCallback(async () => {
    if (!previewRef.current || cooldown > 0) return;

    // Free user checks (premium features + weekly limit) — landing page only
    // Dashboard handles premium gating at the UI level (lockPremiumFeatures)
    if (!isPremium && !isDashboard && !hideUpgradeModal) {
      // Check premium features
      const usage = checkPremiumFeatures(settings, ALL_BACKGROUNDS);
      if (usage.isPremium) {
        setPremiumFeaturesList(usage.features);
        if (hasUsedTrial) {
          setUpgradeReason("premium-features");
          setShowUpgradeModal(true);
        } else {
          setTrialReason("premium-features");
          setShowTrialModal(true);
        }
        return;
      }

      // Check weekly limit
      if (getWeekExportCount() >= FREE_WEEKLY_LIMIT) {
        if (hasUsedTrial) {
          setUpgradeReason("limit");
          setShowUpgradeModal(true);
        } else {
          setTrialReason("limit");
          setShowTrialModal(true);
        }
        return;
      }
    }

    setIsExporting(true);
    let injectedWatermark: HTMLElement | null = null;

    try {
      // For non-premium users: ensure watermark is present in export
      if (!isPremium) {
        const existingWatermark = previewRef.current.querySelector(".groar-watermark") as HTMLElement;
        const isWatermarkVisible = existingWatermark &&
          existingWatermark.offsetParent !== null &&
          getComputedStyle(existingWatermark).display !== "none" &&
          getComputedStyle(existingWatermark).visibility !== "hidden";

        // If watermark is missing or hidden, inject one
        if (!isWatermarkVisible) {
          injectedWatermark = document.createElement("footer");
          injectedWatermark.style.cssText = "position: absolute; bottom: 3%; left: 0; right: 0; z-index: 10; display: flex; justify-content: center;";
          injectedWatermark.innerHTML = `<p style="color: ${settings.textColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.15); font-size: 0.875rem; white-space: nowrap;"><span style="opacity: 0.6;">made with</span> 🐯 <span style="opacity: 0.6;">groar</span></p>`;
          previewRef.current.appendChild(injectedWatermark);
        }
      }

      // Get export dimensions based on aspect ratio
      const aspectRatio = settings.aspectRatio || "post";
      const { width: exportWidth, height: exportHeight } = ASPECT_RATIOS[aspectRatio];

      // Safari silently fails to fetch resources in html-to-image's iframe
      // Pre-process: inline background images + fonts as base64 on Safari only
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      const restoreBackgrounds = await inlineBackgroundImages(previewRef.current);
      const fontEmbedCSS = isSafari ? await buildFontEmbedCSS() : undefined;

      const baseOptions: Record<string, unknown> = {
        canvasWidth: exportWidth,
        canvasHeight: exportHeight,
        quality: 0.8,
        cacheBust: true,
        skipAutoScale: true,
        pixelRatio: 2,
        includeQueryParams: true,
        filter: (node: Element) => {
          const tagName = node.tagName;
          if (tagName === "SCRIPT" || tagName === "NOSCRIPT") {
            return false;
          }
          return true;
        },
      };

      // Only pass fontEmbedCSS on Safari — on Chrome/Firefox html-to-image
      // handles fonts natively and our custom CSS breaks it
      if (fontEmbedCSS) {
        baseOptions.fontEmbedCSS = fontEmbedCSS;
      }

      let dataUrl: string;
      try {
        // First attempt: try with font embedding
        dataUrl = await toJpeg(previewRef.current, { ...baseOptions, skipFonts: false });
      } catch (fontError) {
        // Firefox often fails with font embedding - retry without fonts
        console.warn("Font embedding failed, retrying without fonts:", fontError);
        dataUrl = await toJpeg(previewRef.current, { ...baseOptions, skipFonts: true });
      }

      // Restore original background image URLs
      restoreBackgrounds();

      // Remove injected watermark if we added one
      if (injectedWatermark) {
        injectedWatermark.remove();
      }

      const link = document.createElement("a");
      link.download = `groar-${settings.handle.replace("@", "")}-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();

      // Save to database if logged in (premium)
      if (isPremium) {
        try {
          const file = dataURLtoFile(dataUrl, `export-${Date.now()}.jpg`);
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
        } catch (saveError) {
          console.error("Failed to save export:", saveError);
        }
      }

      // Landing page: track export for global counter + update counters in real-time
      if (!isPremium) {
        const followersValue = settings.metrics.find((m) => m.type === "followers")?.value ?? 0;
        fetch("/api/stats/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followers: followersValue,
            backgroundId: settings.background.presetId,
            template: settings.template,
          }),
        }).catch(() => {});
        window.dispatchEvent(
          new CustomEvent("groar:export", { detail: { followers: followersValue } })
        );
      }

      // Start cooldown after successful export
      setCooldown(5);

      if (isPremium || hideUpgradeModal) {
        showToast("Image downloaded successfully!");
      } else {
        // Increment export count and show upsell
        incrementExportCount();
        if (hasUsedTrial) {
          setUpgradeReason("limit");
          setShowUpgradeModal(true);
        } else {
          setTrialReason(undefined); // post-export
          setShowTrialModal(true);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      // Clean up injected watermark on error
      if (injectedWatermark) {
        injectedWatermark.remove();
      }
      showToast("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [settings, isPremium, isDashboard, hideUpgradeModal, isLoggedIn, hasUsedTrial, showToast, cooldown, getWeekExportCount, incrementExportCount]);

  useKeyboardShortcuts(
    useMemo(() => [{ key: "s", meta: true, action: handleExport }], [handleExport])
  );

  // Auto-export when returning from trial signup
  const autoExportParam = searchParams.get("autoexport") === "1";
  const handleExportRef = useRef(handleExport);
  useEffect(() => { handleExportRef.current = handleExport; }, [handleExport]);
  useEffect(() => {
    if (!isPremium || isLoading) return;
    let pending = false;
    try { pending = localStorage.getItem("groar-pending-export") === "true"; } catch {}
    if (!pending && !autoExportParam) return;
    // Remove flag inside the timeout so React strict mode double-run doesn't clear it prematurely
    const timer = setTimeout(() => {
      try { localStorage.removeItem("groar-pending-export"); } catch {}
      handleExportRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isPremium, isLoading, autoExportParam]);

  const editorContent = (
    <section id="editor" className="relative flex flex-col md:flex-row gap-3 rounded-4xl bg-fade p-3 scroll-mt-18">
      <Sidebar
        settings={settings}
        onSettingsChange={setSettings}
        onExport={handleExport}
        isExporting={isExporting}
        cooldown={cooldown}
        isPremium={isPremium}
        lockPremiumFeatures={lockPremiumFeatures}
      />
      <div className="flex-1 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="aspect-video rounded-3xl bg-sidebar"
            />
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Preview ref={previewRef} settings={settings} backgrounds={ALL_BACKGROUNDS} isPremium={isPremium} />
            </motion.div>
          )}
        </AnimatePresence>
        <StyleControls
          settings={settings}
          onSettingsChange={setSettings}
          backgrounds={ALL_BACKGROUNDS}
          isPremium={isPremium}
          lockPremiumFeatures={lockPremiumFeatures}
        />
      </div>
    </section>
  );

  // Dashboard: show share CTA or upgrade banner + editor
  if (isDashboard) {
    return (
      <>
        {isPremium ? (
          <div className="text-center text-sm text-muted-foreground mb-4">
            When you share your visuals, tag{" "}
            <a href="https://x.com/yannick_ferire" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@yannick_ferire</a>
            , I will repost you!
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground mb-4">
            Upgrade to Pro to unlock all backgrounds, fonts, templates, and more.{" "}
            <a href="/pricing" className="text-primary hover:underline font-medium">See plans</a>
          </div>
        )}
        {editorContent}
      </>
    );
  }

  // Landing page: wrapper with glow effects + optional upgrade modal
  return (
    <FadeIn delay={0.6} duration={0.7}>
      <div className="relative w-full max-w-6xl mx-auto mt-6 overflow-hidden">
        {/* Top horizontal glow */}
        <div
          className="absolute -top-24 left-1/2 w-[140%] h-48 rounded-[100%] blur-3xl pointer-events-none animate-[glowRise_0.8s_ease-out_0.95s_forwards]"
          style={{ background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 60%)", opacity: 0, transform: "translateX(-50%) translateY(40px)", "--fade-opacity": 0.5 } as React.CSSProperties}
        />
        {/* Center vertical glow */}
        <div
          className="absolute top-0 left-1/2 w-full h-[140%] rounded-[100%] blur-3xl pointer-events-none animate-[glowRise_0.8s_ease-out_0.95s_forwards]"
          style={{ background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 60%)", opacity: 0, transform: "translateX(-50%) translateY(40px)", "--fade-opacity": 0.2 } as React.CSSProperties}
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
