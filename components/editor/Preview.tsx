"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { EditorSettings, MetricType, METRIC_LABELS, BackgroundPreset } from "../Editor";
import { formatMetricValue } from "@/lib/metrics";
import { getDateLabel } from "@/lib/date";
import { HugeiconsIcon } from "@hugeicons/react";
import { TradeUpIcon, TradeDownIcon } from "@hugeicons/core-free-icons";
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
  /** Override the default rounded-3xl wrapper. Use "none" for thumbnails. */
  rounded?: "none" | "lg" | "3xl";
};

const textShadow = "0 1px 2px rgba(0,0,0,0.15)";

const ROUNDED_CLASSES = { none: "", lg: "rounded-lg", "3xl": "rounded-3xl" } as const;

const Preview = forwardRef<HTMLDivElement, PreviewProps>(function Preview({ settings, backgrounds, isPremium = false, rounded = "3xl" }, ref) {
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
  const isSquare = selectedAspectRatio === "square";
  // Square format has more vertical space — scale up text ~15%
  const sq = (base: number) => isSquare ? base * 1.15 : base;
  const align = settings.metricsLayout === "grid" ? "center" : (settings.textAlign || "center");

  return (
    <div className="flex flex-col">
      {/* Wrapper with rounded corners for display only */}
      <div className={`${ROUNDED_CLASSES[rounded]} overflow-hidden`}>
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
            style={{ color: settings.textColor, textShadow, fontSize: isBanner ? "2.1cqi" : `${sq(2.4)}cqi` }}
          >
            {settings.handle && settings.handle !== "@your_handle" ? settings.handle : ""}
          </p>
          {(() => {
            // Show date label for period-based headings and milestone/progress templates
            const dateLabelStyle = { color: settings.textColor, textShadow, fontSize: isBanner ? "2.1cqi" : `${sq(2.4)}cqi` };
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
              return <p className="opacity-60" style={dateLabelStyle}>{getDateLabel(h.lastUnit === "hour" ? "day" : h.lastUnit)}</p>;
            }
            if (h.type === "today" || h.type === "yesterday") {
              return <p className="opacity-60" style={dateLabelStyle}>{getDateLabel("day")}</p>;
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
                  <p className="font-bold tracking-tight whitespace-nowrap" style={{ fontSize: baseFontSize }}>
                    <span className="capitalize">{h.periodType}</span>{"\u00A0"}{to !== undefined ? `${from}\u00A0-\u00A0${to}` : from}
                  </p>
                );
              }
              if (h.type === "last" && h.lastUnit) {
                const count = h.lastCount ?? 1;
                const unit = h.lastUnit;
                return (
                  <p className="font-bold tracking-tight whitespace-nowrap" style={{ fontSize: baseFontSize }}>
                    Last{"\u00A0"}{count > 1 ? `${count}\u00A0` : ""}{unit}{count !== 1 ? "s" : ""}
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
              if (h.type === "today") {
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>Today</p>
                );
              }
              if (h.type === "yesterday") {
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>Yesterday</p>
                );
              }
              if (h.type === "quote" && h.text) {
                return (
                  <p className="font-bold italic tracking-tight text-center text-balance px-[2%]" style={{ fontSize: baseFontSize }}>
                    &ldquo;{h.text}&rdquo;
                  </p>
                );
              }
              if (h.type === "custom" && h.text) {
                return (
                  <p className="font-bold tracking-tight text-center text-balance px-[2%]" style={{ fontSize: baseFontSize }}>
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
            className={`relative z-10 flex flex-col w-full ${align === "left" ? "items-start px-[8%]" : "items-center px-4"}`}
            style={{ color: settings.textColor, textShadow, gap: isBanner ? "0.3cqi" : "0.5cqi" }}
          >
            {(() => {
              const h = settings.heading;
              if (!h) return null;
              const baseFontSize = isBanner ? "6cqi" : `${sq(8)}cqi`;

              // Helper for text-based headings: scale down font for longer text
              const textSize = (len: number) =>
                len > 30 ? (isBanner ? "3.5cqi" : `${sq(4.5)}cqi`) : len > 20 ? (isBanner ? "4.5cqi" : `${sq(6)}cqi`) : baseFontSize;

              if (h.type === "period" && h.periodType) {
                const from = h.periodFrom ?? 1;
                const to = h.periodTo;
                return (
                  <p className="font-bold tracking-tight whitespace-nowrap" style={{ fontSize: baseFontSize }}>
                    <span className="capitalize">{h.periodType}</span>{"\u00A0"}{to !== undefined ? `${from}\u00A0-\u00A0${to}` : from}
                  </p>
                );
              }
              if (h.type === "last" && h.lastUnit) {
                const count = h.lastCount ?? 1;
                const unit = h.lastUnit;
                return (
                  <p className="font-bold tracking-tight whitespace-nowrap" style={{ fontSize: baseFontSize }}>
                    Last{"\u00A0"}{count > 1 ? `${count}\u00A0` : ""}{unit}{count !== 1 ? "s" : ""}
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
              if (h.type === "today") {
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>Today</p>
                );
              }
              if (h.type === "yesterday") {
                return (
                  <p className="font-bold tracking-tight" style={{ fontSize: baseFontSize }}>Yesterday</p>
                );
              }
              if (h.type === "quote" && h.text) {
                return (
                  <p className="font-bold italic tracking-tight text-center text-balance px-[2%]" style={{ fontSize: baseFontSize, marginBottom: isBanner ? "1.5cqi" : "2cqi" }}>
                    &ldquo;{h.text}&rdquo;
                  </p>
                );
              }
              if (h.type === "custom" && h.text) {
                return (
                  <p className="font-bold tracking-tight text-center text-balance px-[2%]" style={{ fontSize: baseFontSize, marginBottom: isBanner ? "1.5cqi" : "2cqi" }}>
                    {h.text}
                  </p>
                );
              }
              if (h.type === "logo" && settings.branding?.logoUrl && settings.branding?.enabled !== false) {
                return (
                  <div style={{ marginBottom: isBanner ? "1cqi" : "1.5cqi" }}>
                    <Image
                      src={settings.branding.logoUrl}
                      alt="Logo"
                      width={300}
                      height={settings.branding.logoSize ?? 30}
                      className="object-contain w-auto"
                      style={{
                        height: `${((settings.branding.logoSize ?? 30) / 6) * 1.8}cqi`,
                        maxHeight: isBanner ? "8cqi" : "12cqi",
                      }}
                    />
                  </div>
                );
              }
              return null;
            })()}
            {settings.metricsLayout === "grid" && settings.metrics.length >= 2 ? (
              /* Columns layout: metrics side by side with separators, max 3, first metric centered & 20% bigger */
              (() => {
                const columnsMetrics = settings.metrics.slice(0, 3);
                // Reorder: for 3 metrics, put first (main) in the middle → [1, 0, 2]
                const ordered = columnsMetrics.length === 3
                  ? [columnsMetrics[1], columnsMetrics[0], columnsMetrics[2]]
                  : columnsMetrics; // 2 metrics: keep as-is (first on left)
                const mainIndex = columnsMetrics.length === 3 ? 1 : 0; // position of main metric in ordered array
                return (
                  <div
                    className="flex items-center justify-center w-full"
                    style={{ gap: isBanner ? "1cqi" : "1.5cqi", paddingLeft: "3%", paddingRight: "3%" }}
                  >
                    {ordered.map((metric, index) => {
                      const isMain = index === mainIndex;
                      const hasHeading = !!settings.heading;
                      const count = columnsMetrics.length;
                      const baseValue = hasHeading
                        ? (isBanner ? 5 / Math.max(count * 0.3, 1) : sq(7) / Math.max(count * 0.3, 1))
                        : (isBanner ? 6.5 / Math.max(count * 0.3, 1) : sq(8.5) / Math.max(count * 0.3, 1));
                      const valueSize = `${isMain ? baseValue * 1.2 : baseValue}cqi`;
                      const baseLabel = hasHeading
                        ? (isBanner ? 1.8 : sq(2.3))
                        : (isBanner ? 2.1 : sq(2.7));
                      const labelSize = `${isMain ? baseLabel * 1.2 : baseLabel}cqi`;
                      const iconSize = labelSize;
                      const columnFlex = isMain && columnsMetrics.length === 3 ? 1.3 : 1;
                      return (
                        <div key={metric.id} className="flex items-center" style={{ flex: columnFlex, gap: isBanner ? "1cqi" : "1.5cqi" }}>
                          {index > 0 && (
                            <div
                              style={{
                                width: isBanner ? "1px" : "1.5px",
                                height: isBanner ? "4cqi" : `${sq(5)}cqi`,
                                borderRadius: "1px",
                                background: settings.textColor,
                                opacity: 0.15,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div className="flex flex-col items-center" style={{ flex: 1, gap: 0 }}>
                            <span className="font-bold" style={{ fontSize: valueSize, lineHeight: isBanner ? "6cqi" : `${sq(8.5)}cqi` }}>
                              {formatMetricValue(metric.type, metric.value, abbreviate, metric.prefix)}
                            </span>
                            <p className="opacity-60 font-medium flex items-center" style={{ fontSize: labelSize, lineHeight: isBanner ? "3cqi" : `${sq(4)}cqi`, gap: isBanner ? "0.3cqi" : "0.5cqi" }}>
                              {metric.type !== "custom" && (
                                <HugeiconsIcon
                                  icon={METRIC_ICONS[metric.type]}
                                  style={{ width: iconSize, height: iconSize }}
                                  strokeWidth={2}
                                  color="currentColor"
                                />
                              )}
                              {metric.type === "custom" && metric.customLabel ? metric.customLabel : METRIC_LABELS[metric.type]}
                            </p>
                            {metric.previousValue !== undefined && metric.value > metric.previousValue && (() => {
                              const trendSize = isMain
                                ? (isBanner ? "2.3cqi" : `${sq(2.9)}cqi`)
                                : (isBanner ? "1.8cqi" : `${sq(2.3)}cqi`);
                              const pct = metric.previousValue > 0 ? Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100) : null;
                              if (pct === 0) return null;
                              return (
                                <span style={{ fontSize: trendSize, marginTop: "0.15cqi" }} className="flex items-center gap-[0.1cqi] text-emerald-400 font-semibold">
                                  <HugeiconsIcon
                                    icon={TradeUpIcon}
                                    style={{ width: trendSize, height: trendSize }}
                                    strokeWidth={2.5}
                                    color="currentColor"
                                  />
                                  {pct !== null && `+${pct}%`}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              /* Stack layout: metrics stacked vertically (default) */
              <div className={`flex flex-col ${align === "left" ? "items-start" : "items-center"}`} style={{ gap: 0 }}>
                {(isBanner ? settings.metrics.slice(0, 3) : settings.metrics).map((metric, index) => {
                  const hasHeading = !!settings.heading;
                  const primarySize = hasHeading
                    ? (isBanner ? "5.2cqi" : `${sq(6.4)}cqi`)
                    : (isBanner ? "7.5cqi" : `${sq(9.5)}cqi`);
                  const secondarySize = hasHeading
                    ? (isBanner ? "3cqi" : `${sq(3.7)}cqi`)
                    : (isBanner ? "3.5cqi" : `${sq(4.4)}cqi`);
                  const primaryIcon = hasHeading
                    ? (isBanner ? "3.6cqi" : `${sq(parseFloat(iconSizes.primaryWithPeriod))}cqi`)
                    : (isBanner ? "5.2cqi" : `${sq(parseFloat(iconSizes.primaryNoPeriod))}cqi`);
                  const secondaryIcon = hasHeading
                    ? (isBanner ? "2.6cqi" : `${sq(parseFloat(iconSizes.secondaryWithPeriod))}cqi`)
                    : (isBanner ? "3.4cqi" : `${sq(parseFloat(iconSizes.secondaryNoPeriod))}cqi`);
                  return (
                    <p
                      key={metric.id}
                      className={index === 0 ? "flex items-center font-semibold" : "opacity-80 flex items-center font-medium"}
                      style={{
                        fontSize: index === 0 ? primarySize : secondarySize,
                        gap: index === 0 ? (isBanner ? "0.6cqi" : "1cqi") : (isBanner ? "0.7cqi" : "1.2cqi"),
                        marginTop: index > 0 ? (isBanner ? "-0.3cqi" : "-0.5cqi") : undefined,
                      }}
                    >
                      {metric.type !== "custom" && (
                        <HugeiconsIcon
                          icon={METRIC_ICONS[metric.type]}
                          style={{
                            width: index === 0 ? primaryIcon : secondaryIcon,
                            height: index === 0 ? primaryIcon : secondaryIcon,
                          }}
                          strokeWidth={2}
                          color="currentColor"
                        />
                      )}
                      {formatMetricValue(metric.type, metric.value, abbreviate, metric.prefix)} {metric.type === "custom" && metric.customLabel ? metric.customLabel : METRIC_LABELS[metric.type]}
                      {metric.previousValue !== undefined && metric.value > metric.previousValue && (() => {
                        const trendSize = index === 0
                          ? (isBanner ? "2.6cqi" : `${sq(3.25)}cqi`)
                          : (isBanner ? "1.8cqi" : `${sq(2.3)}cqi`);
                        const pct = metric.previousValue > 0 ? Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100) : null;
                        if (pct === 0) return null;
                        return (
                          <span style={{ fontSize: trendSize, marginLeft: "0.4cqi" }} className="flex items-center gap-[0.15cqi] text-emerald-400 font-semibold">
                            <HugeiconsIcon
                              icon={TradeUpIcon}
                              style={{ width: trendSize, height: trendSize }}
                              strokeWidth={2.5}
                              color="currentColor"
                            />
                            {pct !== null && `+${pct}%`}
                          </span>
                        );
                      })()}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Branding Logo */}
        {isPremium && settings.branding?.logoUrl && settings.branding?.enabled !== false && settings.heading?.type !== "logo" && (
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
                height: `${(settings.branding.logoSize ?? 30) / 6}cqi`,
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
