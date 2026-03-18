"use client";

import { EditorSettings, METRIC_LABELS, MetricType } from "@/components/Editor";
import { formatMetricValue } from "@/lib/metrics";
import { HugeiconsIcon } from "@hugeicons/react";
import { METRIC_ICONS } from "@/lib/metric-icons";
import { getAppleEmojiHQUrl, getAppleEmojiUrlFromNative } from "@/lib/emoji";

type MilestoneTemplateProps = {
  settings: EditorSettings;
};

// Seeded PRNG for deterministic emoji positions across re-renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type EmojiStyle = {
  fontSize: string;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  transform: string;
  filter?: string;
  opacity: number;
  lineHeight: number;
  zIndex?: number;
};

// Generate a procedural emoji position for indices 5–19
function generateEmojiStyle(index: number, isBanner: boolean): EmojiStyle {
  // Use different prime multipliers per index for more variation
  const r = (offset: number) => seededRandom(index * 13 + offset * 37 + 7);

  // Size: wide range (post: 2.5–14cqi, banner scaled down)
  const sizePost = 2.5 + r(0) * 11.5;
  const size = isBanner ? sizePost * 0.65 : sizePost;

  // Blur proportional to size: big → 0px, small → 6px
  const sizeRatio = (sizePost - 2.5) / 11.5; // 0 for smallest, 1 for biggest
  const blur = Math.round((1 - sizeRatio) * 6);

  // Opacity: big → 0.7, small → 0.2
  const opacity = +(0.2 + sizeRatio * 0.5).toFixed(2);

  // Position: full spread across canvas, use different seeds
  const horizontal = Math.round(2 + r(1) * 88);
  const vertical = Math.round(2 + r(2) * 88);

  // Rotation: -70 to 70 deg
  const rotation = Math.round(-70 + r(3) * 140);

  // z-index based on blur: less blur = closer to viewer
  const zIndex = blur === 0 ? 50 : blur <= 1 ? 30 : blur <= 2 ? 20 : blur <= 3 ? 10 : 0;

  return {
    fontSize: `${size.toFixed(1)}cqi`,
    left: `${horizontal}%`,
    top: `${vertical}%`,
    transform: `rotate(${rotation}deg)`,
    ...(blur > 0 && { filter: `blur(${blur}px)` }),
    opacity,
    lineHeight: 1,
    zIndex,
  };
}

function getStepSize(value: number): number {
  if (value < 20) return 1;
  if (value < 50) return 5;
  if (value < 100) return 10;
  if (value < 300) return 25;
  if (value < 3000) return 50;
  if (value < 10000) return 100;
  if (value < 50000) return 500;
  if (value < 100000) return 1000;
  if (value < 1000000) return 5000;
  return 10000;
}

export default function MilestoneTemplate({ settings }: MilestoneTemplateProps) {
  // Use the first metric (usually followers) for the milestone
  const primaryMetric = settings.metrics[0];
  const value = primaryMetric?.value || 0;
  const metricLabel = primaryMetric?.type === "custom" && primaryMetric.customLabel ? primaryMetric.customLabel : METRIC_LABELS[primaryMetric?.type || "followers"];

  const step = getStepSize(value);
  const previousMilestone = value - step;
  const nextMilestone = value + step;

  // Extra milestones (further away)
  const farPreviousMilestone = previousMilestone - step;
  const farNextMilestone = nextMilestone + step;

  const abbreviate = settings.abbreviateNumbers !== false;
  const textShadow = "0 1px 2px rgba(0,0,0,0.15)";
  const isBanner = settings.aspectRatio === "banner";

  return (
    <div
      className="relative z-[100] flex flex-col items-center justify-center"
      style={{ color: settings.textColor, textShadow, gap: isBanner ? "0.15cqi" : "0.3cqi" }}
    >

      {/* Far previous milestone */}
      {farPreviousMilestone >= 0 && (
        <p
          className="font-medium opacity-20"
          style={{ fontSize: isBanner ? "2cqi" : "2.5cqi" }}
        >
          {formatMetricValue(primaryMetric?.type || "followers", farPreviousMilestone, abbreviate)}
        </p>
      )}

      {/* Previous milestone */}
      {previousMilestone >= 0 && (
        <p
          className="font-medium opacity-40"
          style={{ fontSize: isBanner ? "3cqi" : "4cqi" }}
        >
          {formatMetricValue(primaryMetric?.type || "followers", previousMilestone, abbreviate)}
        </p>
      )}

      {/* Current milestone - big and bold with label below */}
      <div className="flex flex-col items-center">
        <p
          className="font-bold tracking-tight"
          style={{ fontSize: isBanner ? "9cqi" : "12cqi", lineHeight: "1" }}
        >
          {formatMetricValue(primaryMetric?.type || "followers", value, abbreviate)}
        </p>
        <p
          className="font-semibold opacity-80 flex items-center"
          style={{ fontSize: isBanner ? "2.8cqi" : "3.6cqi", marginTop: isBanner ? "0.4cqi" : "0.5cqi", marginBottom: isBanner ? "0.75cqi" : "1cqi", gap: isBanner ? "0.75cqi" : "1cqi" }}
        >
          {primaryMetric?.type !== "custom" && (
            <HugeiconsIcon
              icon={METRIC_ICONS[primaryMetric?.type || "followers"]}
              style={{ width: isBanner ? "2.8cqi" : "3.6cqi", height: isBanner ? "2.8cqi" : "3.6cqi" }}
              strokeWidth={2}
              color="currentColor"
            />
          )}
          {metricLabel}
        </p>
      </div>

      {/* Next milestone */}
      <p
        className="font-medium opacity-40"
        style={{ fontSize: isBanner ? "3cqi" : "4cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", nextMilestone, abbreviate)}
      </p>

      {/* Far next milestone */}
      <p
        className="font-medium opacity-20"
        style={{ fontSize: isBanner ? "2cqi" : "2.5cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", farNextMilestone, abbreviate)}
      </p>
    </div>
  );
}

