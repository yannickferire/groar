"use client";

import { EditorSettings } from "../Editor";

type PreviewProps = {
  settings: EditorSettings;
};

export default function Preview({ settings }: PreviewProps) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <div
        className="relative aspect-video rounded-xl overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: settings.backgroundColor }}
      >

        <div
          className="text-center p-8"
          style={{ color: settings.textColor }}
        >
          {settings.layout === "default" && (
            <div className="flex flex-col gap-2">
              <p className="text-4xl font-bold">12.5K</p>
              <p className="text-sm opacity-70">Followers</p>
            </div>
          )}

          {settings.layout === "minimal" && (
            <p className="text-6xl font-bold">12.5K</p>
          )}

          {settings.layout === "detailed" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-8">
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-bold">12.5K</p>
                  <p className="text-xs opacity-70">Followers</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-bold">842</p>
                  <p className="text-xs opacity-70">Following</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-bold">156</p>
                  <p className="text-xs opacity-70">Posts</p>
                </div>
              </div>
              <p className="text-sm opacity-50">@username</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
