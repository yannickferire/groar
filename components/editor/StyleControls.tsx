"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { EditorSettings, BackgroundPreset, FontFamily, AspectRatioType, BackgroundSettings, BrandingSettings, TemplateType } from "../Editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidHexColor } from "@/lib/validation";
import { FONT_LIST } from "@/lib/fonts";
import { ASPECT_RATIO_LIST } from "@/lib/aspect-ratios";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, Cancel01Icon, FloppyDiskIcon, Loading03Icon, ShuffleSquareIcon, Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Preset types & helpers ---

type PresetSettings = {
  template?: TemplateType;
  background: BackgroundSettings;
  textColor: string;
  aspectRatio?: AspectRatioType;
  font?: FontFamily;
  branding?: BrandingSettings;
  abbreviateNumbers?: boolean;
};

type Preset = {
  id: string;
  name: string;
  settings: PresetSettings;
  createdAt: string;
};

const PRESET_STYLE_KEYS: (keyof PresetSettings)[] = [
  "template", "background", "textColor", "aspectRatio", "font", "branding", "abbreviateNumbers",
];

function extractPresetSettings(settings: EditorSettings): PresetSettings {
  return {
    template: settings.template,
    background: settings.background,
    textColor: settings.textColor,
    aspectRatio: settings.aspectRatio,
    font: settings.font,
    branding: settings.branding,
    abbreviateNumbers: settings.abbreviateNumbers,
  };
}

function presetMatchesSettings(preset: PresetSettings, settings: EditorSettings): boolean {
  for (const key of PRESET_STYLE_KEYS) {
    const a = preset[key];
    const b = settings[key as keyof EditorSettings];
    if (JSON.stringify(a) !== JSON.stringify(b)) return false;
  }
  return true;
}

// --- Random style helpers ---

const RANDOM_TEXT_COLORS = [
  "#faf7e9", "#ffffff", "#f0f0f0", "#1a1a1a", "#0a0a0a",
  "#fde68a", "#bef264", "#93c5fd", "#c4b5fd", "#fca5a5",
  "#f9a8d4", "#a7f3d0", "#fcd34d", "#fdba74",
];

function randomizeStyle(
  backgrounds: BackgroundPreset[],
  includeAll: boolean,
): Pick<EditorSettings, "background" | "textColor" | "font"> {
  // Filter to image backgrounds only (no solid color)
  const eligible = backgrounds.filter(b => !b.color && (includeAll || !b.premium));
  const randomBg = eligible[Math.floor(Math.random() * eligible.length)];

  // Random font
  const eligibleFonts = FONT_LIST.filter(f => includeAll || !f.premium);
  const randomFont = eligibleFonts[Math.floor(Math.random() * eligibleFonts.length)];

  // Random text color
  const randomColor = RANDOM_TEXT_COLORS[Math.floor(Math.random() * RANDOM_TEXT_COLORS.length)];

  return {
    background: { presetId: randomBg.id, solidColor: "#f59e0b" },
    textColor: randomColor,
    font: randomFont.id,
  };
}

// --- Component ---

type StyleControlsProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  backgrounds: BackgroundPreset[];
  isPremium?: boolean;
  lockPremiumFeatures?: boolean;
  onPremiumBlock?: (feature: string) => void;
};

