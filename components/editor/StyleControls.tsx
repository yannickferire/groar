"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { EditorSettings, BackgroundPreset, FontFamily, AspectRatioType, BackgroundSettings, BrandingSettings, TemplateType, TextAlign } from "../Editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidHexColor } from "@/lib/validation";
import { FONT_LIST } from "@/lib/fonts";
import { ASPECT_RATIO_LIST } from "@/lib/aspect-ratios";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, Cancel01Icon, FloppyDiskIcon, Loading03Icon, ShuffleSquareIcon, Delete02Icon, PencilEdit02Icon, SourceCodeSquareIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
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
  onSaveAsTemplate?: (settings: EditorSettings, name?: string) => void;
  hasApiKeys?: boolean;
};

export default function StyleControls({ settings, onSettingsChange, backgrounds, isPremium = false, lockPremiumFeatures = false, onPremiumBlock, onSaveAsTemplate, hasApiKeys = false }: StyleControlsProps) {
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

  // Background popularity (global export counts)
  const [bgPopularity, setBgPopularity] = useState<Record<string, number>>({});
  const [showAllBgs, setShowAllBgs] = useState(false);
  const [bgPerRow, setBgPerRow] = useState(0);
  const bgWrapperRef = useRef<HTMLDivElement>(null);

  const handleRandomStyle = useCallback(() => {
    const includeAll = isPremium || !lockPremiumFeatures;
    // Only randomize among visible backgrounds
    const visibleBgs = showAllBgs ? backgrounds : (() => {
      const allImages = backgrounds.filter(b => !b.color);
      const now = Date.now();
      const isNewPremium = (b: BackgroundPreset) =>
        b.premium && b.addedAt ? (now - new Date(b.addedAt).getTime()) < NEW_DAYS * 86400000 : false;
      const newBgs = allImages.filter(isNewPremium);
      const regularBgs = allImages.filter(b => !isNewPremium(b));
      const solidSlots = backgrounds.some(b => b.color) ? 1 : 0;
      const reservedSlots = 1 + solidSlots + newBgs.length;
      const regularSlots = Math.max(bgPerRow - reservedSlots, 0);
      return [...regularBgs.slice(0, regularSlots), ...newBgs];
    })();
    const randomized = randomizeStyle(visibleBgs, includeAll);
    onSettingsChange({ ...settingsRef.current, ...randomized });
  }, [backgrounds, isPremium, lockPremiumFeatures, onSettingsChange, showAllBgs, bgPerRow]);

  useEffect(() => {
    fetch("/api/backgrounds/popularity")
      .then(res => res.ok ? res.json() : {})
      .then(data => setBgPopularity(data))
      .catch(() => {});
  }, []);

  // Measure how many bg thumbnails fit in one row (observe stable parent wrapper)
  useEffect(() => {
    const el = bgWrapperRef.current;
    if (!el) return;
    const measure = () => {
      const itemSize = 40; // w-10
      const gap = 8; // gap-2
      const width = el.clientWidth;
      const count = Math.floor((width + gap) / (itemSize + gap));
      setBgPerRow(prev => {
        const next = Math.max(count, 2);
        return prev === next ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const NEW_DAYS = 3;
  const orderedBackgrounds = (() => {
    const sortByPopularity = (a: BackgroundPreset, b: BackgroundPreset) =>
      (bgPopularity[b.id] || 0) - (bgPopularity[a.id] || 0);
    const imageBackgrounds = backgrounds.filter(b => !b.color);
    const solid = backgrounds.filter(b => b.color);
    if (isPremium) {
      // Dashboard: all images sorted by popularity together
      return [...imageBackgrounds.sort(sortByPopularity), ...solid];
    } else {
      // Landing: free first, then premium, both sorted by popularity
      const free = imageBackgrounds.filter(b => !b.premium).sort(sortByPopularity);
      const premium = imageBackgrounds.filter(b => b.premium).sort(sortByPopularity);
      return [...free, ...premium, ...solid];
    }
  })();

  const nextPresetNumber = presets.length + 1;

  return (
    <div ref={bgWrapperRef} className="flex flex-col items-center gap-3">
      {/* Row 1: Background presets */}
      {(() => {
        if (bgPerRow === 0) return <div className="h-10" />; // placeholder while measuring
        const solidPreset = orderedBackgrounds.find(b => b.color);
        const allImages = orderedBackgrounds.filter(b => !b.color);
        const now = Date.now();
        const isNewBg = (b: BackgroundPreset) =>
          b.addedAt ? (now - new Date(b.addedAt).getTime()) < NEW_DAYS * 86400000 : false;
        const isPromotedNew = (b: BackgroundPreset) => isNewBg(b) && (isPremium || b.premium);
        const newBgs = allImages.filter(isPromotedNew);
        const regularBgs = allImages.filter(b => !isPromotedNew(b));
        // Reserve slots for: +X button + solid + new backgrounds
        const reservedSlots = 1 + (solidPreset ? 1 : 0) + newBgs.length;
        const regularSlots = Math.max(bgPerRow - reservedSlots, 0);
        const firstRowRegular = regularBgs.slice(0, regularSlots);
        const extraImages = regularBgs.slice(regularSlots);
        const canExpand = extraImages.length > 0;
        const hiddenCount = extraImages.length;

        const renderImageBg = (preset: BackgroundPreset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => { if (lockPremiumFeatures && preset.premium) { onPremiumBlock?.("Premium background"); return; } selectBgPreset(preset.id); }}
            className={`relative w-10 h-10 shrink-0 rounded-lg overflow-visible transition-all ${
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
            {isPremium && preset.addedAt && (Date.now() - new Date(preset.addedAt).getTime()) < NEW_DAYS * 86400000 && (
              <span className="absolute -top-2 left-[calc(50%+1px)] -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-medium uppercase leading-none px-1.5 py-0.5 rounded-full z-10">
                new
              </span>
            )}
          </button>
        );

        return (
          <div className="w-full flex flex-col items-center gap-2 py-1">
            {/* First row: fixed — images + solid + expand/collapse button */}
            <div className="flex items-center gap-2 justify-center flex-nowrap">
              {firstRowRegular.map(renderImageBg)}
              {newBgs.map(renderImageBg)}
              {solidPreset && (
                <div
                  key={solidPreset.id}
                  className={`relative w-10 h-10 shrink-0 rounded-lg overflow-hidden transition-all ${
                    settings.background.presetId === solidPreset.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                      : "hover:ring-2 hover:ring-foreground/30"
                  }`}
                  title={solidPreset.name}
                >
                  <Input
                    type="color"
                    value={settings.background.solidColor || solidPreset.color}
                    onChange={(e) => {
                      selectBgPreset(solidPreset.id);
                      updateSolidColor(e.target.value);
                    }}
                    onClick={() => selectBgPreset(solidPreset.id)}
                    className="absolute inset-0 w-full h-full p-0 cursor-pointer border-0 rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg"
                    aria-label="Background color picker"
                  />
                </div>
              )}
              {canExpand && !showAllBgs && (
                <button
                  type="button"
                  onClick={() => setShowAllBgs(true)}
                  className="w-10 h-10 shrink-0 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors font-[DM_Mono,monospace]"
                  title="Show more backgrounds"
                >
                  +{hiddenCount}
                </button>
              )}
              {canExpand && showAllBgs && (
                <button
                  type="button"
                  onClick={() => setShowAllBgs(false)}
                  className="w-10 h-10 shrink-0 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  title="Show less"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
                </button>
              )}
            </div>
            {/* Extra rows: only when expanded */}
            {showAllBgs && extraImages.length > 0 && (
              <div className="flex items-center gap-2 justify-center flex-wrap">
                {extraImages.map(renderImageBg)}
              </div>
            )}
          </div>
        );
      })()}

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
            <SelectTrigger className="w-56 h-10 bg-white dark:bg-background">
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

        {(!settings.template || settings.template === "metrics") && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Align</span>
              <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50">
                {([
                  { id: "left" as TextAlign, label: "Left", icon: (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="2" y1="3" x2="12" y2="3" />
                      <line x1="2" y1="7" x2="9" y2="7" />
                      <line x1="2" y1="11" x2="11" y2="11" />
                    </svg>
                  )},
                  { id: "center" as TextAlign, label: "Center", icon: (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="2" y1="3" x2="12" y2="3" />
                      <line x1="3.5" y1="7" x2="10.5" y2="7" />
                      <line x1="2.5" y1="11" x2="11.5" y2="11" />
                    </svg>
                  )},
                ]).map((align) => (
                  <button
                    key={align.id}
                    type="button"
                    onClick={() => updateSetting("textAlign", align.id)}
                    className={`p-1.5 rounded-md transition-colors ${
                      (settings.textAlign || "center") === align.id
                        ? "bg-white dark:bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={align.label}
                  >
                    {align.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-6 bg-border" />
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRandomStyle}
          className="h-9 bg-white dark:bg-background"
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
                      : "bg-white dark:bg-background text-muted-foreground hover:bg-muted border-border"
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
                  <SelectTrigger className="flex-1 h-9 bg-white dark:bg-background text-sm">
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
      {/* Row 5: Save as API template (Pro + has API keys — only shown for beta users) */}
      {hasApiKeys && onSaveAsTemplate && (
        <ApiTemplateSaveRow settings={settings} onSaveAsTemplate={onSaveAsTemplate} />
      )}
    </div>
  );
}

// --- Simple API template save row ---

function ApiTemplateSaveRow({
  settings,
  onSaveAsTemplate,
}: {
  settings: EditorSettings;
  onSaveAsTemplate: (settings: EditorSettings, name?: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback((name: string) => {
    setIsSaving(true);
    onSaveAsTemplate(settings, name);
    setTimeout(() => setIsSaving(false), 1000);
  }, [settings, onSaveAsTemplate]);

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {showInput ? (
        <form
          className="flex items-center gap-2 w-full max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (templateName.trim()) {
              handleSave(templateName.trim());
              setTemplateName("");
              setShowInput(false);
            }
          }}
        >
          <Input
            ref={inputRef}
            autoFocus
            placeholder="Template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setShowInput(false); setTemplateName(""); } }}
            className="flex-1 h-9 text-sm"
          />
          <Button type="submit" size="sm" variant="default" disabled={!templateName.trim() || isSaving} className="h-9 px-3 text-xs shrink-0">
            {isSaving ? <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" /> : <>
              <HugeiconsIcon icon={FloppyDiskIcon} size={14} strokeWidth={1.5} />
              Save
            </>}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setShowInput(false); setTemplateName(""); }} className="h-9 px-2 shrink-0">
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-center gap-2 w-full">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setTemplateName("Template");
              setShowInput(true);
              setTimeout(() => inputRef.current?.select(), 50);
            }}
            className="h-8 px-3 text-xs shrink-0"
          >
            <HugeiconsIcon icon={SourceCodeSquareIcon} size={14} strokeWidth={1.5} />
            Save as API template
          </Button>
          <a
            href="/dashboard/api"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            Manage templates
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={1.5} />
          </a>
        </div>
      )}
    </div>
  );
}