// Emoji overlay — rendered at the canvas level in Preview, not inside the text container
// Positions are relative to the full canvas (not the text container)
function getEmojiStyles(emoji: string, isBanner: boolean, count: number): EmojiStyle[] {
  const handCrafted: EmojiStyle[] = [
    {
      // Grand — left side (no blur → z-50)
      fontSize: isBanner ? "10cqi" : "14cqi",
      left: "15%",
      top: "35%",
      transform: `rotate(${emoji === "🎉" || emoji === "🚀" ? "-90deg" : "-15deg"})`,
      opacity: 0.9,
      lineHeight: 1,
      zIndex: 50,
    },
    {
      // Moyen — top right (no blur → z-40)
      fontSize: isBanner ? "6.5cqi" : "9cqi",
      right: "14%",
      top: "8%",
      transform: "rotate(10deg)",
      opacity: 0.7,
      lineHeight: 1,
      zIndex: 40,
    },
    {
      // Petit — bottom right (blur 1 → z-30)
      fontSize: isBanner ? "4cqi" : "5.5cqi",
      right: "22%",
      bottom: "12%",
      transform: "rotate(0deg)",
      filter: "blur(1px)",
      opacity: 0.5,
      lineHeight: 1,
      zIndex: 30,
    },
    {
      // Inter — behind text, center-right (blur 2 → z-20)
      fontSize: isBanner ? "5cqi" : "7cqi",
      right: "38%",
      top: "28%",
      transform: `rotate(${emoji === "🎉" || emoji === "🚀" ? "-30deg" : "-10deg"})`,
      filter: "blur(2px)",
      opacity: 0.3,
      lineHeight: 1,
      zIndex: 20,
    },
    {
      // Très petit — top left (blur 4 → z-0)
      fontSize: isBanner ? "2.5cqi" : "3.5cqi",
      left: "26%",
      top: "14%",
      transform: "rotate(15deg)",
      filter: "blur(4px)",
      opacity: 0.4,
      lineHeight: 1,
      zIndex: 0,
    },
  ];

  const all: EmojiStyle[] = [
    ...handCrafted,
    ...Array.from({ length: 4 }, (_, i) => generateEmojiStyle(i + 5, isBanner)),
    // 10th emoji — hand-crafted, center-right
    {
      fontSize: isBanner ? "3.5cqi" : "5cqi",
      right: "8%",
      top: "45%",
      transform: "rotate(25deg)",
      filter: "blur(1px)",
      opacity: 0.5,
      lineHeight: 1,
      zIndex: 30,
    },
  ];

  return all.slice(0, count);
}

export function MilestoneEmojis({ settings }: { settings: EditorSettings }) {
  const emoji = settings.milestoneEmoji;
  const unified = settings.milestoneEmojiUnified;
  const name = settings.milestoneEmojiName;
  const count = settings.milestoneEmojiCount ?? 3;
  const isBanner = settings.aspectRatio === "banner";

  if (!emoji || count <= 0) return null;

  const styles = getEmojiStyles(emoji, isBanner, count);
  const appleUrl = unified && name
    ? getAppleEmojiHQUrl(name, unified)
    : getAppleEmojiUrlFromNative(emoji);

  return (
    <>
      {styles.map((style, i) => {
        const { fontSize, lineHeight, ...positionStyle } = style;
        return (
          <img
            key={i}
            src={appleUrl}
            alt=""
            className="absolute select-none pointer-events-none"
            style={{ ...positionStyle, width: fontSize, height: fontSize }}
            draggable={false}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}
