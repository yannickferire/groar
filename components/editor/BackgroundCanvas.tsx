"use client";

import { BackgroundSettings, BackgroundPreset } from "../Editor";

type BackgroundCanvasProps = {
  settings: BackgroundSettings;
  backgrounds: BackgroundPreset[];
  className?: string;
};

export default function BackgroundCanvas({ settings, backgrounds, className }: BackgroundCanvasProps) {
  const preset = backgrounds.find(p => p.id === settings.presetId) || backgrounds[0];

  if (!preset) {
    return null;
  }

  // Solid color background
  if (preset.id === "solid-color") {
    return (
      <div
        className={`absolute inset-0 ${className || ""}`}
        style={{ backgroundColor: settings.solidColor || preset.color }}
      />
    );
  }

  // Gradient background
  if (preset.gradient) {
    return (
      <div
        className={`absolute inset-0 ${className || ""}`}
        style={{ background: preset.gradient }}
      />
    );
  }

  // Image background - use CSS background-image for better html-to-image compatibility
  if (!preset.image) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 ${className || ""}`}
      style={{
        backgroundImage: `url(${preset.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}
