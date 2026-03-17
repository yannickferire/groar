"use client";

import { Dialog as RadixDialog, VisuallyHidden } from "radix-ui";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Copy01Icon, Tick01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useState, useCallback, useMemo } from "react";
import { METRIC_LABELS, type MetricType, type TemplateType, type EditorSettings } from "./editor/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type MetricSlot = {
  type: MetricType;
  customLabel?: string;
};

type AnnouncementSlot = {
  emoji?: string;
};

type ApiTemplateData = {
  id: string;
  name: string;
  templateType: string;
  metricSlots: MetricSlot[];
  announcementSlots?: AnnouncementSlot[];
};

type Param = {
  key: string;
  value: string;
  label: string;
  dynamic?: boolean;
  randomizable?: boolean;
};

type ApiTemplateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ApiTemplateData | null;
  settings: EditorSettings | null;
};

export default function ApiTemplateModal({ open, onOpenChange, template, settings }: ApiTemplateModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const { fullUrl, sParam, dynamicParams, fixedParams } = useMemo(() => {
    if (!template || !settings) return { fullUrl: "", sParam: "", dynamicParams: [] as Param[], fixedParams: [] as Param[] };

    const baseUrl = "https://groar.app";
    const tplType = (template.templateType || "metrics") as TemplateType;

    // Build minimal settings for `s` param — strip dynamic data (values, texts, goal)
    // to keep the URL as short as possible. Only keep design/layout config + metric types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const minimal: Record<string, any> = {
      template: settings.template,
      background: { presetId: settings.background.presetId },
      textColor: settings.textColor,
      font: settings.font,
      aspectRatio: settings.aspectRatio,
      heading: settings.heading || undefined,
      textAlign: settings.textAlign !== "center" ? settings.textAlign : undefined,
      abbreviateNumbers: settings.abbreviateNumbers === false ? false : undefined,
    };
    if (tplType === "metrics") {
      minimal.metricsLayout = settings.metricsLayout;
      // Keep metric types + customLabels, strip values
      minimal.metricSlots = settings.metrics.map(m => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slot: any = { type: m.type };
        if (m.customLabel) slot.customLabel = m.customLabel;
        if (m.prefix) slot.prefix = m.prefix;
        return slot;
      });
    } else if (tplType === "milestone" || tplType === "progress") {
      const m = settings.metrics[0];
      if (m) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slot: any = { type: m.type };
        if (m.customLabel) slot.customLabel = m.customLabel;
        minimal.metricSlots = [slot];
      }
      if (tplType === "milestone") {
        minimal.milestoneEmoji = settings.milestoneEmoji;
        minimal.milestoneEmojiCount = settings.milestoneEmojiCount;
      }
    } else if (tplType === "announcement") {
      // Keep emojis only, strip texts
      minimal.announcements = settings.announcements?.map(a => ({ emoji: a.emoji }));
    }
    // Remove undefined keys to save bytes
    Object.keys(minimal).forEach(k => minimal[k] === undefined && delete minimal[k]);
    // Unicode-safe base64: encode UTF-8 bytes then btoa
    const json = JSON.stringify(minimal);
    const bytes = new TextEncoder().encode(json);
    const binary = Array.from(bytes, b => String.fromCharCode(b)).join("");
    const sValue = btoa(binary);

    // Build the dynamic params that users should replace
    const dynamic: Param[] = [];
    dynamic.push({ key: "key", value: "YOUR_API_KEY", label: "Your API key", dynamic: true });

    if (tplType === "metrics") {
      template.metricSlots.forEach((slot, i) => {
        const metric = settings.metrics[i];
        const val = metric ? String(metric.value) : "VALUE";
        const label = slot.customLabel || METRIC_LABELS[slot.type];
        dynamic.push({ key: `v${i + 1}`, value: val, label, dynamic: true });
      });
    } else if (tplType === "milestone") {
      const slot = template.metricSlots[0];
      if (slot) {
        const metric = settings.metrics[0];
        const val = metric ? String(metric.value) : "VALUE";
        const label = slot.customLabel || METRIC_LABELS[slot.type];
        dynamic.push({ key: "v1", value: val, label, dynamic: true });
      }
    } else if (tplType === "progress") {
      const slot = template.metricSlots[0];
      if (slot) {
        const metric = settings.metrics[0];
        const val = metric ? String(metric.value) : "VALUE";
        const label = slot.customLabel || METRIC_LABELS[slot.type];
        dynamic.push({ key: "v1", value: val, label, dynamic: true });
      }
      dynamic.push({ key: "goal", value: String(settings.goal || 0), label: "Goal", dynamic: true });
    } else if (tplType === "announcement") {
      const announcements = settings.announcements || [];
      announcements.forEach((a, i) => {
        dynamic.push({ key: `a${i + 1}`, value: a.text || "YOUR_TEXT", label: `Announcement ${i + 1} text`, dynamic: true });
        dynamic.push({ key: `e${i + 1}`, value: a.emoji || "YOUR_EMOJI", label: `Announcement ${i + 1} emoji`, dynamic: true });
      });
    }

    // Optional overrides — can be added to URL to override what's in `s`
    const fixed: Param[] = [
      { key: "bg", value: settings.background.presetId, label: "Background", randomizable: true },
      { key: "font", value: settings.font || "bricolage", label: "Font", randomizable: true },
      { key: "color", value: settings.textColor || "#ffffff", label: "Text color" },
      { key: "size", value: settings.aspectRatio || "post", label: "Aspect ratio" },
      { key: "handle", value: settings.handle || "@handle", label: "X handle (top-left)" },
      { key: "heading", value: "...", label: "Custom heading text" },
      { key: "date", value: "...", label: "Date label (top-right)" },
    ];
    if (tplType === "metrics") {
      fixed.push({ key: "layout", value: (settings.metricsLayout || "stack").replace("grid", "columns"), label: "Layout" });
    }
    if (tplType === "milestone") {
      fixed.push({ key: "emoji", value: settings.milestoneEmoji || "🎉", label: "Emoji", randomizable: true });
      fixed.push({ key: "emojiCount", value: String(settings.milestoneEmojiCount ?? 3), label: "Emoji count" });
    }
    fixed.push({ key: "branding", value: "false", label: "Hide groar.app watermark" });

    // Build URL: key + s + dynamic value overrides
    const urlParams = [
      `key=YOUR_API_KEY`,
      `s=${encodeURIComponent(sValue)}`,
      ...dynamic.filter(p => p.key !== "key").map(p => `${p.key}=${encodeURIComponent(p.value)}`),
    ];
    const fullUrl = `${baseUrl}/api/card?${urlParams.join("&")}`;

    return {
      fullUrl,
      sParam: sValue,
      dynamicParams: dynamic,
      fixedParams: fixed,
    };
  }, [template, settings]);

  const aiPrompt = useMemo(() => {
    if (!template) return "";
    return `I need to display a dynamic stats card image from 🐯 GROAR in my app.

The image is generated via this API endpoint:
${fullUrl}

The \`s\` parameter contains all design settings (background, font, colors, layout). Just keep it as-is.

Dynamic parameters (replace with your actual data):
${dynamicParams.map(p => `- ${p.key} → ${p.label}`).join("\n")}

The endpoint returns a PNG image. Display it as an <img> tag, replacing the dynamic values with data from my app.${template.templateType === "metrics" ? "\nPrefix a metric value with + to show a growth indicator (e.g. v1=+250)." : ""}`;
  }, [template, fullUrl, dynamicParams]);

  if (!template) return null;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content asChild>
              <motion.div
                className="fixed left-[50%] top-[50%] z-50 w-full max-w-xl origin-bottom px-4"
                style={{ translateX: "-50%", translateY: "-50%" }}
                initial={{ opacity: 0, y: 60, rotateX: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                exit={{ opacity: 0, y: 60, rotateX: 8, scale: 0.96 }}
                transition={{ type: "spring", damping: 28, stiffness: 350, mass: 0.8 }}
              >
                <VisuallyHidden.Root>
                  <RadixDialog.Title>API Template — {template.name}</RadixDialog.Title>
                </VisuallyHidden.Root>

                <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between p-5 pb-0">
                    <h2 className="text-lg font-heading font-bold">{template.name}</h2>
                    <RadixDialog.Close asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                        <HugeiconsIcon icon={Cancel01Icon} size={18} />
                      </button>
                    </RadixDialog.Close>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* URL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</span>
                        <CopyButton text={fullUrl} field="url" copiedField={copiedField} onCopy={copyToClipboard} />
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-xs break-all leading-relaxed select-all">
                        <span className="text-green-500 font-semibold">GET</span>{" "}
                        {dynamicParams.length > 0 && (() => {
                          const urlParts = [
                            { key: "key", value: "YOUR_API_KEY", dynamic: true },
                            { key: "s", value: sParam.length > 20 ? sParam.slice(0, 20) + "…" : sParam, dynamic: false },
                            ...dynamicParams.filter(p => p.key !== "key"),
                          ];
                          return (
                            <>
                              https://groar.app/api/card?
                              {urlParts.map((p, i) => (
                                <span key={p.key}>
                                  {i > 0 && "&"}
                                  <span className={p.dynamic ? "text-primary" : "text-muted-foreground"}>{p.key}</span>
                                  =
                                  <span className={p.dynamic ? "text-primary font-semibold" : "text-muted-foreground"}>{p.value}</span>
                                </span>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Dynamic values — the important part */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-foreground uppercase tracking-wider">Replace these values</span>
                      <div className="border border-primary/30 bg-primary/5 rounded-lg overflow-hidden divide-y divide-primary/10">
                        {dynamicParams.map((p) => (
                          <div key={p.key} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                            <code className="font-mono font-bold text-primary shrink-0 min-w-[3rem]">{p.key}</code>
                            <span className="text-foreground font-medium">{p.label}</span>
                          </div>
                        ))}
                      </div>
                      {template.templateType === "metrics" && (
                        <p className="text-[11px] text-muted-foreground">
                          Prefix with <code className="bg-muted px-1 py-0.5 rounded">+</code> for growth indicator (e.g. <code className="bg-muted px-1 py-0.5 rounded">v1=+250</code>)
                        </p>
                      )}
                    </div>

                    {/* Optional overrides */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none group/trigger">
                        <HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={2} className="transition-transform group-data-[state=open]/trigger:rotate-180" />
                        Optional overrides
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <p className="mt-1.5 mb-2 text-[11px] text-muted-foreground">
                          Add these to the URL to override the design baked into <code className="bg-muted px-1 py-0.5 rounded">s</code>.
                        </p>
                        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                          {fixedParams.map((p) => (
                            <div key={p.key} className="flex items-center gap-3 px-3 py-2 text-xs">
                              <code className="font-mono font-medium text-muted-foreground shrink-0 min-w-[3rem]">{p.key}</code>
                              <span className="text-foreground/70 flex-1">
                                {p.label}
                              </span>
                              {p.randomizable && (
                                <span className="text-muted-foreground/60 font-mono text-[10px] shrink-0">or &quot;random&quot;</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* AI Prompt */}
                    <Collapsible>
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none group/trigger">
                          <HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={2} className="transition-transform group-data-[state=open]/trigger:rotate-180" />
                          AI prompt
                        </CollapsibleTrigger>
                        <CopyButton text={aiPrompt} field="prompt" copiedField={copiedField} onCopy={copyToClipboard} />
                      </div>
                      <CollapsibleContent>
                        <div className="mt-2 bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed" style={{ overflowWrap: "anywhere" }}>
                          {aiPrompt}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

function CopyButton({ text, field, copiedField, onCopy }: {
  text: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const isCopied = copiedField === field;
  return (
    <button
      onClick={() => onCopy(text, field)}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
    >
      <HugeiconsIcon
        icon={isCopied ? Tick01Icon : Copy01Icon}
        size={12}
        strokeWidth={1.5}
        className={isCopied ? "text-green-500" : ""}
      />
      {isCopied ? "Copied" : "Copy"}
    </button>
  );
}
