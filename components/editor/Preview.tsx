"use client";

import { EditorSettings, PeriodType, MetricType, METRIC_LABELS } from "../Editor";
import { formatMetricValue } from "@/lib/metrics";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, EyeIcon, Comment01Icon, Activity01Icon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";

const METRIC_ICONS: Record<MetricType, IconSvgElement> = {
  followers: UserAdd01Icon,
  impressions: EyeIcon,
  replies: Comment01Icon,
  engagementRate: Activity01Icon,
};

type PreviewProps = {
  settings: EditorSettings;
};

const getDateLabel = (periodType: PeriodType): string => {
  const now = new Date();
  const year = now.getFullYear();

  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeapYear ? 366 : 365;

  switch (periodType) {
    case "day":
      return `${dayOfYear.toString().padStart(2, "0")}/${totalDays} – ${year}`;
    case "week":
      const weekNumber = Math.ceil(dayOfYear / 7);
      return `${weekNumber.toString().padStart(2, "0")}/52 – ${year}`;
    case "month":
      const month = now.getMonth() + 1;
      return `${month.toString().padStart(2, "0")}/12 – ${year}`;
    case "year":
      return `${year}`;
  }
};

export default function Preview({ settings }: PreviewProps) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <div
        className="relative aspect-square rounded-xl overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: settings.backgroundColor }}
      >
        <header className="absolute top-[3%] left-0 right-0 px-[3%] flex justify-between items-center">
          <p
            className="text-xs opacity-60"
            style={{ color: settings.textColor }}
          >
            {settings.handle}
          </p>
          <p
            className="text-xs opacity-60"
            style={{ color: settings.textColor }}
          >
            {getDateLabel(settings.periodType)}
          </p>
        </header>

        <div
          className="flex flex-col items-center gap-2"
          style={{ color: settings.textColor }}
        >
          <p className="text-6xl font-bold tracking-tight">
            <span className="font-heading">{settings.periodType}</span> {settings.periodNumber}
          </p>
          <div className="flex flex-col items-center gap-2">
            {settings.metrics.map((metric, index) => (
              <p
                key={metric.type}
                className={index === 0 ? "text-3xl flex items-center gap-3 font-semibold" : "text-lg opacity-80 flex items-center gap-3.5 font-medium"}
              >
                <HugeiconsIcon
                  icon={METRIC_ICONS[metric.type]}
                  size={index === 0 ? 32 : 24}
                  color="currentColor"
                />
                {formatMetricValue(metric.type, metric.value)} {METRIC_LABELS[metric.type].toLowerCase()}
              </p>
            ))}
          </div>
        </div>

        <footer className="absolute bottom-[3%]">
          <p
            className="text-xs opacity-60"
            style={{ color: settings.textColor }}
          >
            made with 🐯 gro.ar
          </p>
        </footer>
      </div>
    </div>
  );
}
