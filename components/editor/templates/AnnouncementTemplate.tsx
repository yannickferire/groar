"use client";

import { EditorSettings } from "@/components/Editor";

type AnnouncementTemplateProps = {
  settings: EditorSettings;
};

export default function AnnouncementTemplate({ settings }: AnnouncementTemplateProps) {
  const features = settings.announcements?.filter(f => f.text) || [];
  const isBanner = settings.aspectRatio === "banner";

  return (
    <div
      className="flex flex-col w-full"
      style={{
        gap: isBanner ? "0.8cqi" : "1.2cqi",
        padding: isBanner ? "0 8%" : "0 6%",
      }}
    >
      {features.map((feature, index) => (
        <div
          key={index}
          className="flex items-center overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: isBanner ? "1.2cqi" : "1.8cqi",
            padding: isBanner ? "1.2cqi 2cqi" : "1.6cqi 2.5cqi",
            gap: isBanner ? "1.2cqi" : "1.8cqi",
            WebkitMaskImage: "linear-gradient(white, white)",
            maskImage: "linear-gradient(white, white)",
          }}
        >
          <span style={{ fontSize: isBanner ? "2.8cqi" : "3.8cqi", lineHeight: 1 }}>
            {feature.emoji || "✅"}
          </span>
          <span
            className="font-semibold"
            style={{ fontSize: isBanner ? "2.2cqi" : "2.8cqi" }}
          >
            {feature.text}
          </span>
        </div>
      ))}
    </div>
  );
}
