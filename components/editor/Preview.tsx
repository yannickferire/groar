"use client";

import { forwardRef } from "react";
import { EditorSettings, MetricType, METRIC_LABELS, BackgroundPreset } from "../Editor";
import { formatMetricValue } from "@/lib/metrics";
import { getDateLabel } from "@/lib/date";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, EyeIcon, Comment01Icon, Activity01Icon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import BackgroundCanvas from "./BackgroundCanvas";

const METRIC_ICONS: Record<MetricType, IconSvgElement> = {
  followers: UserAdd01Icon,
  impressions: EyeIcon,
  replies: Comment01Icon,
  engagementRate: Activity01Icon,
};

type PreviewProps = {
  settings: EditorSettings;
  backgrounds: BackgroundPreset[];
};

const textShadow = "0 1px 2px rgba(0,0,0,0.15)";

const Preview = forwardRef<HTMLDivElement, PreviewProps>(function Preview({ settings, backgrounds }, ref) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <div
        ref={ref}
        className="relative aspect-square rounded-xl overflow-hidden flex items-center justify-center"
      >
        <BackgroundCanvas
          settings={settings.background}
          backgrounds={backgrounds}
          className="absolute inset-0"
        />
        <header className="absolute top-[3%] left-0 right-0 px-[3%] flex justify-between items-center z-10">
          <p
            className="text-xs opacity-60"
            style={{ color: settings.textColor, textShadow }}
          >
            {settings.handle}
          </p>
          {settings.period && (
            <p
              className="text-xs opacity-60"
              style={{ color: settings.textColor, textShadow }}
            >
              {getDateLabel(settings.period.type)}
            </p>
          )}
        </header>

        <div
          className="relative z-10 flex flex-col items-center gap-2"
          style={{ color: settings.textColor, textShadow }}
        >
          {settings.period && (
            <p className="text-6xl font-bold tracking-tight">
              <span className="font-heading capitalize">{settings.period.type}</span> {settings.period.number}
            </p>
          )}
          <div className="flex flex-col items-center gap-2">
            {settings.metrics.map((metric, index) => (
              <p
                key={metric.type}
                className={index === 0
                  ? `flex items-center gap-3 font-semibold ${settings.period ? "text-3xl" : "text-5xl"}`
                  : `opacity-80 flex items-center gap-3.5 font-medium ${settings.period ? "text-lg" : "text-2xl"}`
                }
              >
                <HugeiconsIcon
                  icon={METRIC_ICONS[metric.type]}
                  size={index === 0 ? (settings.period ? 36 : 52) : (settings.period ? 26 : 36)}
                  strokeWidth={2}
                  color="currentColor"
                />
                {formatMetricValue(metric.type, metric.value)} {METRIC_LABELS[metric.type].toLowerCase()}
              </p>
            ))}
          </div>
        </div>

        <footer className="absolute bottom-[3%] z-10">
          <p
            className="text-xs whitespace-nowrap"
            style={{ color: settings.textColor, textShadow }}
          >
            <span className="opacity-60">made with</span> 🐯 <span className="opacity-60">gro.ar</span>
          </p>
        </footer>
      </div>
    </div>
  );
});

export default Preview;
