"use client";

import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import Sidebar from "./editor/Sidebar";
import Preview from "./editor/Preview";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { useToast } from "@/components/ui/toast";
import { FadeIn } from "@/components/ui/motion";

// Solid color preset - always first in the list
const SOLID_COLOR_PRESET: BackgroundPreset = {
  id: "solid-color",
  name: "Solid Color",
  color: "#f59e0b", // Primary color as default
};

// Combine solid color with image backgrounds
const ALL_BACKGROUNDS = [SOLID_COLOR_PRESET, ...BACKGROUNDS];

export type PeriodType = "day" | "week" | "month" | "year";

export type MetricType = "followers" | "impressions" | "replies" | "engagementRate";

export type Metric = {
  type: MetricType;
  value: number;
};

export const METRIC_LABELS: Record<MetricType, string> = {
  followers: "Followers",
  impressions: "Impressions",
  replies: "Replies",
  engagementRate: "Engagement Rate",
};

export type BackgroundPreset = {
  id: string;
  name: string;
  image?: string;
  color?: string;
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
  textColor: "#ffffff",
};

export default function Editor() {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `groar-${settings.handle.replace("@", "")}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Image downloaded successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [settings.handle, showToast]);

  return (
    <FadeIn delay={0.6} duration={0.7}>
      <section id="editor" className="w-full max-w-6xl mx-auto mt-6 flex flex-col md:flex-row gap-3 rounded-4xl bg-fade p-3">
        <Sidebar
          settings={settings}
          onSettingsChange={setSettings}
          backgrounds={ALL_BACKGROUNDS}
          onExport={handleExport}
          isExporting={isExporting}
        />
        <Preview ref={previewRef} settings={settings} backgrounds={ALL_BACKGROUNDS} />
      </section>
    </FadeIn>
  );
}
