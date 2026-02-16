"use client";

import { EditorSettings, METRIC_LABELS, MetricType } from "@/components/Editor";
import { formatMetricValue } from "@/lib/metrics";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserLove01Icon, UserAdd01Icon, News01Icon, EyeIcon, Comment01Icon, Activity01Icon, Tap01Icon, UserCircleIcon, FavouriteIcon, RepeatIcon, Bookmark01Icon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";

const METRIC_ICONS: Record<MetricType, IconSvgElement> = {
  followers: UserLove01Icon,
  followings: UserAdd01Icon,
  posts: News01Icon,
  impressions: EyeIcon,
  replies: Comment01Icon,
  engagementRate: Activity01Icon,
  engagement: Tap01Icon,
  profileVisits: UserCircleIcon,
  likes: FavouriteIcon,
  reposts: RepeatIcon,
  bookmarks: Bookmark01Icon,
};

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
  // For larger numbers, round up to next 100k
  return Math.ceil(value / 100000) * 100000 + 100000;
}

// Get progress color based on percentage (red -> yellow -> green)
function getProgressColor(percent: number): string {
  // Clamp between 0 and 100
  const p = Math.max(0, Math.min(100, percent));

  // Colors: Red (0%) -> Yellow (50%) -> Green (100%)
  const red = { r: 239, g: 68, b: 68 };     // #ef4444
  const yellow = { r: 234, g: 179, b: 8 };  // #eab308
  const green = { r: 34, g: 197, b: 94 };   // #22c55e

  let r, g, b;

  if (p <= 50) {
    // Interpolate red -> yellow
    const t = p / 50;
    r = Math.round(red.r + (yellow.r - red.r) * t);
    g = Math.round(red.g + (yellow.g - red.g) * t);
    b = Math.round(red.b + (yellow.b - red.b) * t);
  } else {
    // Interpolate yellow -> green
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
  // Use custom goal if set, otherwise auto-calculate
  const goal = settings.goal && settings.goal > 0 ? settings.goal : getNextGoal(currentValue);
  const progress = Math.min((currentValue / goal) * 100, 100);

  // Single color based on progress percentage
  const progressColor = getProgressColor(progress);

  const textShadow = "0 1px 2px rgba(0,0,0,0.15)";

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center"
      style={{ color: settings.textColor, textShadow, gap: "2cqi", width: "70%" }}
    >
      {/* Goal label */}
      <p
        className="uppercase tracking-widest opacity-60"
        style={{ fontSize: "2cqi" }}
      >
        Goal: {formatMetricValue(primaryMetric?.type || "followers", goal, settings.abbreviateNumbers !== false)} {METRIC_LABELS[primaryMetric?.type || "followers"].toLowerCase()}
      </p>

      {/* Current value - big */}
      <p
        className="font-bold tracking-tight flex items-center"
        style={{ fontSize: "12cqi", gap: "2cqi" }}
      >
        <HugeiconsIcon
          icon={METRIC_ICONS[primaryMetric?.type || "followers"]}
          style={{ width: "10cqi", height: "10cqi" }}
          strokeWidth={1.5}
          color="currentColor"
        />
        {formatMetricValue(primaryMetric?.type || "followers", currentValue, settings.abbreviateNumbers !== false)}
      </p>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: "3.5cqi",
          backgroundColor: "rgba(255,255,255,0.2)",
        }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: progressColor,
            boxShadow: `0 2px 8px ${progressColor.replace('rgb', 'rgba').replace(')', ', 0.5)')}`,
          }}
        />
      </div>

      {/* Percentage */}
      <p
        className="font-semibold"
        style={{ fontSize: "3cqi" }}
      >
        {Math.round(progress)}% complete
      </p>
    </div>
  );
}
