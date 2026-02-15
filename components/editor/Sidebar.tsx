"use client";

import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { EditorSettings, PeriodType, MetricType, Metric, METRIC_LABELS } from "../Editor";
import { parseMetricInput } from "@/lib/metrics";
import { normalizeHandle } from "@/lib/validation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon, UserAccountIcon, Analytics01Icon, Calendar03Icon, Download04Icon, LockIcon, ImageAdd01Icon, Delete02Icon, Loading03Icon, CrownIcon, PlusSignIcon, DashboardSquare01Icon, Target01Icon } from "@hugeicons/core-free-icons";
import { TEMPLATE_LIST } from "@/lib/templates";
import { TemplateType } from "../Editor";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SidebarProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  onExport: () => void;
  isExporting: boolean;
  cooldown?: number;
  isPremium?: boolean;
};

const ALL_METRICS: MetricType[] = ["followers", "impressions", "replies", "engagementRate", "engagement", "profileVisits", "likes", "reposts", "bookmarks"];
const MAX_METRICS = 5;

type SortableMetricItemProps = {
  metric: Metric;
  onValueChange: (type: MetricType, value: number) => void;
  onRemove: (type: MetricType) => void;
  canRemove: boolean;
  canDrag: boolean;
};

function PeriodNumberInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync local state when value changes (e.g., from localStorage)
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    // If empty or invalid, reset to current value
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setInputValue(value.toString());
    }
  };

  return (
    <Input
      id="periodNumber"
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-16 text-center bg-white"
      aria-label="Period number"
    />
  );
}

const SortableMetricItem = memo(function SortableMetricItem({ metric, onValueChange, onRemove, canRemove, canDrag }: SortableMetricItemProps) {
  const [inputValue, setInputValue] = useState(metric.value.toString());

  // Sync local state when metric value changes (e.g., from localStorage)
  useEffect(() => {
    setInputValue(metric.value.toString());
  }, [metric.value]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric.type, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Parse and update the metric value
    const parsed = parseMetricInput(value, metric.type);
    if (parsed !== null) {
      onValueChange(metric.type, parsed);
      // If user typed a shortcut like "2k", replace with expanded value
      if (/[kmb]$/i.test(value)) {
        setInputValue(parsed.toString());
      }
    }
  };

  const handleBlur = () => {
    // Clean up display: remove leading zeros and commas
    const parsed = parseMetricInput(inputValue, metric.type);
    if (parsed !== null) {
      setInputValue(parsed.toString());
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        className={`touch-none ${canDrag ? "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" : "cursor-not-allowed text-muted-foreground/30"}`}
        disabled={!canDrag}
        aria-label={`Reorder ${METRIC_LABELS[metric.type]}`}
        {...attributes}
        {...listeners}
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <Input
        type="text"
        inputMode="text"
        placeholder="0"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="w-32 text-center bg-white"
        aria-label={`${METRIC_LABELS[metric.type]} value`}
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap flex-1" aria-hidden="true">
        {METRIC_LABELS[metric.type].toLowerCase()}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(metric.type)}
        disabled={!canRemove}
        className="shrink-0"
        aria-label={`Remove ${METRIC_LABELS[metric.type]}`}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
      </Button>
    </div>
  );
});

