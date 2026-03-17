import { BACKGROUNDS } from "@/lib/backgrounds";
import { BackgroundPreset, EditorSettings } from "./types";

export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const STORAGE_KEY = "groar-editor-settings";

export const SOLID_COLOR_PRESET: BackgroundPreset = {
  id: "solid-color",
  name: "Solid Color",
  color: "#f59e0b",
};

export const ALL_BACKGROUNDS = [SOLID_COLOR_PRESET, ...BACKGROUNDS];

export const defaultSettings: EditorSettings = {
  handle: "@your_handle",
  period: { type: "week", number: 1 },
  heading: { type: "period", periodType: "week", periodFrom: 1 },
  metrics: [{ id: crypto.randomUUID(), type: "followers", value: 100 }],
  background: { presetId: BACKGROUNDS[0]?.id || "solid-color", solidColor: "#f59e0b" },
  textColor: "#dfd5b3",
  aspectRatio: "post",
  font: "bricolage",
  template: "metrics",
  abbreviateNumbers: true,
};

export function loadSettings(): EditorSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.handle && parsed.metrics && parsed.background && parsed.textColor) {
        // Migrate old period → heading format
        if (parsed.period && !parsed.heading) {
          parsed.heading = {
            type: "period" as const,
            periodType: parsed.period.type,
            periodFrom: parsed.period.number,
          };
        }
        // Migrate old heading format (periodNumber → periodFrom)
        if (parsed.heading?.periodNumber !== undefined && parsed.heading?.periodFrom === undefined) {
          parsed.heading.periodFrom = parsed.heading.periodNumber;
          delete parsed.heading.periodNumber;
        }
        // Migrate metrics without IDs
        if (parsed.metrics) {
          parsed.metrics = parsed.metrics.map((m: Record<string, unknown>) =>
            m.id ? m : { ...m, id: crypto.randomUUID() }
          );
        }
        return {
          ...defaultSettings,
          ...parsed,
          background: { ...defaultSettings.background, ...parsed.background },
          branding: parsed.branding,
        };
      }
    }
  } catch {
    // Invalid JSON, use defaults
  }
  return defaultSettings;
}

export function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage not available
  }
}
