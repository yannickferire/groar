"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { Dialog as RadixDialog } from "radix-ui";

type ExportRow = {
  id: number;
  createdAt: string;
  template: string | null;
  backgroundId: string | null;
  handle: string | null;
  font: string | null;
  fontResolved: boolean | null;
  isWebkit: boolean | null;
  isIos: boolean | null;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  source: string | null;
  userId: string | null;
  userName: string | null;
  imageUrl: string | null;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Tag({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "warning" | "danger" | "success" }) {
  const colors = {
    default: "bg-muted text-muted-foreground",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-red-500/10 text-red-600",
    success: "bg-emerald-500/10 text-emerald-600",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

export default function ExportsDebugPage() {
  const [exports, setExports] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/exports")
      .then((res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then((data) => setExports(data.exports || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center py-32">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Stats summary (only count rows that have device info)
  const withDeviceInfo = exports.filter((e) => e.browser !== null);
  const total = exports.length;
  const webkitCount = withDeviceInfo.filter((e) => e.isWebkit).length;
  const iosCount = withDeviceInfo.filter((e) => e.isIos).length;
  const fontNotResolved = withDeviceInfo.filter((e) => e.fontResolved === false).length;
  const dashboardCount = exports.filter((e) => e.source === "dashboard").length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/g0-ctrl">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} strokeWidth={2} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Export Debug</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last {total} exports
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-heading font-bold mt-1">{total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dashboardCount} dashboard · {total - dashboardCount} landing</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">With device info</p>
          <p className="text-2xl font-heading font-bold mt-1">{withDeviceInfo.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{total > 0 ? Math.round((withDeviceInfo.length / total) * 100) : 0}% tracked</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">WebKit (font risk)</p>
          <p className="text-2xl font-heading font-bold mt-1">{webkitCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{withDeviceInfo.length > 0 ? Math.round((webkitCount / withDeviceInfo.length) * 100) : 0}%</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">iOS</p>
          <p className="text-2xl font-heading font-bold mt-1">{iosCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{withDeviceInfo.length > 0 ? Math.round((iosCount / withDeviceInfo.length) * 100) : 0}%</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Font not resolved</p>
          <p className="text-2xl font-heading font-bold mt-1">{fontNotResolved}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{withDeviceInfo.length > 0 ? Math.round((fontNotResolved / withDeviceInfo.length) * 100) : 0}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border-fade overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-xs text-muted-foreground">
                <th className="text-left font-medium px-4 py-3 w-12">Img</th>
                <th className="text-left font-medium px-4 py-3">Date</th>
                <th className="text-left font-medium px-4 py-3">User</th>
                <th className="text-left font-medium px-4 py-3">Template</th>
                <th className="text-left font-medium px-4 py-3">Font</th>
                <th className="text-left font-medium px-4 py-3">Device</th>
                <th className="text-left font-medium px-4 py-3">Browser</th>
                <th className="text-left font-medium px-4 py-3">Flags</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((exp) => (
                <tr key={exp.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2">
                    {exp.imageUrl ? (
                      <button onClick={() => setPreviewImage(exp.imageUrl)} className="block">
                        <Image
                          src={exp.imageUrl}
                          alt="Export"
                          width={48}
                          height={48}
                          className="w-10 h-10 rounded object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs">{formatDate(exp.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate max-w-[120px]">
                        {exp.userName || exp.handle || "—"}
                      </p>
                      {exp.userName && exp.handle && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{exp.handle}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs capitalize">{exp.template || "—"}</span>
                      {exp.backgroundId && (
                        <span className="text-[10px] text-muted-foreground">{exp.backgroundId}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs">{exp.font || "—"}</span>
                      {exp.fontResolved === false && (
                        <Tag variant="danger">not resolved</Tag>
                      )}
                      {exp.fontResolved === true && (
                        <Tag variant="success">resolved</Tag>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs">{exp.os || "—"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {exp.deviceType || "—"}
                        {exp.screenWidth && exp.screenHeight && ` · ${exp.screenWidth}×${exp.screenHeight}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{exp.browser || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {exp.isIos && <Tag variant="warning">iOS</Tag>}
                      {exp.isWebkit && !exp.isIos && <Tag variant="warning">WebKit</Tag>}
                      {exp.source === "dashboard" && <Tag variant="success">Dashboard</Tag>}
                      {exp.source === "landing" && <Tag>Landing</Tag>}
                    </div>
                  </td>
                </tr>
              ))}
              {exports.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No exports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image preview dialog — no close button, click outside to dismiss */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogPortal>
          <DialogOverlay />
          <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <VisuallyHidden.Root>
              <RadixDialog.Title>Export preview</RadixDialog.Title>
            </VisuallyHidden.Root>
            {previewImage && (
              <Image
                src={previewImage}
                alt="Export preview"
                width={1200}
                height={675}
                className="w-full h-auto rounded-2xl"
              />
            )}
          </RadixDialog.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
