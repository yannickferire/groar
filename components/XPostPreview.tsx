"use client";

import Image from "next/image";
import CardPreview from "./editor/CardPreview";
import type { MetricType } from "./editor/types";
import { METRIC_DISPLAY_LABELS, type AutomationVisualSettings, type AutoPostCardTemplate, type AutoPostMetric, type AutoPostTrigger } from "@/lib/auto-post-shared";

type XPostPreviewProps = {
  displayName: string;
  username: string;
  profileImageUrl: string | null;
  verified?: boolean;
  tweetText: string;
  metric: MetricType;
  extraMetrics?: MetricType[];
  value?: number;
  goal?: number;
  dayNumber?: number;
  trigger?: AutoPostTrigger;
  cardTemplate: AutoPostCardTemplate;
  visualSettings: AutomationVisualSettings;
  className?: string;
};

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" className="w-[18px] h-[18px] shrink-0" fill="#1d9bf0">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.855-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.143.271.586.702 1.084 1.24 1.438.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.225 1.261.272 1.893.143.636-.131 1.222-.436 1.69-.882.445-.47.75-1.055.88-1.69.131-.636.083-1.293-.139-1.899.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  );
}

export default function XPostPreview({
  displayName,
  username,
  profileImageUrl,
  verified = true,
  tweetText,
  metric,
  extraMetrics,
  value = 1000,
  goal,
  dayNumber,
  trigger,
  cardTemplate,
  visualSettings,
  className,
}: XPostPreviewProps) {
  const headingText = dayNumber != null && trigger && trigger !== "milestone"
    ? `${trigger === "weekly" ? "Week" : "Day"} ${dayNumber}`
    : undefined;
  const formattedValue = value.toLocaleString();
  const percent = goal && goal > 0 ? Math.round(Math.min((value / goal) * 100, 100)) : 0;
  const previewText = tweetText
    .replace(/\{milestone\}/g, formattedValue)
    .replace(/\{value\}/g, formattedValue)
    .replace(/\{goal\}/g, goal ? goal.toLocaleString() : "10K")
    .replace(/\{metric\}/g, METRIC_DISPLAY_LABELS[metric as AutoPostMetric] || metric)
    .replace(/\{period\}/g, String(dayNumber ?? 42))
    .replace(/\{day\}/g, String(dayNumber ?? 42))
    .replace(/\{week\}/g, String(dayNumber ?? 5))
    .replace(/\{currentDay\}/g, "1")
    .replace(/\{totalDays\}/g, "30")
    .replace(/\{daysLeft\}/g, "29")
    .replace(/\{percent\}/g, String(percent))
    .replace(/\{delta\}/g, "0");

  // Highlight @mentions, URLs, and #hashtags in blue (like X does)
  const renderTweetText = (text: string) => {
    const parts = text.split(/(@\w+|https?:\/\/\S+|[\w-]+\.[\w.]+(?:\/\S*)?|#\w+)/g);
    return parts.map((part, i) => {
      if (/^@\w+/.test(part) || /^#\w+/.test(part) || /^https?:\/\//.test(part) || /^[\w-]+\.[\w.]+/.test(part)) {
        return <span key={i} className="text-[#1d9bf0]">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div
      className={`bg-black text-white overflow-hidden rounded-2xl ${className || ""}`}
      style={{ fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-neutral-800">
            {profileImageUrl ? (
              <Image src={profileImageUrl} alt="" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-1 leading-5">
              <span className="font-bold text-[15px] truncate">{displayName}</span>
              {verified && <VerifiedBadge />}
              <span className="text-[15px] text-neutral-500 truncate">@{username}</span>
              <span className="text-neutral-500 text-[15px]">&middot;</span>
              <span className="text-neutral-500 text-[15px]">now</span>
            </div>

            {/* Tweet text */}
            <p className="text-[15px] leading-5 mt-1 whitespace-pre-line">{renderTweetText(previewText)}</p>

            {/* Card image */}
            <div className="mt-3 rounded-2xl overflow-hidden border border-neutral-800">
              <CardPreview
                metric={metric}
                extraMetrics={extraMetrics}
                value={value}
                goal={goal}
                cardTemplate={cardTemplate}
                visualSettings={visualSettings}
                handle={`@${username}`}
                headingText={headingText}
              />
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between mt-3 mb-1 text-neutral-500 text-[13px]">
              <ActionButton count={43} label="Reply" outline>
                <path d="M1.751 10c.004-5.07 3.57-9.342 8.38-10.323a10 10 0 0 1 7.618 1.752 9.904 9.904 0 0 1 3.753 6.321c.418 2.494-.218 5.043-1.774 7.104L22 21l-5.658-1.58a9.3 9.3 0 0 1-3.59.703A10.087 10.087 0 0 1 1.75 10Z" />
              </ActionButton>
              <ActionButton count={3} label="Repost">
                <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88ZM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2Z" />
              </ActionButton>
              <ActionButton count={128} label="Like" color="#f91880">
                <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.45-4.92-.334-6.98C3.895 4.19 5.873 3 8.294 3c1.86 0 3.24.958 4.206 2.155C13.466 3.958 14.846 3 16.706 3c2.421 0 4.399 1.19 5.51 3.21 1.117 2.06 1.027 4.48-.332 6.98Z" />
              </ActionButton>
              <ActionButton count={12} label="Views" suffix="K">
                <path d="M8.75 21V3h2v18h-2ZM18.75 21V8.5h2V21h-2ZM13.75 21v-9h2v9h-2ZM3.75 21v-4h2v4h-2Z" />
              </ActionButton>
              <div className="flex items-center gap-3">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="#1d9bf0">
                  <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5Z" />
                </svg>
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.001 3.996A2.004 2.004 0 0 1 18.995 21H5.005A2.004 2.004 0 0 1 3 18.996V15h2v4h14v-4h2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ count, label, suffix, color, outline, children }: {
  count: number;
  label: string;
  suffix?: string;
  color?: string;
  outline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label} style={color ? { color } : undefined}>
      <svg
        className="w-[18px] h-[18px]"
        viewBox="0 0 24 24"
        fill={outline ? "none" : "currentColor"}
        stroke={outline ? "currentColor" : undefined}
        strokeWidth={outline ? 1.5 : undefined}
      >
        {children}
      </svg>
      <span>{count}{suffix}</span>
    </div>
  );
}
