"use client";

import { EditorSettings } from "../Editor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SidebarProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
};

export default function Sidebar({ settings, onSettingsChange }: SidebarProps) {
  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <aside className="w-full md:w-96 flex flex-col gap-6 p-4 border rounded-xl bg-card">
      <h3 className="text-xl text-center font-semibold">Settings</h3>

      <div className="flex flex-col gap-4">
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
          <Label htmlFor="layout">Layout</Label>
          <Select
            value={settings.layout}
            onValueChange={(value) =>
              updateSetting("layout", value as EditorSettings["layout"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  );
}
