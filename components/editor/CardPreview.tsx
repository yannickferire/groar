"use client";

import { useMemo } from "react";
import { useCardImage } from "@/hooks/useCardImage";
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
  /** Override rounding. Use "none" for thumbnails. */
  rounded?: "none" | "lg" | "3xl";
  /** When true, the preview fills its parent height and auto-sizes width via aspect-ratio. */
  fill?: boolean;
  /** Heading text to display (e.g. "Day 13", "Week 5") */
  headingText?: string;
};

const ROUNDED_CLASSES = { none: "", lg: "rounded-lg", "3xl": "rounded-3xl" } as const;

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
  rounded = "3xl",
  fill,
  headingText,
}: CardPreviewProps) {
  const settings = useMemo<EditorSettings>(() => {
    const vs = visualSettings;
    const bgId = vs?.backgrounds?.[0] || vs?.background || "noisy-lights";
    const font = (vs?.fonts?.[0] || vs?.font || "bricolage") as FontFamily;
    const textColor = vs?.textColor || "#ffffff";
    const ar = (vs?.aspectRatio || "post") as AspectRatioType;
    const template = cardTemplate as TemplateType;
    const emoji = vs?.emojis?.[0] || { emoji: vs?.milestoneEmoji || "🎉", unified: vs?.milestoneEmojiUnified || "1f389", name: vs?.milestoneEmojiName || "Party Popper" };

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
      progressDisplay: template === "progress" ? (vs?.progressDisplay || "bar") : undefined,
      progressBarColor: template === "progress" ? vs?.progressBarColor : undefined,
      progressBarAuto: template === "progress" ? vs?.progressBarAuto : undefined,
      milestoneEmoji: emoji.emoji,
      milestoneEmojiUnified: emoji.unified,
      milestoneEmojiName: emoji.name,
      milestoneEmojiCount: template === "milestone" ? (vs?.milestoneEmojiCount ?? 3) : 0,
      abbreviateNumbers: vs?.abbreviateNumbers !== false,
      showTrending: template === "metrics" ? vs?.showTrending : undefined,
      ...(vs?.logoUrl ? { branding: { logoUrl: vs.logoUrl, position: vs.logoPosition || "center", logoSize: vs.logoSize ?? 30, enabled: true } } : {}),
    };
  }, [metric, extraMetrics, value, goal, cardTemplate, visualSettings, handle, headingText]);

  const { imageUrl, isLoading } = useCardImage(settings, 500);

  const fillClass = fill ? " h-full" : "";

  return (
    <div className={`${className || ""}${fillClass} ${ROUNDED_CLASSES[rounded]} overflow-hidden bg-sidebar`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Card preview"
          className={`w-full h-auto block transition-opacity duration-200 ${isLoading ? "opacity-60" : "opacity-100"}${fill ? " h-full object-cover" : ""}`}
          draggable={false}
        />
      ) : (
        <div className="aspect-video animate-pulse" />
      )}
    </div>
  );
}
