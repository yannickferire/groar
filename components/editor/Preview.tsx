"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { EditorSettings, MetricType, METRIC_LABELS, BackgroundPreset } from "../Editor";
import { formatMetricValue } from "@/lib/metrics";
import { getDateLabel } from "@/lib/date";
import { HugeiconsIcon } from "@hugeicons/react";
import { METRIC_ICONS } from "@/lib/metric-icons";
import BackgroundCanvas from "./BackgroundCanvas";
import { FONTS } from "@/lib/fonts";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";
import MilestoneTemplate, { MilestoneEmojis } from "./templates/MilestoneTemplate";
import ProgressTemplate from "./templates/ProgressTemplate";
import AnnouncementTemplate from "./templates/AnnouncementTemplate";

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
        {settings.template === "milestone" && (
          <MilestoneEmojis settings={{ ...settings, abbreviateNumbers: abbreviate }} />
        )}
        <header className="absolute top-[3%] left-0 right-0 px-[3%] flex justify-between items-center z-10">
          <p
            className="opacity-60"
            style={{ color: settings.textColor, textShadow, fontSize: isBanner ? "2.1cqi" : "2.4cqi" }}
          >
            {settings.handle && settings.handle !== "@your_handle" ? settings.handle : ""}
          </p>
          {(() => {
            // Show date label for period-based headings and milestone/progress templates
            const dateLabelStyle = { color: settings.textColor, textShadow, fontSize: isBanner ? "2.1cqi" : "2.4cqi" };
            if (settings.template === "milestone" || settings.template === "progress") {
              return settings.period ? (
                <p className="opacity-60" style={dateLabelStyle}>{new Date().getFullYear()}</p>
              ) : null;
            }
            const h = settings.heading;
            if (!h) return null;
            if (h.type === "period" && h.periodType) {
              return <p className="opacity-60" style={dateLabelStyle}>{getDateLabel(h.periodType)}</p>;
            }
            if (h.type === "last" && h.lastUnit) {
              return <p className="opacity-60" style={dateLabelStyle}>{getDateLabel(h.lastUnit)}</p>;
            }
            return null;
          })()}
        </header>

        {/* Template Content */}
        {settings.template === "milestone" ? (
          <MilestoneTemplate settings={{ ...settings, abbreviateNumbers: abbreviate }} />
        ) : settings.template === "progress" ? (
          <ProgressTemplate settings={{ ...settings, abbreviateNumbers: abbreviate }} />
        ) : settings.template === "announcement" ? (
          /* Announcement Template */
          <div
            className="relative z-10 flex flex-col items-center w-full px-4"
            style={{ color: settings.textColor, textShadow, gap: isBanner ? "1.5cqi" : "2.5cqi" }}
          >
            {(() => {
              const h = settings.heading;
              if (!h) return null;
              const baseFontSize = isBanner ? "6cqi" : "8cqi";
              const textSize = (len: number) =>
                len > 30 ? (isBanner ? "3.5cqi" : "4.5cqi") : len > 20 ? (isBanner ? "4.5cqi" : "6cqi") : baseFontSize;

              if (h.type === "period" && h.periodType) {
                const from = h.periodFrom ?? 1;
                const to = h.periodTo;
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>
                    <span className="capitalize">{h.periodType}</span>{" "}{to !== undefined ? `${from} - ${to}` : from}
                  </p>
                );
              }
              if (h.type === "last" && h.lastUnit) {
                const count = h.lastCount ?? 7;
                const unit = h.lastUnit;
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>
                    Last {count} <span className="capitalize">{unit}{count !== 1 ? "s" : ""}</span>
                  </p>
                );
              }
              if (h.type === "date-range" && h.dateFrom && h.dateTo) {
                const fmt = (iso: string) => {
                  const d = new Date(iso + "T00:00:00");
                  const fullMonth = d.toLocaleDateString("en-US", { month: "long" });
                  const month = fullMonth.length > 5
                    ? d.toLocaleDateString("en-US", { month: "short" })
                    : fullMonth;
                  return `${month} ${d.getDate()}`;
                };
                const fromDate = new Date(h.dateFrom + "T00:00:00");
                const toDate = new Date(h.dateTo + "T00:00:00");
                const sameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
                const label = h.dateFrom === h.dateTo
                  ? fmt(h.dateFrom)
                  : sameMonth
                    ? `${fmt(h.dateFrom)} – ${toDate.getDate()}`
                    : `${fmt(h.dateFrom)} – ${fmt(h.dateTo)}`;
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: textSize(label.length) }}>
                    {label}
                  </p>
                );
              }
              if (h.type === "quote" && h.text) {
                const size = isBanner ? "5cqi" : "6.5cqi";
                return (
                  <p className="font-bold italic tracking-tight text-center text-balance px-[2%]" style={{ fontSize: size, lineHeight: 1.1 }}>
                    &ldquo;{h.text}&rdquo;
                  </p>
                );
              }
              if (h.type === "custom" && h.text) {
                const size = isBanner ? "5cqi" : "6.5cqi";
                return (
                  <p className="font-bold tracking-tight text-center text-balance px-[2%]" style={{ fontSize: size, lineHeight: 1.1 }}>
                    {h.text}
                  </p>
                );
              }
              return null;
            })()}
            <AnnouncementTemplate settings={settings} />
          </div>
        ) : (
          /* Default: Metrics Template */
          <div
            className="relative z-10 flex flex-col items-center w-full px-4"
            style={{ color: settings.textColor, textShadow, gap: isBanner ? "0.3cqi" : "0.5cqi" }}
          >
            {(() => {
              const h = settings.heading;
              if (!h) return null;
              const baseFontSize = isBanner ? "6cqi" : "8cqi";

              // Helper for text-based headings: scale down font for longer text
              const textSize = (len: number) =>
                len > 30 ? (isBanner ? "3.5cqi" : "4.5cqi") : len > 20 ? (isBanner ? "4.5cqi" : "6cqi") : baseFontSize;

              if (h.type === "period" && h.periodType) {
                const from = h.periodFrom ?? 1;
                const to = h.periodTo;
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>
                    <span className="capitalize">{h.periodType}</span>{" "}{to !== undefined ? `${from} - ${to}` : from}
                  </p>
                );
              }
              if (h.type === "last" && h.lastUnit) {
                const count = h.lastCount ?? 7;
                const unit = h.lastUnit;
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>
                    Last {count} <span className="capitalize">{unit}{count !== 1 ? "s" : ""}</span>
                  </p>
                );
              }
              if (h.type === "date-range" && h.dateFrom && h.dateTo) {
                const fmt = (iso: string) => {
                  const d = new Date(iso + "T00:00:00");
                  const fullMonth = d.toLocaleDateString("en-US", { month: "long" });
                  const month = fullMonth.length > 5
                    ? d.toLocaleDateString("en-US", { month: "short" })
                    : fullMonth;
                  return `${month} ${d.getDate()}`;
                };
                const fromDate = new Date(h.dateFrom + "T00:00:00");
                const toDate = new Date(h.dateTo + "T00:00:00");
                const sameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
                const label = h.dateFrom === h.dateTo
                  ? fmt(h.dateFrom)
                  : sameMonth
                    ? `${fmt(h.dateFrom)} – ${toDate.getDate()}`
                    : `${fmt(h.dateFrom)} – ${fmt(h.dateTo)}`;
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: textSize(label.length) }}>
                    {label}
                  </p>
                );
              }
              if (h.type === "quote" && h.text) {
                const size = isBanner ? "5cqi" : "6.5cqi";
                return (
                  <p className="font-bold italic tracking-tight text-center text-balance px-[2%]" style={{ fontSize: size, lineHeight: 1.1 }}>
                    &ldquo;{h.text}&rdquo;
                  </p>
                );
              }
              if (h.type === "custom" && h.text) {
                const size = isBanner ? "5cqi" : "6.5cqi";
                return (
                  <p className="font-bold tracking-tight text-center text-balance px-[2%]" style={{ fontSize: size, lineHeight: 1.1 }}>
                    {h.text}
                  </p>
                );
              }
              return null;
            })()}
            <div className="flex flex-col items-center" style={{ gap: 0 }}>
              {settings.metrics.map((metric, index) => {
                const hasHeading = !!settings.heading;
                const primarySize = hasHeading
                  ? (isBanner ? "4.6cqi" : "5.7cqi")
                  : (isBanner ? "6.8cqi" : "8.6cqi");
                const secondarySize = hasHeading
                  ? (isBanner ? "2.6cqi" : "3.2cqi")
                  : (isBanner ? "3.1cqi" : "3.9cqi");
                const primaryIcon = hasHeading
                  ? (isBanner ? "3.6cqi" : iconSizes.primaryWithPeriod)
                  : (isBanner ? "5.2cqi" : iconSizes.primaryNoPeriod);
                const secondaryIcon = hasHeading
                  ? (isBanner ? "2.6cqi" : iconSizes.secondaryWithPeriod)
                  : (isBanner ? "3.4cqi" : iconSizes.secondaryNoPeriod);
                return (
                  <p
                    key={metric.type}
                    className={index === 0 ? "flex items-center font-semibold" : "opacity-80 flex items-center font-medium"}
                    style={{
                      fontSize: index === 0 ? primarySize : secondarySize,
                      gap: index === 0 ? (isBanner ? "0.6cqi" : "1cqi") : (isBanner ? "0.7cqi" : "1.2cqi"),
                      marginTop: index > 0 ? (isBanner ? "-0.3cqi" : "-0.5cqi") : undefined,
                    }}
                  >
                    <HugeiconsIcon
                      icon={METRIC_ICONS[metric.type]}
                      style={{
                        width: index === 0 ? primaryIcon : secondaryIcon,
                        height: index === 0 ? primaryIcon : secondaryIcon,
                      }}
                      strokeWidth={index === 0 ? 3 : 2}
                      color="currentColor"
                    />
                    {formatMetricValue(metric.type, metric.value, abbreviate, metric.prefix)} {METRIC_LABELS[metric.type]}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Branding Logo */}
        {isPremium && settings.branding?.logoUrl && settings.branding?.enabled !== false && (
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
              width={300}
              height={settings.branding.logoSize ?? 30}
              className="object-contain"
              style={{
                height: `${settings.branding.logoSize ?? 30}px`,
                objectPosition: settings.branding.position === "right" ? "right" : settings.branding.position === "left" ? "left" : "center",
              }}
            />
          </div>
        )}

        {!isPremium && (
          <footer className="absolute z-10 groar-watermark bottom-[3%] right-[3%]">
            <p
              className="whitespace-nowrap flex items-center"
              style={{ textShadow, fontSize: isBanner ? "2.3cqi" : "2.7cqi", gap: "0.3cqi" }}
            >
              <img src="/emoji-tiger.png" alt="Groar" className="mr-1 mt-1" style={{ width: "1.2em", height: "1.2em", opacity: 0.7 }} />
              <span style={{ color: settings.textColor, opacity: 0.5 }}>groar.app</span>
            </p>
          </footer>
        )}
        </div>
      </div>
    </div>
  );
});

export default Preview;
