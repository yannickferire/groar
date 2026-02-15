"use client";

import { EditorSettings, METRIC_LABELS } from "@/components/Editor";
import { formatMetricValue } from "@/lib/metrics";

type MilestoneTemplateProps = {
  settings: EditorSettings;
};

// Calculate step size based on the milestone value
function getStepSize(value: number): number {
  if (value < 100) return 5;
  if (value < 1000) return 10;
  if (value < 10000) return 100;
  return 1000;
}

// Round to nearest milestone
function roundToMilestone(value: number): number {
  const step = getStepSize(value);
  return Math.round(value / step) * step;
}

// Get previous milestone
function getPreviousMilestone(value: number): number {
  const step = getStepSize(value);
  const rounded = roundToMilestone(value);
  return rounded <= value ? rounded - step : rounded - step;
}

// Get next milestone
function getNextMilestone(value: number): number {
  const step = getStepSize(value);
  const rounded = roundToMilestone(value);
  return rounded >= value ? rounded + step : rounded + step;
}

export default function MilestoneTemplate({ settings }: MilestoneTemplateProps) {
  // Use the first metric (usually followers) for the milestone
  const primaryMetric = settings.metrics[0];
  const value = primaryMetric?.value || 0;
  const metricLabel = METRIC_LABELS[primaryMetric?.type || "followers"].toLowerCase();

  const currentMilestone = roundToMilestone(value);
  const previousMilestone = getPreviousMilestone(value);
  const nextMilestone = getNextMilestone(value);

  // Extra milestones (further away)
  const step = getStepSize(value);
  const farPreviousMilestone = previousMilestone - step;
  const farNextMilestone = nextMilestone + step;

  const textShadow = "0 1px 2px rgba(0,0,0,0.15)";

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center"
      style={{ color: settings.textColor, textShadow, gap: "0.3cqi" }}
    >
      {/* Far previous milestone */}
      <p
        className="font-medium opacity-20"
        style={{ fontSize: "2.5cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", farPreviousMilestone)}
      </p>

      {/* Previous milestone */}
      <p
        className="font-medium opacity-40"
        style={{ fontSize: "4cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", previousMilestone)}
      </p>

      {/* Current milestone - big and bold with label below */}
      <div className="flex flex-col items-center">
        <p
          className="font-bold tracking-tight"
          style={{ fontSize: "12cqi", lineHeight: "1" }}
        >
          {formatMetricValue(primaryMetric?.type || "followers", currentMilestone)}
        </p>
        <p
          className="font-semibold opacity-80"
          style={{ fontSize: "3cqi", marginTop: "-0.5cqi", marginBottom: "1cqi" }}
        >
          {metricLabel}
        </p>
      </div>

      {/* Next milestone */}
      <p
        className="font-medium opacity-40"
        style={{ fontSize: "4cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", nextMilestone)}
      </p>

      {/* Far next milestone */}
      <p
        className="font-medium opacity-20"
        style={{ fontSize: "2.5cqi" }}
      >
        {formatMetricValue(primaryMetric?.type || "followers", farNextMilestone)}
      </p>
    </div>
  );
}