export default function Sidebar({ settings, onSettingsChange, onExport, isExporting, cooldown = 0, isPremium = false }: SidebarProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.value = "";
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load branding on mount
  useEffect(() => {
    if (isPremium) {
      fetch("/api/user/branding")
        .then((res) => res.json())
        .then((data) => {
          if (data.logoUrl && data.logoUrl !== settings.branding?.logoUrl) {
            onSettingsChange({
              ...settings,
              branding: { ...settings.branding, logoUrl: data.logoUrl, position: settings.branding?.position || "center" },
            });
          }
        })
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/user/branding", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.logoUrl) {
        onSettingsChange({
          ...settings,
          branding: { ...settings.branding, logoUrl: data.logoUrl, position: settings.branding?.position || "center" },
        });
      }
    } catch (error) {
      console.error("Logo upload error:", error);
    } finally {
      setIsUploadingLogo(false);
    }
  }, [settings, onSettingsChange]);

  const handleLogoDelete = useCallback(async () => {
    setIsDeletingLogo(true);
    try {
      await fetch("/api/user/branding", { method: "DELETE" });
      onSettingsChange({
        ...settings,
        branding: { ...settings.branding, logoUrl: undefined, position: settings.branding?.position || "center" },
      });
    } catch (error) {
      console.error("Logo delete error:", error);
    } finally {
      setIsDeletingLogo(false);
    }
  }, [settings, onSettingsChange]);

  const updateSetting = useCallback(<K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  }, [settings, onSettingsChange]);

  const addMetric = useCallback((type: MetricType) => {
    const newMetric: Metric = { type, value: 0 };
    updateSetting("metrics", [...settings.metrics, newMetric]);
  }, [updateSetting, settings.metrics]);

  const removeMetric = useCallback((type: MetricType) => {
    updateSetting("metrics", settings.metrics.filter(m => m.type !== type));
  }, [updateSetting, settings.metrics]);

  const updateMetricValue = useCallback((type: MetricType, value: number) => {
    updateSetting("metrics", settings.metrics.map(m =>
      m.type === type ? { ...m, value } : m
    ));
  }, [updateSetting, settings.metrics]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.metrics.findIndex(m => m.type === active.id);
      const newIndex = settings.metrics.findIndex(m => m.type === over.id);
      updateSetting("metrics", arrayMove(settings.metrics, oldIndex, newIndex));
    }
  }, [updateSetting, settings.metrics]);

  const availableMetrics = useMemo(() => ALL_METRICS.filter(
    type => !settings.metrics.some(m => m.type === type)
  ), [settings.metrics]);

  return (
    <aside className="w-full md:w-96 flex flex-col gap-6 p-4 border rounded-3xl bg-card min-h-full">
      {/* Template Selector */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
          Template
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {TEMPLATE_LIST.map((template) => {
            const isSelected = (settings.template || "metrics") === template.id;
            const isLocked = template.premium && !isPremium;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  if (isLocked) return;
                  updateSetting("template", template.id as TemplateType);
                }}
                disabled={isLocked}
                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-colors ${
                  isSelected
                    ? "border-primary bg-white"
                    : isLocked
                      ? "border-transparent bg-muted/20 cursor-not-allowed opacity-50"
                      : "border-transparent bg-white hover:border-muted"
                }`}
              >
                {/* Mini preview */}
                <div className={`w-full h-8 rounded-lg flex items-center justify-center ${
                  isSelected ? "bg-primary/10" : "bg-muted/50"
                }`}>
                  {template.id === "metrics" && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-5 h-1 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      <div className={`w-3 h-0.5 rounded-full ${isSelected ? "bg-primary/50" : "bg-muted-foreground/20"}`} />
                    </div>
                  )}
                  {template.id === "milestone" && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-3 h-0.5 rounded-full opacity-50 ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      <div className={`w-5 h-1 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      <div className={`w-3 h-0.5 rounded-full opacity-50 ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    </div>
                  )}
                  {template.id === "progress" && (
                    <div className="flex flex-col items-center gap-1 w-full px-2">
                      <div className={`w-full h-1.5 rounded-full ${isSelected ? "bg-primary/20" : "bg-muted-foreground/15"}`}>
                        <div className={`w-3/4 h-full rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/40"}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Label */}
                <span className={`text-[10px] font-semibold transition-colors ${
                  isSelected ? "text-primary" : isLocked ? "text-muted-foreground/50" : "text-muted-foreground"
                }`}>
                  {template.name}
                </span>

                {/* Crown badge for premium */}
                {isLocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <HugeiconsIcon icon={CrownIcon} size={10} className="text-primary" strokeWidth={2} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <HugeiconsIcon icon={UserAccountIcon} size={18} strokeWidth={1.5} aria-hidden="true" />
          Main Info
        </h3>

        <div className="flex flex-col gap-2">
          <Label htmlFor="handle">X Handle</Label>
          <Input
            id="handle"
            type="text"
            placeholder="@username"
            value={settings.handle}
            onChange={(e) => updateSetting("handle", e.target.value)}
            onBlur={(e) => updateSetting("handle", normalizeHandle(e.target.value))}
            className="bg-white"
          />
        </div>

        {/* Period - only for metrics template */}
        {(settings.template || "metrics") === "metrics" && (
          settings.period ? (
            <div className="flex flex-col gap-2">
              <Label>Period</Label>
              <div className="flex gap-2">
                <Select
                  value={settings.period.type}
                  onValueChange={(value) => updateSetting("period", { ...settings.period!, type: value as PeriodType })}
                >
                  <SelectTrigger className="flex-1 bg-white">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
                <PeriodNumberInput
                  value={settings.period.number}
                  onChange={(value) => updateSetting("period", { ...settings.period!, number: value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateSetting("period", null)}
                  className="shrink-0"
                  aria-label="Remove period"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground bg-white"
              onClick={() => updateSetting("period", { type: "week", number: 1 })}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
              Add period
            </Button>
          )
        )}
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <HugeiconsIcon icon={Analytics01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
            {(settings.template || "metrics") === "metrics" ? "Metrics" : "Metric"}
          </h3>
          {(settings.template || "metrics") === "metrics" && settings.metrics.length >= MAX_METRICS && (
            <span className="text-xs text-primary italic">
              5 max — remove to add
            </span>
          )}
        </div>

        {/* Multi-metric for "metrics" template */}
        {(settings.template || "metrics") === "metrics" ? (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={settings.metrics.map(m => m.type)}
                strategy={verticalListSortingStrategy}
              >
                {settings.metrics.map((metric) => (
                  <SortableMetricItem
                    key={metric.type}
                    metric={metric}
                    onValueChange={updateMetricValue}
                    onRemove={removeMetric}
                    canRemove={settings.metrics.length > 1}
                    canDrag={settings.metrics.length > 1}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {availableMetrics.length > 0 && (
              settings.metrics.length >= MAX_METRICS ? (
                <Button variant="outline" className="w-full justify-start text-muted-foreground bg-white" disabled>
                  <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
                  Add metric
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-muted-foreground bg-white">
                      <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
                      Add metric
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-full">
                    {availableMetrics.map((type) => (
                      <DropdownMenuItem key={type} onClick={() => addMetric(type)}>
                        {METRIC_LABELS[type]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </>
        ) : (
          /* Single metric for "milestone" and "progress" templates */
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="text"
                placeholder="0"
                value={settings.metrics[0]?.value.toString() || "0"}
                onChange={(e) => {
                  const parsed = parseMetricInput(e.target.value, settings.metrics[0]?.type || "followers");
                  if (parsed !== null) {
                    updateSetting("metrics", [{ type: settings.metrics[0]?.type || "followers", value: parsed }]);
                  }
                }}
                className="flex-1 bg-white"
                aria-label="Metric value"
              />
              <Select
                value={settings.metrics[0]?.type || "followers"}
                onValueChange={(value) => updateSetting("metrics", [{ type: value as MetricType, value: settings.metrics[0]?.value || 0 }])}
              >
                <SelectTrigger className="flex-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_METRICS.filter(type => type !== "engagementRate").map((type) => (
                    <SelectItem key={type} value={type}>
                      {METRIC_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Goal - only for progress template */}
      {(settings.template || "metrics") === "progress" && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <HugeiconsIcon icon={Target01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
            Goal
          </h3>
          <Input
            type="text"
            inputMode="text"
            placeholder="10000"
            value={settings.goal?.toString() || ""}
            onChange={(e) => {
              const parsed = parseMetricInput(e.target.value, settings.metrics[0]?.type || "followers");
              if (parsed !== null) {
                updateSetting("goal", parsed);
              }
            }}
            className="bg-white"
            aria-label="Goal value"
          />
        </div>
      )}

      {/* Branding (Premium) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <HugeiconsIcon icon={ImageAdd01Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
          Branding
          {!isPremium && (
            <HugeiconsIcon icon={LockIcon} size={14} strokeWidth={2} className="text-muted-foreground" aria-hidden="true" />
          )}
        </h3>

        {isPremium ? (
          <div className="flex flex-col gap-2">
            {settings.branding?.logoUrl ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Image
                    src={settings.branding.logoUrl}
                    alt="Your logo"
                    width={120}
                    height={40}
                    className="rounded object-contain max-h-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {(["left", "center", "right"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => updateSetting("branding", { ...settings.branding!, position: pos })}
                        className={`flex-1 py-1.5 min-h-6 text-xs rounded-lg transition-all capitalize border ${
                          (settings.branding?.position || "center") === pos
                            ? "bg-primary text-primary-foreground border-transparent"
                            : "bg-white text-muted-foreground hover:bg-muted border-border"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogoDelete}
                    disabled={isDeletingLogo}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <HugeiconsIcon
                      icon={isDeletingLogo ? Loading03Icon : Delete02Icon}
                      size={18}
                      strokeWidth={1.5}
                      className={isDeletingLogo ? "animate-spin" : ""}
                    />
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  ref={fileInputRef}
                  className="hidden"
                  disabled={isUploadingLogo}
                />
                <HugeiconsIcon
                  icon={isUploadingLogo ? Loading03Icon : ImageAdd01Icon}
                  size={20}
                  strokeWidth={1.5}
                  className={`text-muted-foreground ${isUploadingLogo ? "animate-spin" : ""}`}
                />
                <span className="text-sm text-muted-foreground">
                  {isUploadingLogo ? "Uploading..." : "Upload logo (max 500KB)"}
                </span>
              </label>
            )}
          </div>
        ) : (
          <Link
            href="/pricing"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span>Upgrade to add your logo</span>
          </Link>
        )}
      </div>

      {/* Export */}
      <div className="flex-1" />
      <Button
        onClick={onExport}
        disabled={isExporting || cooldown > 0}
        size="xl"
        className="w-full group duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      >
        <span className="relative mr-2">
          <HugeiconsIcon icon={Download04Icon} size={22} strokeWidth={2} className="transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-0 group-hover:scale-75" />
          <span className="absolute inset-0 flex items-center justify-center text-xl opacity-0 scale-75 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-[-8deg]">🐯</span>
        </span>
        {isExporting ? "Loading..." : cooldown > 0 ? `Wait ${cooldown}s` : "Get your image"}
      </Button>
    </aside>
  );
}
