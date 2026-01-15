"use client";

import { useState } from "react";
import { EditorSettings, PeriodType, MetricType, Metric, METRIC_LABELS } from "../Editor";
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
import { GripVertical, Plus, X } from "lucide-react";
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
};

const ALL_METRICS: MetricType[] = ["followers", "impressions", "replies", "engagementRate"];

type SortableMetricItemProps = {
  metric: Metric;
  onValueChange: (type: MetricType, value: number) => void;
  onRemove: (type: MetricType) => void;
  canRemove: boolean;
  canDrag: boolean;
};

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
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        type="text"
        inputMode="text"
        placeholder="0"
        value={inputValue}
        onChange={handleInputChange}
        className="w-32 text-center"
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap flex-1">
        {METRIC_LABELS[metric.type].toLowerCase()}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(metric.type)}
        disabled={!canRemove}
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Sidebar({ settings, onSettingsChange }: SidebarProps) {
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
    <aside className="w-full md:w-96 flex flex-col gap-6 p-4 border rounded-xl bg-card">
      {/* Main Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Main Info</h3>

        <div className="flex flex-col gap-2">
          <Label htmlFor="handle">X Handle</Label>
          <Input
            id="handle"
            type="text"
            placeholder="@username"
            value={settings.handle}
            onChange={(e) => updateSetting("handle", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Period</Label>
          <div className="flex gap-2">
            <Select
              value={settings.periodType}
              onValueChange={(value) => updateSetting("periodType", value as PeriodType)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="periodNumber"
              type="text"
              inputMode="numeric"
              value={settings.periodNumber}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                updateSetting("periodNumber", isNaN(parsed) ? 1 : Math.max(1, parsed));
              }}
              className="w-16 text-center"
            />
          </div>
        </div>

      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Metrics</h3>

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
              <Button variant="outline" className="w-full justify-start text-muted-foreground">
                <Plus className="h-4 w-4 mr-2" />
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
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Style</h3>

        <div className="flex flex-col gap-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => updateSetting("backgroundColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={settings.backgroundColor}
              onChange={(e) => updateSetting("backgroundColor", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="textColor">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              type="color"
              value={settings.textColor}
              onChange={(e) => updateSetting("textColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={settings.textColor}
              onChange={(e) => updateSetting("textColor", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="accentColor">Accent Color</Label>
          <div className="flex gap-2">
            <Input
              id="accentColor"
              type="color"
              value={settings.accentColor}
              onChange={(e) => updateSetting("accentColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={settings.accentColor}
              onChange={(e) => updateSetting("accentColor", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
