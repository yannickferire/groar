"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toJpeg } from "html-to-image";
import Sidebar from "./editor/Sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Preview from "./editor/Preview";
import StyleControls from "./editor/StyleControls";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { useToast } from "@/components/ui/toast";
import { FadeIn } from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Rocket01Icon, Loading03Icon, CrownIcon } from "@hugeicons/core-free-icons";

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
const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 675;

// Solid color preset (displayed last in StyleControls)
const SOLID_COLOR_PRESET: BackgroundPreset = {
  id: "solid-color",
  name: "Solid Color",
  color: "#f59e0b", // Primary color as default
};

// Combine solid color with image backgrounds
const ALL_BACKGROUNDS = [SOLID_COLOR_PRESET, ...BACKGROUNDS];

export type PeriodType = "day" | "week" | "month" | "year";

export type MetricType = "followers" | "impressions" | "replies" | "engagementRate" | "engagement" | "profileVisits" | "likes" | "reposts" | "bookmarks";

export type Metric = {
  type: MetricType;
  value: number;
};

export const METRIC_LABELS: Record<MetricType, string> = {
  followers: "Followers",
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
};

export type BackgroundSettings = {
  presetId: string;
  solidColor?: string;
};

export type PeriodSettings = {
  type: PeriodType;
  number: number;
} | null;

export type EditorSettings = {
  handle: string;
  period: PeriodSettings;
  metrics: Metric[];
  background: BackgroundSettings;
  textColor: string;
};

const defaultSettings: EditorSettings = {
  handle: "@yannick_ferire",
  period: { type: "week", number: 1 },
  metrics: [{ type: "followers", value: 56 }],
  background: { presetId: BACKGROUNDS[0]?.id || "solid-color", solidColor: "#f59e0b" },
  textColor: "#faf7e9",
};

