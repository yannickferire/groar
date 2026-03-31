"use client";

import { useMemo } from "react";
import Preview from "./Preview";
import { ALL_BACKGROUNDS } from "./utils";
import type { EditorSettings, TemplateType, FontFamily, AspectRatioType, MetricType } from "./types";
import type { AutomationVisualSettings, AutoPostCardTemplate } from "@/lib/auto-post-shared";

export type CardPreviewProps = {
  metric: MetricType;
  /** Additional metrics for multi-metric cards (metrics template) */
  extraMetrics?: (MetricType | { metric: MetricType; value: number })[];
  value?: number;
  goal?: number;
  cardTemplate?: AutoPostCardTemplate;
  /** Single-value visual settings (from automation) */
  visualSettings?: Partial<AutomationVisualSettings>;
  handle?: string;
  isPremium?: boolean;
  className?: string;
  /** Override Preview rounding. Use "none" for thumbnails. */
  rounded?: "none" | "lg" | "3xl";
  /** When true, the preview fills its parent height and auto-sizes width via aspect-ratio. */
  fill?: boolean;
  /** Heading text to display (e.g. "Day 13", "Week 5") */
  headingText?: string;
};

export default function CardPreview({
  metric,
  extraMetrics,
  value = 1000,
  goal = 10000,
  cardTemplate = "milestone",
  visualSettings,
  handle,
  isPremium = true,
  className,
  rounded,
  fill,
  headingText,
}: CardPreviewProps) {
  const settings = useMemo<EditorSettings>(() => {
    const vs = visualSettings;
    // Support both array and legacy single-value fields
    const bgId = vs?.backgrounds?.[0] || vs?.background || "noisy-lights";
    const font = (vs?.fonts?.[0] || vs?.font || "bricolage") as FontFamily;
    const textColor = vs?.textColor || "#ffffff";
    const ar = (vs?.aspectRatio || "post") as AspectRatioType;
    const template = cardTemplate as TemplateType;
    const emoji = vs?.emojis?.[0] || { emoji: vs?.milestoneEmoji || "🎉", unified: vs?.milestoneEmojiUnified || "1f389", name: vs?.milestoneEmojiName || "Party Popper" };

    // Build metrics array: primary + extras
    // Note: don't pass prefix for mrr/revenue — formatMetricValue already adds $ for financial types
    const allMetrics = [
      { id: "preview", type: metric, value },
      ...(extraMetrics || []).map((m, i) => {
        const isObj = typeof m === "object" && m !== null && "metric" in m;
        const type = isObj ? (m as { metric: MetricType }).metric : m as MetricType;
        const val = isObj ? (m as { value: number }).value : (type === "mrr" ? 850 : type === "revenue" ? 4200 : 500);
        return { id: `extra-${i}`, type, value: val };
      }),
    ];

    return {
      handle: handle || "",
      period: null,
      heading: headingText ? { type: "custom" as const, text: headingText } : null,
      metrics: allMetrics,
      metricsLayout: vs?.metricsLayout || "stack",
      background: { presetId: bgId },
      textColor,
      aspectRatio: ar,
      font,
      template,
      goal: template === "progress" ? goal : undefined,
      milestoneEmoji: emoji.emoji,
      milestoneEmojiUnified: emoji.unified,
      milestoneEmojiName: emoji.name,
      milestoneEmojiCount: template === "milestone" ? (vs?.milestoneEmojiCount ?? 3) : 0,
      abbreviateNumbers: vs?.abbreviateNumbers !== false,
      ...(vs?.logoUrl ? { branding: { logoUrl: vs.logoUrl, position: vs.logoPosition || "center", logoSize: vs.logoSize ?? 30, enabled: true } } : {}),
    };
  }, [metric, extraMetrics, value, goal, cardTemplate, visualSettings, handle, headingText]);

  // When fill is true, propagate h-full down through Preview's DOM:
  // CardPreview div > Preview flex-col > overflow wrapper > aspect-ratio container
  const fillClasses = fill
    ? " h-full [&>div]:h-full [&>div>div]:h-full [&>div>div>div]:h-full [&>div>div>div]:w-auto"
    : "";

  return (
    <div className={`${className || ""}${fillClasses}`}>
      <Preview
        settings={settings}
        backgrounds={ALL_BACKGROUNDS}
        isPremium={isPremium}
        {...(rounded ? { rounded } : {})}
      />
    </div>
  );
}
