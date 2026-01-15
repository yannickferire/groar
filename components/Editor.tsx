"use client";

import { useState } from "react";
import Sidebar from "./editor/Sidebar";
import Preview from "./editor/Preview";

export type PeriodType = "day" | "week" | "month" | "year";

export type MetricType = "followers" | "impressions" | "replies" | "engagementRate";

export type Metric = {
  type: MetricType;
  value: number;
};

export const METRIC_LABELS: Record<MetricType, string> = {
  followers: "Followers",
  impressions: "Impressions",
  replies: "Replies",
  engagementRate: "Engagement Rate",
};

export type EditorSettings = {
  handle: string;
  periodType: PeriodType;
  periodNumber: number;
  metrics: Metric[];
  backgroundColor: string;
  textColor: string;
  accentColor: string;
};

const defaultSettings: EditorSettings = {
  handle: "@yannick_ferire",
  periodType: "week",
  periodNumber: 1,
  metrics: [{ type: "followers", value: 56 }],
  backgroundColor: "#1a1a2e",
  textColor: "#ffffff",
  accentColor: "#f59e0b",
};

export default function Editor() {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);

  return (
    <section className="w-full max-w-6xl mx-auto mt-6 flex flex-col md:flex-row gap-3 rounded-4xl bg-fade p-3">
      <Sidebar settings={settings} onSettingsChange={setSettings} />
      <Preview settings={settings} />
    </section>
  );
}
