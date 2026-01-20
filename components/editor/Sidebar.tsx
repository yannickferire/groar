"use client";

import { useState } from "react";
import Image from "next/image";
import { EditorSettings, PeriodType, MetricType, Metric, METRIC_LABELS, BackgroundPreset } from "../Editor";
import { parseMetricInput } from "@/lib/metrics";
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
import { Menu01Icon, Cancel01Icon, UserAccountIcon, Analytics01Icon, PaintBrush01Icon, Calendar03Icon, ChartLineData02Icon, Download04Icon } from "@hugeicons/core-free-icons";
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
  backgrounds: BackgroundPreset[];
  onExport: () => void;
  isExporting: boolean;
};

const ALL_METRICS: MetricType[] = ["followers", "impressions", "replies", "engagementRate"];

type SortableMetricItemProps = {
  metric: Metric;
  onValueChange: (type: MetricType, value: number) => void;
  onRemove: (type: MetricType) => void;
  canRemove: boolean;
  canDrag: boolean;
};

function PeriodNumberInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [inputValue, setInputValue] = useState(value.toString());

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
    />
  );
}

function SortableMetricItem({ metric, onValueChange, onRemove, canRemove, canDrag }: SortableMetricItemProps) {
  const [inputValue, setInputValue] = useState(metric.value.toString());

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
        {...attributes}
        {...listeners}
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.5} />
      </button>
      <Input
        type="text"
        inputMode="text"
        placeholder="0"
        value={inputValue}
        onChange={handleInputChange}
        className="w-32 text-center bg-white"
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap flex-1">
        {METRIC_LABELS[metric.type].toLowerCase()}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(metric.type)}
        disabled={!canRemove}
        className="shrink-0"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
      </Button>
    </div>
  );
}

export default function Sidebar({ settings, onSettingsChange, backgrounds, onExport, isExporting }: SidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
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

  const addMetric = (type: MetricType) => {
    const newMetric: Metric = { type, value: 0 };
    updateSetting("metrics", [...settings.metrics, newMetric]);
  };

  const removeMetric = (type: MetricType) => {
    updateSetting("metrics", settings.metrics.filter(m => m.type !== type));
  };

  const updateMetricValue = (type: MetricType, value: number) => {
    updateSetting("metrics", settings.metrics.map(m =>
      m.type === type ? { ...m, value } : m
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.metrics.findIndex(m => m.type === active.id);
      const newIndex = settings.metrics.findIndex(m => m.type === over.id);
      updateSetting("metrics", arrayMove(settings.metrics, oldIndex, newIndex));
    }
  };

  const availableMetrics = ALL_METRICS.filter(
    type => !settings.metrics.some(m => m.type === type)
  );

  return (
    <aside className="w-full md:w-96 flex flex-col gap-6 p-4 border rounded-xl bg-card min-h-full">
      {/* Main Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <HugeiconsIcon icon={UserAccountIcon} size={18} strokeWidth={1.5} />
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
            className="bg-white"
          />
        </div>

        {settings.period ? (
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
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground bg-white"
            onClick={() => updateSetting("period", { type: "week", number: 1 })}
          >
            <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={1.5} className="mr-2" />
            Add period
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <HugeiconsIcon icon={Analytics01Icon} size={18} strokeWidth={1.5} />
          Metrics
        </h3>

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-muted-foreground bg-white">
                <HugeiconsIcon icon={ChartLineData02Icon} size={18} strokeWidth={1.5} className="mr-2" />
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
        )}
      </div>

      {/* Style */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <HugeiconsIcon icon={PaintBrush01Icon} size={18} strokeWidth={1.5} />
          Style
        </h3>

        <div className="flex flex-col gap-2">
          <Label>Background</Label>
          <div className="grid grid-cols-4 gap-2">
            {backgrounds.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={`aspect-video rounded-md overflow-hidden border transition-all relative ${
                  settings.background.presetId === preset.id
                    ? "ring-2 ring-foreground/50 ring-offset-2 ring-offset-background"
                    : "border-border hover:ring-1 hover:ring-foreground/20"
                }`}
                title={preset.name}
              >
                {preset.color ? (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: settings.background.solidColor || preset.color }}
                  />
                ) : preset.image ? (
                  <Image
                    src={preset.image}
                    alt={preset.name}
                    width={80}
                    height={45}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </button>
            ))}
          </div>
          {settings.background.presetId === "solid-color" && (
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.background.solidColor || "#f59e0b"}
                onChange={(e) => updateSolidColor(e.target.value)}
                className="w-9 h-9 p-0 cursor-pointer border-input overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
              />
              <Input
                type="text"
                value={settings.background.solidColor || "#f59e0b"}
                onChange={(e) => updateSolidColor(e.target.value)}
                className="flex-1 bg-white"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="textColor">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              type="color"
              value={settings.textColor}
              onChange={(e) => updateSetting("textColor", e.target.value)}
              className="w-9 h-9 p-0 cursor-pointer border-input overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
            />
            <Input
              type="text"
              value={settings.textColor}
              onChange={(e) => updateSetting("textColor", e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="flex-1" />
      <Button
        onClick={onExport}
        disabled={isExporting}
        size="xl"
        className="w-full group duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      >
        <span className="relative mr-2">
          <HugeiconsIcon icon={Download04Icon} size={22} strokeWidth={2} className="transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-0 group-hover:scale-75" />
          <span className="absolute inset-0 flex items-center justify-center text-xl opacity-0 scale-75 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-[-8deg]">🐯</span>
        </span>
        {isExporting ? "Loading..." : "Get your image"}
      </Button>
    </aside>
  );
}