export default function StyleControls({ settings, onSettingsChange, backgrounds, isPremium = false, lockPremiumFeatures = false, onPremiumBlock }: StyleControlsProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [presetSelectOpen, setPresetSelectOpen] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const presetInputRef = useRef<HTMLInputElement>(null);

  // Fetch presets on mount & auto-select matching preset
  useEffect(() => {
    if (!isPremium) return;
    fetch("/api/user/presets")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.presets) {
          setPresets(data.presets);
          const current = settingsRef.current;
          const match = data.presets.find((p: Preset) => presetMatchesSettings(p.settings, current));
          if (match) setActivePresetId(match.id);
        }
      })
      .catch(() => {});
  }, [isPremium]);

  // Auto-deselect preset when style changes
  useEffect(() => {
    if (!activePresetId) return;
    const active = presets.find(p => p.id === activePresetId);
    if (active && !presetMatchesSettings(active.settings, settings)) {
      setActivePresetId(null);
    }
  }, [settings, activePresetId, presets]);

  const savePreset = useCallback(async (name: string) => {
    setIsSavingPreset(true);
    try {
      const res = await fetch("/api/user/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, settings: extractPresetSettings(settingsRef.current) }),
      });
      if (res.ok) {
        const data = await res.json();
        setPresets(prev => [...prev, data.preset]);
        setActivePresetId(data.preset.id);
      }
    } catch {} finally {
      setIsSavingPreset(false);
    }
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    setPresetSelectOpen(false);
    try {
      const res = await fetch(`/api/user/presets?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPresets(prev => prev.filter(p => p.id !== id));
        if (activePresetId === id) setActivePresetId(null);
      }
    } catch {}
  }, [activePresetId]);

  const renamePreset = useCallback(async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/user/presets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPresets(prev => prev.map(p => p.id === id ? { ...p, name: data.preset.name } : p));
      }
    } catch {}
  }, []);

  const loadPreset = useCallback((preset: Preset) => {
    const current = settingsRef.current;
    onSettingsChange({ ...current, ...preset.settings });
    setActivePresetId(preset.id);
  }, [onSettingsChange]);

  const handleRandomStyle = useCallback(() => {
    const includeAll = isPremium || !lockPremiumFeatures;
    const randomized = randomizeStyle(backgrounds, includeAll);
    onSettingsChange({ ...settingsRef.current, ...randomized });
  }, [backgrounds, isPremium, lockPremiumFeatures, onSettingsChange]);

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const selectBgPreset = (presetId: string) => {
    updateSetting("background", {
      presetId,
      solidColor: settings.background.solidColor || "#f59e0b"
    });
  };

  const updateSolidColor = (color: string) => {
    updateSetting("background", { ...settings.background, solidColor: color });
  };

  const selectFont = (fontId: FontFamily) => {
    updateSetting("font", fontId);
  };

  const selectAspectRatio = (ratioId: AspectRatioType) => {
    updateSetting("aspectRatio", ratioId);
  };

  // Reorder backgrounds: image backgrounds first, solid color last
  const orderedBackgrounds = [
    ...backgrounds.filter(b => !b.color),
    ...backgrounds.filter(b => b.color),
  ];

  const nextPresetNumber = presets.length + 1;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Row 1: Background presets */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-muted-foreground shrink-0 sr-only">Background</span>
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
                  selectBgPreset(preset.id);
                  updateSolidColor(e.target.value);
                }}
                onClick={() => selectBgPreset(preset.id)}
                className="absolute inset-0 w-full h-full p-0 cursor-pointer border-0 rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg"
                aria-label="Background color picker"
              />
            </div>
          ) : (
            <button
              key={preset.id}
              type="button"
              onClick={() => { if (lockPremiumFeatures && preset.premium) { onPremiumBlock?.("Premium background"); return; } selectBgPreset(preset.id); }}
              className={`relative w-10 h-10 rounded-lg transition-all ${
                lockPremiumFeatures && preset.premium
                  ? "opacity-50 cursor-not-allowed"
                  : settings.background.presetId === preset.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                    : "hover:ring-2 hover:ring-foreground/30"
              }`}
              title={lockPremiumFeatures && preset.premium ? `${preset.name} (Pro)` : preset.name}
            >
              {preset.image && (
                <Image
                  src={preset.image}
                  alt={preset.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              {!isPremium && preset.premium && (
                <span className="absolute inset-0 rounded-lg bg-black/30 flex items-end justify-end p-1">
                  <HugeiconsIcon icon={CrownIcon} size={12} strokeWidth={2.5} className="text-white/80" />
                </span>
              )}
            </button>
          )
        ))}
      </div>

      {/* Row 2: Text color + Font + Random */}
      <div className="flex items-center gap-4 flex-wrap">
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
              const font = FONT_LIST.find(f => f.id === value);
              if (lockPremiumFeatures && font?.premium) { onPremiumBlock?.("Premium font"); return; }
              selectFont(value as FontFamily);
            }}
          >
            <SelectTrigger className="w-56 h-10 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_LIST.map((font) => (
                <SelectItem
                  key={font.id}
                  value={font.id}
                  className={`flex items-center justify-between ${lockPremiumFeatures && font.premium ? "opacity-50" : ""}`}
                >
                  <span className="inline-flex items-center gap-1.5" style={{ fontFamily: `var(${font.variable})` }}>
                    {font.name}
                    {!isPremium && font.premium && (
                      <span className="inline-flex items-center gap-0.5 text-muted-foreground/60">
                        <HugeiconsIcon icon={CrownIcon} size={10} strokeWidth={2} />
                        <span className="text-[10px] font-medium leading-none">PRO</span>
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-border" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRandomStyle}
          className="h-9 bg-white"
        >
          <HugeiconsIcon icon={ShuffleSquareIcon} size={14} strokeWidth={2} />
          <span className="hidden sm:inline">Randomize style</span>
        </Button>
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
                onClick={() => { if (lockPremiumFeatures && ratio.premium) { onPremiumBlock?.("Premium size"); return; } selectAspectRatio(ratio.id as AspectRatioType); }}
                className={`relative h-10 px-3 text-xs rounded-lg transition-all capitalize border ${
                  lockPremiumFeatures && ratio.premium
                    ? "opacity-50 cursor-not-allowed border-border"
                    : isSelected
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-white text-muted-foreground hover:bg-muted border-border"
                }`}
              >
                {ratio.label}
                {!isPremium && ratio.premium && (
                  <span className="absolute -top-2 -right-0.5 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 text-[9px] font-bold leading-none bg-card text-muted-foreground border border-border">
                    <HugeiconsIcon icon={CrownIcon} size={10} strokeWidth={2} />
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: Presets (Pro only) */}
      {isPremium && (
        <div className="flex flex-col items-center gap-2 w-full mt-1">
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-muted-foreground shrink-0">Preset</span>
            {showPresetInput ? (
              <form
                className="flex-1 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (presetName.trim()) {
                    savePreset(presetName.trim());
                    setPresetName("");
                    setShowPresetInput(false);
                  }
                }}
              >
                <Input
                  ref={presetInputRef}
                  autoFocus
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setShowPresetInput(false); setPresetName(""); } }}
                  className="flex-1 h-9 text-sm"
                />
                <Button type="submit" size="sm" variant="default" disabled={!presetName.trim() || isSavingPreset} className="h-9 px-3 text-xs shrink-0">
                  {isSavingPreset ? <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" /> : <>
                    <HugeiconsIcon icon={FloppyDiskIcon} size={14} strokeWidth={1.5} />
                    Save
                  </>}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setShowPresetInput(false); setPresetName(""); }} className="h-9 px-2 shrink-0">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </Button>
              </form>
            ) : (
              <>
                <Select
                  open={presetSelectOpen}
                  onOpenChange={setPresetSelectOpen}
                  value={activePresetId || ""}
                  onValueChange={(value) => {
                    if (!value) return;
                    const preset = presets.find(p => p.id === value);
                    if (preset) loadPreset(preset);
                  }}
                >
                  <SelectTrigger className="flex-1 h-9 bg-white text-sm">
                    <SelectValue placeholder="No preset selected" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center group">
                        {editingPresetId === preset.id ? (
                          <form
                            className="flex-1 flex items-center gap-1 px-2 py-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              renamePreset(preset.id, editingName);
                              setEditingPresetId(null);
                            }}
                          >
                            <input
                              autoFocus
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => {
                                renamePreset(preset.id, editingName);
                                setEditingPresetId(null);
                              }}
                              className="flex-1 text-sm bg-transparent border-b border-primary outline-none py-0.5"
                              onKeyDown={(e) => { if (e.key === "Escape") setEditingPresetId(null); }}
                            />
                          </form>
                        ) : (
                          <SelectItem value={preset.id} className="flex-1">
                            <span
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingPresetId(preset.id);
                                setEditingName(preset.name);
                              }}
                            >
                              {preset.name}
                            </span>
                          </SelectItem>
                        )}
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditingPresetId(preset.id);
                            setEditingName(preset.name);
                          }}
                          title="Rename"
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={12} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-muted-foreground hover:text-destructive transition-all"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deletePreset(preset.id);
                          }}
                          title="Delete"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                    {presets.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No presets yet</div>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!!activePresetId}
                  onClick={() => {
                    setPresetName(`Preset ${nextPresetNumber}`);
                    setShowPresetInput(true);
                    setTimeout(() => presetInputRef.current?.select(), 50);
                  }}
                  className="h-9 px-3 text-xs shrink-0"
                  title={activePresetId ? "Preset already saved" : "Save current style as preset"}
                >
                  <HugeiconsIcon icon={FloppyDiskIcon} size={14} strokeWidth={1.5} />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
