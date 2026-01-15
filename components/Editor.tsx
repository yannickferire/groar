"use client";

import { useState } from "react";
import Sidebar from "./editor/Sidebar";
import Preview from "./editor/Preview";

export type EditorSettings = {
  backgroundColor: string;
  textColor: string;
  layout: "default" | "minimal" | "detailed";
};

const defaultSettings: EditorSettings = {
  backgroundColor: "#1a1a2e",
  textColor: "#ffffff",
  layout: "default",
};

export default function Editor() {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);

  return (
    <section className="w-full max-w-6xl mx-auto mt-6 flex flex-col md:flex-row gap-4 rounded-4xl bg-foreground/7 p-4">
      <Sidebar settings={settings} onSettingsChange={setSettings} />
      <Preview settings={settings} />
    </section>
  );
}
