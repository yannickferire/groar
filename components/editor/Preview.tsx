"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { EditorSettings, MetricType, METRIC_LABELS, BackgroundPreset } from "../Editor";
import { formatMetricValue } from "@/lib/metrics";
import { getDateLabel } from "@/lib/date";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserLove01Icon, UserAdd01Icon, News01Icon, EyeIcon, Comment01Icon, Activity01Icon, Tap01Icon, UserCircleIcon, FavouriteIcon, RepeatIcon, Bookmark01Icon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import BackgroundCanvas from "./BackgroundCanvas";
import { FONTS } from "@/lib/fonts";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";
import MilestoneTemplate from "./templates/MilestoneTemplate";
import ProgressTemplate from "./templates/ProgressTemplate";

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

type PreviewProps = {
  settings: EditorSettings;
  backgrounds: BackgroundPreset[];
  isPremium?: boolean;
};

const textShadow = "0 1px 2px rgba(0,0,0,0.15)";

const Preview = forwardRef<HTMLDivElement, PreviewProps>(function Preview({ settings, backgrounds, isPremium = false }, ref) {
  // Icon sizes as percentage of container width (based on 1200px reference)
  const iconSizes = {
    primaryWithPeriod: "4.5cqi",   // ~54px at 1200px
    primaryNoPeriod: "6.5cqi",     // ~78px at 1200px
    secondaryWithPeriod: "3.2cqi", // ~38px at 1200px
    secondaryNoPeriod: "4.2cqi",   // ~50px at 1200px
  };

  // Force abbreviation if any metric exceeds 999M
  const forceAbbreviate = settings.metrics.some(m => m.value > 999_999_999);
  const abbreviate = forceAbbreviate || settings.abbreviateNumbers !== false;

  // Get the selected font family CSS variable
  const selectedFont = settings.font || "bricolage";
  const fontVariable = FONTS[selectedFont]?.variable || "--font-bricolage";

  // Get the selected aspect ratio
  const selectedAspectRatio = settings.aspectRatio || "post";
  const aspectRatioValue = ASPECT_RATIOS[selectedAspectRatio]?.ratio || "16/9";

  return (
    <div className="flex flex-col">
      {/* Wrapper with rounded corners for display only */}
      <div className="rounded-3xl overflow-hidden">
        {/* Export target - no rounded corners, uses container queries */}
        <div
          ref={ref}
          className="relative flex items-center justify-center @container"
          style={{ fontFamily: `var(${fontVariable})`, aspectRatio: aspectRatioValue }}
        >
        <BackgroundCanvas
          settings={settings.background}
          backgrounds={backgrounds}
          className="absolute inset-0"
        />
        <header className="absolute top-[3%] left-0 right-0 px-[3%] flex justify-between items-center z-10">
          <p
            className="opacity-60"
            style={{ color: settings.textColor, textShadow, fontSize: "1.6cqi" }}
          >
            {settings.handle}
          </p>
          {settings.period && (
            <p
              className="opacity-60"
              style={{ color: settings.textColor, textShadow, fontSize: "1.6cqi" }}
            >
              {settings.template === "milestone" || settings.template === "progress"
                ? new Date().getFullYear()
                : getDateLabel(settings.period.type)}
            </p>
          )}
        </header>

        {/* Template Content */}
        {settings.template === "milestone" ? (
          <MilestoneTemplate settings={{ ...settings, abbreviateNumbers: abbreviate }} />
        ) : settings.template === "progress" ? (
          <ProgressTemplate settings={{ ...settings, abbreviateNumbers: abbreviate }} />
        ) : (
          /* Default: Metrics Template */
          <div
            className="relative z-10 flex flex-col items-center"
            style={{ color: settings.textColor, textShadow, gap: "0.5cqi" }}
          >
            {settings.period && (
              <p className="font-bold tracking-tight" style={{ fontSize: "8cqi" }}>
                <span className="capitalize">{settings.period.type}</span> {settings.period.number}
              </p>
            )}
            <div className="flex flex-col items-center" style={{ gap: "0.5cqi" }}>
              {settings.metrics.map((metric, index) => (
                <p
                  key={metric.type}
                  className={index === 0 ? "flex items-center font-semibold" : "opacity-80 flex items-center font-medium"}
                  style={{
                    fontSize: index === 0
                      ? (settings.period ? "4cqi" : "6cqi")
                      : (settings.period ? "2.5cqi" : "3cqi"),
                    gap: index === 0 ? "1cqi" : "1.2cqi",
                  }}
                >
                  <HugeiconsIcon
                    icon={METRIC_ICONS[metric.type]}
                    style={{
                      width: index === 0
                        ? (settings.period ? iconSizes.primaryWithPeriod : iconSizes.primaryNoPeriod)
                        : (settings.period ? iconSizes.secondaryWithPeriod : iconSizes.secondaryNoPeriod),
                      height: index === 0
                        ? (settings.period ? iconSizes.primaryWithPeriod : iconSizes.primaryNoPeriod)
                        : (settings.period ? iconSizes.secondaryWithPeriod : iconSizes.secondaryNoPeriod),
                    }}
                    strokeWidth={2}
                    color="currentColor"
                  />
                  {formatMetricValue(metric.type, metric.value, abbreviate)} {METRIC_LABELS[metric.type].toLowerCase()}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Branding Logo */}
        {isPremium && settings.branding?.logoUrl && (
          <div
            className="absolute z-10"
            style={{
              bottom: "3%",
              left: settings.branding.position === "left" ? "3%" : settings.branding.position === "center" ? "50%" : "auto",
              right: settings.branding.position === "right" ? "3%" : "auto",
              transform: settings.branding.position === "center" ? "translateX(-50%)" : "none",
            }}
          >
            <Image
              src={settings.branding.logoUrl}
              alt="Branding"
              width={200}
              height={80}
              className="object-contain"
              style={{
                maxWidth: "12cqi",
                maxHeight: "5cqi",
                minHeight: "2.5cqi",
              }}
            />
          </div>
        )}

        {!isPremium && (
          <footer className="absolute bottom-[3%] z-10 groar-watermark">
            <p
              className="whitespace-nowrap"
              style={{ color: settings.textColor, textShadow, fontSize: "2cqi" }}
            >
              <span className="opacity-60">made with</span> 🐯 <span className="opacity-60">groar</span>
            </p>
          </footer>
        )}
        </div>
      </div>
    </div>
  );
});

export default Preview;
