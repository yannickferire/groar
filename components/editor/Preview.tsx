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
  const isBanner = selectedAspectRatio === "banner";

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
            style={{ color: settings.textColor, textShadow, fontSize: isBanner ? "1.4cqi" : "1.6cqi" }}
          >
            {settings.handle}
          </p>
          {settings.period && (
            <p
              className="opacity-60"
              style={{ color: settings.textColor, textShadow, fontSize: isBanner ? "1.4cqi" : "1.6cqi" }}
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
            style={{ color: settings.textColor, textShadow, gap: isBanner ? "0.3cqi" : "0.5cqi" }}
          >
            {settings.period && (
              <p className="font-bold tracking-tight" style={{ fontSize: isBanner ? "6cqi" : "8cqi" }}>
                <span className="capitalize">{settings.period.type}</span> {settings.period.number}
              </p>
            )}
            <div className="flex flex-col items-center" style={{ gap: isBanner ? "0.3cqi" : "0.5cqi" }}>
              {settings.metrics.map((metric, index) => {
                const primarySize = settings.period
                  ? (isBanner ? "3.2cqi" : "4cqi")
                  : (isBanner ? "4.8cqi" : "6cqi");
                const secondarySize = settings.period
                  ? (isBanner ? "2cqi" : "2.5cqi")
                  : (isBanner ? "2.4cqi" : "3cqi");
                const primaryIcon = settings.period
                  ? (isBanner ? "3.6cqi" : iconSizes.primaryWithPeriod)
                  : (isBanner ? "5.2cqi" : iconSizes.primaryNoPeriod);
                const secondaryIcon = settings.period
                  ? (isBanner ? "2.6cqi" : iconSizes.secondaryWithPeriod)
                  : (isBanner ? "3.4cqi" : iconSizes.secondaryNoPeriod);
                return (
                  <p
                    key={metric.type}
                    className={index === 0 ? "flex items-center font-semibold" : "opacity-80 flex items-center font-medium"}
                    style={{
                      fontSize: index === 0 ? primarySize : secondarySize,
                      gap: index === 0 ? (isBanner ? "0.6cqi" : "1cqi") : (isBanner ? "0.7cqi" : "1.2cqi"),
                    }}
                  >
                    <HugeiconsIcon
                      icon={METRIC_ICONS[metric.type]}
                      style={{
                        width: index === 0 ? primaryIcon : secondaryIcon,
                        height: index === 0 ? primaryIcon : secondaryIcon,
                      }}
                      strokeWidth={2}
                      color="currentColor"
                    />
                    {formatMetricValue(metric.type, metric.value, abbreviate, metric.prefix)} {METRIC_LABELS[metric.type].toLowerCase()}
                  </p>
                );
              })}
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
                maxWidth: isBanner ? "10cqi" : "12cqi",
                maxHeight: isBanner ? "4cqi" : "5cqi",
                minHeight: isBanner ? "2cqi" : "2.5cqi",
              }}
            />
          </div>
        )}

        {!isPremium && (
          <footer className={`absolute z-10 groar-watermark ${isBanner ? "bottom-[6%] right-[3%]" : "bottom-[3%]"}`}>
            <p
              className="whitespace-nowrap"
              style={{ color: settings.textColor, textShadow, fontSize: isBanner ? "1.7cqi" : "2cqi" }}
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
