"use client";

import Image from "next/image";
import { EditorSettings, BackgroundPreset, FontFamily, AspectRatioType } from "../Editor";
import { Input } from "@/components/ui/input";
import { isValidHexColor } from "@/lib/validation";
import { FONT_LIST } from "@/lib/fonts";
import { ASPECT_RATIO_LIST } from "@/lib/aspect-ratios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StyleControlsProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  backgrounds: BackgroundPreset[];
  isPremium?: boolean;
};

export default function StyleControls({ settings, onSettingsChange, backgrounds, isPremium = false }: StyleControlsProps) {
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

  if (!isPremium) {
    // Free version: single row, centered
    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Background presets */}
        <div className="flex items-center gap-2">
          {orderedBackgrounds
            .filter((preset) => !preset.premium)
            .map((preset) => (
            preset.color ? (
              <div
                key={preset.id}
                className={`relative w-10 h-10 rounded-lg overflow-hidden transition-all ${
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
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={`w-10 h-10 rounded-lg overflow-hidden transition-all ${
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
            className="w-10 h-10 p-0 cursor-pointer border-0 rounded-lg overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
            aria-label="Text color picker"
          />
        </div>
      </div>
    );
  }

  // Premium version: stacked rows, centered
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Row 1: Background presets */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Background</span>
        {orderedBackgrounds.map((preset) => (
          preset.color ? (
            <div
              key={preset.id}
              className={`relative w-10 h-10 rounded-lg overflow-hidden transition-all ${
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
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset.id)}
              className={`w-10 h-10 rounded-lg overflow-hidden transition-all ${
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

      {/* Row 2: Text color + Font */}
      <div className="flex items-center gap-4">
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
            className="w-10 h-10 p-0 cursor-pointer border-0 rounded-lg overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
            aria-label="Text color picker"
          />
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Font</span>
          <Select
            value={settings.font || "bricolage"}
            onValueChange={(value) => {
              updateSetting("font", value as FontFamily);
            }}
          >
            <SelectTrigger className="w-48 h-10 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_LIST.map((font) => (
                <SelectItem
                  key={font.id}
                  value={font.id}
                  className="flex items-center justify-between"
                >
                  <span style={{ fontFamily: `var(${font.variable})` }}>
                    {font.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Aspect ratio */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Size</span>
        <div className="flex gap-2">
          {ASPECT_RATIO_LIST.map((ratio) => {
            const isSelected = (settings.aspectRatio || "post") === ratio.id;

            return (
              <button
                key={ratio.id}
                type="button"
                onClick={() => updateSetting("aspectRatio", ratio.id as AspectRatioType)}
                className={`h-10 px-3 text-xs rounded-lg transition-all capitalize border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-white text-muted-foreground hover:bg-muted border-border"
                }`}
              >
                {ratio.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
