"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toJpeg } from "html-to-image";
import Sidebar from "./editor/Sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Preview from "./editor/Preview";
import StyleControls from "./editor/StyleControls";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";
import { useToast } from "@/components/ui/toast";
import { FadeIn } from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";
import UpgradeModal, { FREE_DAILY_LIMIT } from "@/components/UpgradeModal";

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
};

export default function Editor({ isPremium = false }: EditorProps) {
  const searchParams = useSearchParams();
  const importId = searchParams.get("import");

  // On landing page, detect if user has a premium plan to hide the upgrade modal
  const [hideUpgradeModal, setHideUpgradeModal] = useState(false);
  useEffect(() => {
    if (isPremium) return; // Dashboard already knows
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => {
        if (data.plan && data.plan !== "free") setHideUpgradeModal(true);
      })
      .catch(() => {});
  }, [isPremium]);

  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!importId);
  const [cooldown, setCooldown] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [todayExportCount, setTodayExportCount] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Track daily exports for free users
  const getExportCountKey = () => {
    const today = new Date().toISOString().split("T")[0];
    return `groar-exports-${today}`;
  };

  const getTodayExportCount = useCallback(() => {
    if (typeof window === "undefined") return 0;
    const count = localStorage.getItem(getExportCountKey());
    return count ? parseInt(count, 10) : 0;
  }, []);

  const incrementExportCount = useCallback(() => {
    const key = getExportCountKey();
    const current = getTodayExportCount();
    const newCount = current + 1;
    localStorage.setItem(key, newCount.toString());
    setTodayExportCount(newCount);
    return newCount;
  }, [getTodayExportCount]);

  // Load today's export count on mount
  useEffect(() => {
    setTodayExportCount(getTodayExportCount());
  }, [getTodayExportCount]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Load settings from localStorage on mount, or from import if specified
  useEffect(() => {
    if (importId) {
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
              // Ensure nested objects are properly merged
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
    } else {
      const loaded = loadSettings();
      if (!isPremium) {
        // Landing page: always use default premium settings
        loaded.template = defaultSettings.template;
        loaded.font = defaultSettings.font;
        loaded.aspectRatio = defaultSettings.aspectRatio;
        loaded.abbreviateNumbers = defaultSettings.abbreviateNumbers;
        loaded.branding = undefined;
      }
      setSettings(loaded);
    }
  }, [importId, isPremium]);

  // Save settings to localStorage when they change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveSettings(settings);
    }, 500);
    return () => clearTimeout(timeout);
  }, [settings]);

  const handleExport = useCallback(async () => {
    if (!previewRef.current || cooldown > 0) return;

    // Check daily limit for free users (skip for premium users even on landing page)
    if (!isPremium && !hideUpgradeModal && getTodayExportCount() >= FREE_DAILY_LIMIT) {
      setShowUpgradeModal(true);
      return;
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

      const baseOptions = {
        canvasWidth: exportWidth,
        canvasHeight: exportHeight,
        quality: 0.92,
        cacheBust: true,
        skipAutoScale: true,
        pixelRatio: 1,
        includeQueryParams: true,
        filter: (node: Element) => {
          const tagName = node.tagName;
          if (tagName === "SCRIPT" || tagName === "NOSCRIPT") {
            return false;
          }
          return true;
        },
      };

      let dataUrl: string;
      try {
        // First attempt: try with font embedding
        dataUrl = await toJpeg(previewRef.current, { ...baseOptions, skipFonts: false });
      } catch (fontError) {
        // Firefox often fails with font embedding - retry without fonts
        console.warn("Font embedding failed, retrying without fonts:", fontError);
        dataUrl = await toJpeg(previewRef.current, { ...baseOptions, skipFonts: true });
      }

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
          body: JSON.stringify({ followers: followersValue }),
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
        // Increment export count and show upgrade modal
        incrementExportCount();
        setShowUpgradeModal(true);
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
  }, [settings, isPremium, hideUpgradeModal, showToast, cooldown, getTodayExportCount, incrementExportCount]);

  useKeyboardShortcuts(
    useMemo(() => [{ key: "s", meta: true, action: handleExport }], [handleExport])
  );

  const editorContent = (
    <section id="editor" className="relative flex flex-col md:flex-row gap-3 rounded-4xl bg-fade p-3 scroll-mt-18">
      <Sidebar
        settings={settings}
        onSettingsChange={setSettings}
        onExport={handleExport}
        isExporting={isExporting}
        cooldown={cooldown}
        isPremium={isPremium}
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
        />
      </div>
    </section>
  );

  // Dashboard: no wrapper needed
  if (isPremium) {
    return editorContent;
  }

  // Landing page: wrapper with glow effects + optional upgrade modal
  return (
    <FadeIn delay={0.6} duration={0.7}>
      <div className="relative w-full max-w-6xl mx-auto mt-6">
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
          <UpgradeModal
            open={showUpgradeModal}
            onOpenChange={setShowUpgradeModal}
            exportCount={todayExportCount}
          />
        )}
      </div>
    </FadeIn>
  );
}
