"use client";

import { EditorSettings, METRIC_LABELS, MetricType } from "@/components/Editor";
import { formatMetricValue } from "@/lib/metrics";
import { HugeiconsIcon } from "@hugeicons/react";
import { METRIC_ICONS } from "@/lib/metric-icons";

type ProgressTemplateProps = {
  settings: EditorSettings;
};

// Calculate the next goal based on current value
function getNextGoal(value: number): number {
  if (value < 100) return 100;
  if (value < 500) return 500;
  if (value < 1000) return 1000;
  if (value < 5000) return 5000;
  if (value < 10000) return 10000;
  if (value < 50000) return 50000;
  if (value < 100000) return 100000;
  return Math.ceil(value / 100000) * 100000 + 100000;
}

// Get progress color based on percentage (red -> yellow -> green)
function getProgressColor(percent: number): string {
  const p = Math.max(0, Math.min(100, percent));
  const red = { r: 239, g: 68, b: 68 };
  const yellow = { r: 234, g: 179, b: 8 };
  const green = { r: 34, g: 197, b: 94 };

  let r, g, b;
  if (p <= 50) {
    const t = p / 50;
    r = Math.round(red.r + (yellow.r - red.r) * t);
    g = Math.round(red.g + (yellow.g - red.g) * t);
    b = Math.round(red.b + (yellow.b - red.b) * t);
  } else {
    const t = (p - 50) / 50;
    r = Math.round(yellow.r + (green.r - yellow.r) * t);
    g = Math.round(yellow.g + (green.g - yellow.g) * t);
    b = Math.round(yellow.b + (green.b - yellow.b) * t);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export default function ProgressTemplate({ settings }: ProgressTemplateProps) {
  const primaryMetric = settings.metrics[0];
  const currentValue = primaryMetric?.value || 0;
  const goal = settings.goal && settings.goal > 0 ? settings.goal : getNextGoal(currentValue);
  const progress = Math.min((currentValue / goal) * 100, 100);
  const display = settings.progressDisplay || "bar";

  const isAutoColor = settings.progressBarAuto !== false;
  const autoColor = getProgressColor(progress);
  const customColor = settings.progressBarColor || autoColor;
  const barColor = isAutoColor ? autoColor : customColor;
  const barColorLight = isAutoColor
    ? getProgressColor(Math.min(progress + 15, 100))
    : `${customColor}cc`;
  const haloColor = barColor;

  const textShadow = "0 1px 2px rgba(0,0,0,0.15)";
  const isBanner = settings.aspectRatio === "banner";

  const metricType = primaryMetric?.type || "followers";
  const metricLabel = primaryMetric?.type === "custom" && primaryMetric.customLabel
    ? primaryMetric.customLabel
    : METRIC_LABELS[metricType];
  const abbreviate = settings.abbreviateNumbers !== false;

  // ── Dots display: 4 rows of 25 ──
  const renderDots = () => {
    const filled = Math.round(progress);
    const dotSize = isBanner ? "0.9cqi" : "1.1cqi";
    const gapX = isBanner ? "1cqi" : "1.3cqi";
    const gapY = isBanner ? "0.5cqi" : "0.6cqi";
    return (
      <div className="w-full flex flex-col items-center" style={{ gap: gapY }}>
        {[0, 25, 50, 75].map((rowStart) => (
          <div key={rowStart} className="flex justify-center" style={{ gap: gapX }}>
            {Array.from({ length: 25 }, (_, j) => {
              const dotIdx = rowStart + j;
              return (
                <div
                  key={dotIdx}
                  className="rounded-full"
                  style={{
                    width: dotSize,
                    height: dotSize,
                    backgroundColor: dotIdx < filled ? settings.textColor : `${settings.textColor}30`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ── Block display: 10 blocks with color states ──
  const getBlockColor = (index: number): string => {
    const blockProgress = progress / 10; // progress per block (0-10)
    const blockFill = blockProgress - index; // how much this block is filled

    if (blockFill >= 1) return "#22c55e"; // green - fully complete
    if (blockFill >= 0.5) return "#eab308"; // yellow - more than half
    if (blockFill > 0) return "#f97316"; // orange - started
    return `${settings.textColor}20`; // empty
  };

  const renderSquare = () => (
    <div
      className="w-full flex justify-center"
      style={{ gap: isBanner ? "0.8cqi" : "1.1cqi" }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            width: isBanner ? "3.5cqi" : "4.5cqi",
            height: isBanner ? "3.5cqi" : "4.5cqi",
            borderRadius: isBanner ? "0.5cqi" : "0.6cqi",
            backgroundColor: getBlockColor(i),
          }}
        />
      ))}
    </div>
  );

  // ── Bar display ──
  const renderBar = () => (
    <div
      className="w-full rounded-full overflow-hidden relative"
      style={{
        height: isBanner ? "2.8cqi" : "3.5cqi",
        backgroundColor: "rgba(255,255,255,0.2)",
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          width: `${progress}%`,
          background: haloColor,
          opacity: 0.5,
          filter: "blur(5px)",
        }}
      />
      <div
        className="h-full rounded-full transition-all relative"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${barColor}, ${barColorLight})`,
          boxShadow: `0 2px 12px ${barColor}80`,
        }}
      />
    </div>
  );

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center"
      style={{ color: settings.textColor, textShadow, gap: isBanner ? "0.8cqi" : "1.2cqi", width: "70%" }}
    >
      {/* Metric label */}
      <div
        className="flex items-center justify-center opacity-60"
        style={{ gap: isBanner ? "0.5cqi" : "0.7cqi", fontSize: isBanner ? "2.5cqi" : "3cqi", marginBottom: isBanner ? "-0.4cqi" : "-0.6cqi" }}
      >
        {primaryMetric?.type !== "custom" && (
          <HugeiconsIcon
            icon={METRIC_ICONS[metricType]}
            style={{ width: isBanner ? "2.5cqi" : "3cqi", height: isBanner ? "2.5cqi" : "3cqi" }}
            strokeWidth={2}
            color="currentColor"
          />
        )}
        <span className="font-medium">{metricLabel} Goal</span>
      </div>

      {/* Value: current / goal */}
      <p className="flex items-baseline justify-center" style={{ gap: isBanner ? "0.5cqi" : "0.8cqi" }}>
        <span className="font-bold tracking-tight" style={{ fontSize: isBanner ? "8cqi" : "10.5cqi" }}>
          {formatMetricValue(metricType, currentValue, abbreviate)}
        </span>
        <span className="opacity-50 font-semibold" style={{ fontSize: isBanner ? "3.5cqi" : "4.2cqi" }}>
          / {formatMetricValue(metricType, goal, abbreviate)}
        </span>
      </p>

      {/* Progress visualization */}
      {display === "bar" && renderBar()}
      {display === "dots" && renderDots()}
      {display === "square" && renderSquare()}

      {/* Percentage */}
      <p
        className="font-semibold"
        style={{ fontSize: isBanner ? "2.4cqi" : "3cqi" }}
      >
        {Number.isInteger(progress) ? progress : progress.toFixed(2)}% complete
      </p>
    </div>
  );
}