function loadSettings(): EditorSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the structure
      if (parsed.handle && parsed.metrics && parsed.background && parsed.textColor) {
        return parsed;
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

  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!importId);
  const [cooldown, setCooldown] = useState(0);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const MAX_METRICS = 5;

  // Fetch analytics from X API and populate metrics
  const fetchFromX = useCallback(async () => {
    setIsFetchingAnalytics(true);
    try {
      // First fetch fresh data from X
      const fetchRes = await fetch("/api/analytics/fetch", { method: "POST" });
      if (!fetchRes.ok) {
        const data = await fetchRes.json();
        showToast(data.error || "Failed to fetch analytics", "error");
        return;
      }

      const fetchData = await fetchRes.json();
      const accountResult = fetchData.accounts?.[0];

      // Handle "already fetched today" - still load the data but show info message
      const wasAlreadyFetched = accountResult?.alreadyFetched;
      if (wasAlreadyFetched) {
        // Continue to load the existing data...
      } else if (!accountResult?.success) {
        const errorMsg = accountResult?.error || "No analytics data available";
        // Check for specific errors
        if (errorMsg.includes("Token expired") || errorMsg.includes("reconnect") || errorMsg.includes("Unauthorized") || errorMsg.includes("401")) {
          showToast("Token expired — reconnect in Connections", "error");
        } else if (errorMsg.includes("No access token")) {
          showToast("X account not connected", "error");
        } else {
          showToast(errorMsg, "error");
        }
        return;
      }

      // Get the stored analytics to populate metrics
      const analyticsRes = await fetch("/api/analytics?days=1");
      if (!analyticsRes.ok) {
        showToast("Failed to load analytics data", "error");
        return;
      }

      const analyticsData = await analyticsRes.json();
      const account = analyticsData.accounts?.[0];
      const latest = account?.latest;

      if (!latest) {
        showToast("No analytics data found", "error");
        return;
      }

      // Map API data to editor metrics
      const newMetrics: Metric[] = [];

      // Followers (always available - free)
      if (latest.followersCount > 0) {
        newMetrics.push({ type: "followers", value: latest.followersCount });
      }

      // Impressions (paid - may be 0)
      if (latest.impressionsCount > 0) {
        newMetrics.push({ type: "impressions", value: latest.impressionsCount });
      }

      // Likes (free)
      if (latest.likesCount > 0) {
        newMetrics.push({ type: "likes", value: latest.likesCount });
      }

      // Reposts (free)
      if (latest.retweetsCount > 0) {
        newMetrics.push({ type: "reposts", value: latest.retweetsCount });
      }

      // Replies (free)
      if (latest.repliesCount > 0) {
        newMetrics.push({ type: "replies", value: latest.repliesCount });
      }

      // Limit to MAX_METRICS and ensure at least one metric
      const finalMetrics = newMetrics.slice(0, MAX_METRICS);
      if (finalMetrics.length === 0) {
        finalMetrics.push({ type: "followers", value: 0 });
      }

      // Update settings
      setSettings(prev => ({
        ...prev,
        handle: account.username ? `@${account.username}` : prev.handle,
        metrics: finalMetrics,
      }));

      showToast(wasAlreadyFetched
        ? "Using today's data (1 refresh/day)"
        : "Analytics loaded successfully!"
      );
    } catch (error) {
      console.error("Error fetching from X:", error);
      showToast("Failed to fetch analytics", "error");
    } finally {
      setIsFetchingAnalytics(false);
    }
  }, [showToast]);

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
            const imported = data.export.metrics as EditorSettings;
            setSettings({
              handle: imported.handle || defaultSettings.handle,
              period: imported.period ?? defaultSettings.period,
              metrics: imported.metrics || defaultSettings.metrics,
              background: imported.background || defaultSettings.background,
              textColor: imported.textColor || defaultSettings.textColor,
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
      setSettings(loadSettings());
    }
  }, [importId]);

  // Save settings to localStorage when they change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveSettings(settings);
    }, 500);
    return () => clearTimeout(timeout);
  }, [settings]);

  const handleExport = useCallback(async () => {
    if (!previewRef.current || cooldown > 0) return;

    setIsExporting(true);
    let injectedWatermark: HTMLElement | null = null;

    try {
      // Check if watermark exists and is visible
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

      const dataUrl = await toJpeg(previewRef.current, {
        canvasWidth: EXPORT_WIDTH,
        canvasHeight: EXPORT_HEIGHT,
        quality: 0.92,
        cacheBust: true,
      });

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
          formData.append("metrics", JSON.stringify({
            handle: settings.handle,
            period: settings.period,
            metrics: settings.metrics,
            background: settings.background,
            textColor: settings.textColor,
          }));

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

      // Start cooldown after successful export
      setCooldown(5);
      showToast("Image downloaded successfully!");
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
  }, [settings, isPremium, showToast, cooldown]);

  useKeyboardShortcuts(
    useMemo(() => [{ key: "s", meta: true, action: handleExport }], [handleExport])
  );

  const editorContent = (
    <section id="editor" className="relative flex flex-col md:flex-row gap-3 rounded-4xl bg-fade p-3">
      <Sidebar
        settings={settings}
        onSettingsChange={setSettings}
        onExport={handleExport}
        isExporting={isExporting}
        cooldown={cooldown}
      />
      <div className="flex-1 flex flex-col gap-3">
        {/* Fetch from X button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isPremium ? "1 refresh per day" : ""}
          </p>
          {isPremium ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors"
              onClick={fetchFromX}
              disabled={isFetchingAnalytics}
            >
              <HugeiconsIcon
                icon={isFetchingAnalytics ? Loading03Icon : Rocket01Icon}
                size={16}
                strokeWidth={1.5}
                className={isFetchingAnalytics ? "animate-spin" : ""}
                aria-hidden="true"
              />
              {isFetchingAnalytics ? "Fetching..." : "Fetch from X"}
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors"
            >
              <Link href="/pricing">
                <HugeiconsIcon
                  icon={CrownIcon}
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                Upgrade to auto-fetch X data
              </Link>
            </Button>
          )}
        </div>
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
        />
      </div>
    </section>
  );

  if (isPremium) {
    return editorContent;
  }

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
      </div>
    </FadeIn>
  );
}
