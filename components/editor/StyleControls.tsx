"use client";

import Image from "next/image";
import { EditorSettings, BackgroundPreset } from "../Editor";
import { Input } from "@/components/ui/input";
import { isValidHexColor } from "@/lib/validation";

type StyleControlsProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  backgrounds: BackgroundPreset[];
};

export default function StyleControls({ settings, onSettingsChange, backgrounds }: StyleControlsProps) {
  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const selectPreset = (presetId: string) => {
    updateSetting("background", {
      presetId,
      solidColor: settings.background.solidColor || "#f59e0b"
    });
  };

  const updateSolidColor = (color: string) => {
    updateSetting("background", { ...settings.background, solidColor: color });
  };

  // Reorder backgrounds: image backgrounds first, solid color last
  const orderedBackgrounds = [
    ...backgrounds.filter(b => !b.color),
    ...backgrounds.filter(b => b.color),
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* Background presets */}
      <div className="flex items-center gap-2">
        {orderedBackgrounds.map((preset) => (
          preset.color ? (
            // Solid color preset - integrated color picker
            <div
              key={preset.id}
              className={`relative w-10 h-10 rounded-lg overflow-hidden transition-all shadow-md ${
                settings.background.presetId === preset.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  : "hover:ring-2 hover:ring-foreground/30"
              }`}
              title={preset.name}
            >
              <Input
                type="color"
                value={settings.background.solidColor || preset.color}
                onChange={(e) => {
                  selectPreset(preset.id);
                  updateSolidColor(e.target.value);
                }}
                onClick={() => selectPreset(preset.id)}
                className="absolute inset-0 w-full h-full p-0 cursor-pointer border-0 rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg"
                aria-label="Background color picker"
              />
            </div>
          ) : (
            // Image preset
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset.id)}
              className={`w-10 h-10 rounded-lg overflow-hidden transition-all shadow-md ${
                settings.background.presetId === preset.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  : "hover:ring-2 hover:ring-foreground/30"
              }`}
              title={preset.name}
            >
              {preset.image && (
                <Image
                  src={preset.image}
                  alt={preset.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          )
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Text color */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Text</span>
        <Input
          type="color"
          value={settings.textColor}
          onChange={(e) => updateSetting("textColor", e.target.value)}
          onBlur={(e) => {
            if (!isValidHexColor(e.target.value)) {
              updateSetting("textColor", "#ffffff");
            }
          }}
          className="w-10 h-10 p-0 cursor-pointer border-0 rounded-lg overflow-hidden shadow-md [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
          aria-label="Text color picker"
        />
      </div>
    </div>
  );
}
