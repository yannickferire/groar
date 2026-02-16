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

type MilestoneTemplateProps = {
  settings: EditorSettings;
};

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
  const metricLabel = METRIC_LABELS[primaryMetric?.type || "followers"].toLowerCase();

  const step = getStepSize(value);
  const previousMilestone = value - step;
  const nextMilestone = value + step;

  // Extra milestones (further away)
  const farPreviousMilestone = previousMilestone - step;
  const farNextMilestone = nextMilestone + step;

  const abbreviate = settings.abbreviateNumbers !== false;
  const textShadow = "0 1px 2px rgba(0,0,0,0.15)";

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center"
      style={{ color: settings.textColor, textShadow, gap: "0.3cqi" }}
    >
      {/* Far previous milestone */}
      {farPreviousMilestone >= 0 && (
        <p
          className="font-medium opacity-20"
          style={{ fontSize: "2.5cqi" }}
        >
          {formatMetricValue(primaryMetric?.type || "followers", farPreviousMilestone, abbreviate)}
        </p>
      )}

      {/* Previous milestone */}
      {previousMilestone >= 0 && (
        <p
          className="font-medium opacity-40"
          style={{ fontSize: "4cqi" }}
        >
          {formatMetricValue(primaryMetric?.type || "followers", previousMilestone, abbreviate)}
        </p>
      )}

      {/* Current milestone - big and bold with label below */}
      <div className="flex flex-col items-center">
        <p
          className="font-bold tracking-tight"
          style={{ fontSize: "12cqi", lineHeight: "1" }}
        >
          {formatMetricValue(primaryMetric?.type || "followers", value, abbreviate)}
        </p>
        <p
          className="font-semibold opacity-80 flex items-center"
          style={{ fontSize: "3.6cqi", marginTop: "0.5cqi", marginBottom: "1cqi", gap: "1cqi" }}
        >
          <HugeiconsIcon
            icon={METRIC_ICONS[primaryMetric?.type || "followers"]}
            style={{ width: "3.6cqi", height: "3.6cqi" }}
            strokeWidth={2}
            color="currentColor"
          />
          {metricLabel}
        </p>
      </div>

      {/* Next milestone */}
      <p
        className="font-medium opacity-40"
        style={{ fontSize: "4cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", nextMilestone, abbreviate)}
      </p>

      {/* Far next milestone */}
      <p
        className="font-medium opacity-20"
        style={{ fontSize: "2.5cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", farNextMilestone, abbreviate)}
      </p>
    </div>
  );
}
