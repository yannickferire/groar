"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Key01Icon,
  Copy01Icon,
  Delete02Icon,
  Add01Icon,
  Tick01Icon,
  Redo02Icon,
  Loading03Icon,
  PencilEdit02Icon,
  Cancel01Icon,
  InformationCircleIcon,
  DashboardSquare01Icon,
  Analytics01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons";
import { Dialog as RadixDialog, VisuallyHidden } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { METRIC_LABELS, type MetricType, type TemplateType } from "@/components/editor/types";
import ApiTemplateModal from "@/components/ApiTemplateModal";
import { API_TIERS, API_TIER_ORDER, type ApiTier } from "@/lib/plans";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
};

type CardTemplate = {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/** Strip dynamic data from settings to keep the `s` param short. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function minimalSettings(tplSettings: any): string {
  const tplType = tplSettings?.template || "metrics";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m: Record<string, any> = {
    template: tplType,
    background: { presetId: tplSettings?.background?.presetId },
    textColor: tplSettings?.textColor,
    font: tplSettings?.font,
    aspectRatio: tplSettings?.aspectRatio,
    heading: tplSettings?.heading || undefined,
    textAlign: tplSettings?.textAlign !== "center" ? tplSettings?.textAlign : undefined,
    abbreviateNumbers: tplSettings?.abbreviateNumbers === false ? false : undefined,
    branding: tplSettings?.branding || undefined,
  };
  if (tplType === "metrics") {
    m.metricsLayout = tplSettings?.metricsLayout;
    m.metricSlots = (tplSettings?.metricSlots || tplSettings?.metrics || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slot: any = { type: s.type };
        if (s.customLabel) slot.customLabel = s.customLabel;
        if (s.prefix) slot.prefix = s.prefix;
        return slot;
      }
    );
  } else if (tplType === "milestone" || tplType === "progress") {
    const slots = tplSettings?.metricSlots || tplSettings?.metrics || [];
    if (slots[0]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slot: any = { type: slots[0].type };
      if (slots[0].customLabel) slot.customLabel = slots[0].customLabel;
      m.metricSlots = [slot];
    }
    if (tplType === "milestone") {
      m.milestoneEmoji = tplSettings?.milestoneEmoji;
      m.milestoneEmojiCount = tplSettings?.milestoneEmojiCount;
    }
  } else if (tplType === "announcement") {
    m.announcements = (tplSettings?.announcements || []).map((a: { emoji?: string }) => ({ emoji: a.emoji }));
  }
  Object.keys(m).forEach(k => m[k] === undefined && delete m[k]);
  // Unicode-safe base64: encode UTF-8 bytes then btoa
  const json = JSON.stringify(m);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join("");
  return btoa(binary);
}

function ApiContent() {
  // Plan & loading
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingKeyName, setEditingKeyName] = useState("");
  const [rollingKeyId, setRollingKeyId] = useState<string | null>(null);
  const rollDoneRef = useRef<string | null>(null);

  // Usage
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    graceLimit: number;
    tier: string;
    tierName: string;
    nextTier: { tier: string; name: string; limit: number; price: string } | null;
    resetDate: string;
    daily: { date: string; count: number }[];
  } | null>(null);

  // Templates
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Plans modal
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  // Docs modal
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Modal
  const [modalTemplate, setModalTemplate] = useState<{
    id: string;
    name: string;
    templateType: string;
    metricSlots: { type: MetricType; customLabel?: string }[];
    announcementSlots?: { emoji?: string }[];
  } | null>(null);
  const [modalSettings, setModalSettings] = useState<Parameters<typeof ApiTemplateModal>[0]["settings"]>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch plan + keys + templates
  useEffect(() => {
    fetch("/api/user/plan")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          const pro = data.plan === "pro" || data.plan === "friend";
          setIsPro(pro);
          if (pro) {
            Promise.all([
              fetch("/api/user/api-keys").then((r) => r.ok ? r.json() : null),
              fetch("/api/user/card-templates").then((r) => r.ok ? r.json() : null),
              fetch("/api/user/api-usage").then((r) => r.ok ? r.json() : null),
            ]).then(([keysData, tplData, usageData]) => {
              if (keysData?.keys) setApiKeys(keysData.keys);
              if (tplData?.templates) setTemplates(tplData.templates);
              if (usageData) setUsage(usageData);
            }).finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // --- API Key actions ---
  const generateKey = useCallback(async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/user/api-keys", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setApiKeys((prev) => [data.key, ...prev]);
    } catch {} finally {
      setGeneratingKey(false);
    }
  }, []);

  const revokeKey = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {}
  }, []);

  const rollKey = useCallback(async (id: string) => {
    rollDoneRef.current = null;
    setRollingKeyId(id);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, roll: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys((prev) => prev.map((k) => k.id === id ? data.key : k));
      }
    } catch {}
    rollDoneRef.current = id;
  }, []);

  const renameKey = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) { setEditingKeyId(null); return; }
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys((prev) => prev.map((k) => k.id === id ? data.key : k));
      }
    } catch {} finally {
      setEditingKeyId(null);
    }
  }, []);

  const copyKey = useCallback((key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  }, []);

  // --- Template actions ---
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/user/card-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {}
    setConfirmDeleteId(null);
  }, []);

  const renameTemplate = useCallback(async (id: string, newName: string) => {
    if (!newName.trim()) { setEditingTemplateId(null); return; }
    try {
      const res = await fetch("/api/user/card-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, name: data.template.name } : t));
      }
    } catch {}
    setEditingTemplateId(null);
  }, []);

  const copyTemplateUrl = useCallback((tpl: CardTemplate) => {
    const tplSettings = typeof tpl.settings === "string" ? JSON.parse(tpl.settings as unknown as string) : tpl.settings;
    const tplType = (tplSettings?.template || "metrics") as TemplateType;
    const slots = (tplSettings?.metricSlots || tplSettings?.metrics || []) as { type: string; customLabel?: string }[];

    const s = minimalSettings(tplSettings);
    const userKey = apiKeys[0]?.key || "YOUR_API_KEY";
    const parts = [`key=${encodeURIComponent(userKey)}`, `s=${encodeURIComponent(s)}`];

    if (tplType === "metrics") {
      slots.forEach((_: unknown, i: number) => parts.push(`v${i + 1}=${i === 0 ? "12500" : i === 1 ? "350" : "42"}`));
    } else if (tplType === "milestone") {
      if (slots.length > 0) parts.push("v1=10000");
    } else if (tplType === "progress") {
      if (slots.length > 0) parts.push("v1=750");
      parts.push(`goal=${tplSettings?.goal || 1000}`);
    } else if (tplType === "announcement") {
      const aSlots = tplSettings?.announcementSlots || tplSettings?.announcements || [];
      aSlots.forEach((_: unknown, i: number) => parts.push(`a${i + 1}=${encodeURIComponent(`Sample text ${i + 1}`)}`));
    }

    const url = `${window.location.origin}/api/card?${parts.join("&")}`;
    navigator.clipboard.writeText(url);
    setCopiedTemplateId(tpl.id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  }, [apiKeys]);

  const openTemplateModal = useCallback((tpl: CardTemplate) => {
    const tplSettings = typeof tpl.settings === "string" ? JSON.parse(tpl.settings as unknown as string) : tpl.settings;
    const tplType = (tplSettings?.template || "metrics") as TemplateType;
    const slots = (tplSettings?.metricSlots || []) as { type: MetricType; customLabel?: string }[];
    const announcementSlots = (tplSettings?.announcementSlots || []) as { emoji?: string }[];

    setModalTemplate({
      id: tpl.id,
      name: tpl.name,
      templateType: tplType,
      metricSlots: slots,
      announcementSlots,
    });

    // Build a minimal EditorSettings from the template for the modal
    const metrics = slots.map((slot) => ({
      id: crypto.randomUUID(),
      type: slot.type,
      value: 0,
      customLabel: slot.customLabel,
    }));

    setModalSettings({
      handle: tplSettings.handle || "",
      period: null,
      heading: tplSettings.heading || null,
      metrics,
      background: tplSettings.background || { presetId: "noisy-lights" },
      textColor: tplSettings.textColor || "#ffffff",
      aspectRatio: tplSettings.aspectRatio || "post",
      font: tplSettings.font || "bricolage",
      template: tplType,
      metricsLayout: tplSettings.metricsLayout || "stack",
      branding: tplSettings.branding,
      abbreviateNumbers: tplSettings.abbreviateNumbers,
      textAlign: tplSettings.textAlign,
      milestoneEmoji: tplSettings.milestoneEmoji,
      milestoneEmojiCount: tplSettings.milestoneEmojiCount,
      goal: tplSettings.goal,
      announcements: announcementSlots.map((a, i) => ({ emoji: a.emoji, text: `Text ${i + 1}` })),
    });

    setShowModal(true);
  }, []);

  const buildPreviewUrl = useCallback((tpl: CardTemplate) => {
    if (apiKeys.length === 0) return null;
    const key = apiKeys[0].key;
    const tplSettings = typeof tpl.settings === "string" ? JSON.parse(tpl.settings as unknown as string) : tpl.settings;
    const tplType = (tplSettings?.template || "metrics") as TemplateType;
    const slots = (tplSettings?.metricSlots || []) as { type: string }[];

    const s = minimalSettings(tplSettings);
    const parts = [`key=${encodeURIComponent(key)}`, `s=${encodeURIComponent(s)}`];

    // Templates store types only (no values) — use sample values for preview
    if (tplType === "metrics") {
      slots.forEach((_: unknown, i: number) => parts.push(`v${i + 1}=${i === 0 ? "12500" : i === 1 ? "350" : "42"}`));
    } else if (tplType === "milestone") {
      if (slots.length > 0) parts.push("v1=10000");
    } else if (tplType === "progress") {
      if (slots.length > 0) parts.push("v1=750");
      parts.push(`goal=${tplSettings?.goal || 1000}`);
    } else if (tplType === "announcement") {
      const announcementSlots = (tplSettings?.announcementSlots || []) as { emoji?: string }[];
      announcementSlots.forEach((_: unknown, i: number) => parts.push(`a${i + 1}=${encodeURIComponent(`Sample text ${i + 1}`)}`));
    }

    return `/api/card?${parts.join("&")}`;
  }, [apiKeys]);

  const handleApiTierCheckout = useCallback(async (tier: "growth" | "scale") => {
    setCheckoutLoading(tier);
    try {
      // If user is already on Growth and wants Scale, use upgrade endpoint
      if (usage?.tier === "growth" && tier === "scale") {
        const res = await fetch("/api/billing/upgrade-api-tier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "scale" }),
        });
        const data = await res.json();
        if (data.success) {
          // Refresh usage data to reflect the new tier
          const usageRes = await fetch("/api/user/api-usage");
          if (usageRes.ok) setUsage(await usageRes.json());
          setShowPlansModal(false);
        }
      } else {
        // New checkout (Free → Growth or Free → Scale)
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiTier: tier }),
        });
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch {
      // silently fail
    } finally {
      setCheckoutLoading(null);
    }
  }, [usage?.tier]);

  const handleManageApiSubscription = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "api" }),
      });
      const data = await res.json();
      if (data.portalUrl) {
        window.open(data.portalUrl, "_blank");
      } else if (data.error) {
        // Fallback: open Creem support page
        window.open("mailto:yannick@groar.app?subject=API%20subscription%20management", "_blank");
      }
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const getTemplateTypeLabel = (tpl: CardTemplate) => {
    const s = typeof tpl.settings === "string" ? JSON.parse(tpl.settings as unknown as string) : tpl.settings;
    const t = (s?.template || "metrics") as TemplateType;
    return { metrics: "Metrics", milestone: "Milestone", progress: "Progress", announcement: "Announcement" }[t] || t;
  };

  const getTemplateSlotsLabel = (tpl: CardTemplate) => {
    const s = typeof tpl.settings === "string" ? JSON.parse(tpl.settings as unknown as string) : tpl.settings;
    const t = (s?.template || "metrics") as TemplateType;
    const slots = (s?.metricSlots || []) as { type: string; customLabel?: string }[];

    if (t === "metrics") {
      return slots.map(sl => sl.customLabel || METRIC_LABELS[sl.type as MetricType] || sl.type).join(", ");
    } else if (t === "milestone" || t === "progress") {
      const label = slots[0]?.customLabel || METRIC_LABELS[slots[0]?.type as MetricType] || "Value";
      return t === "progress" ? `${label} + Goal` : label;
    } else if (t === "announcement") {
      const count = (s?.announcementSlots || []).length;
      return `${count} announcement${count !== 1 ? "s" : ""}`;
    }
    return "";
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto flex items-center justify-center py-32">
        <div className="space-y-6 max-w-md text-center">
          <p className="text-8xl">🐯</p>
          <p className="text-xl text-muted-foreground">Sharpening the claws...</p>
          <div className="flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-heading font-bold">API</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate dynamic card images via API.
          </p>
        </div>
        <div className="mt-10 text-center py-16 rounded-2xl border-fade">
          <HugeiconsIcon icon={Key01Icon} size={32} strokeWidth={1.5} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">The API is available on Pro plans.</p>
          <Button asChild variant="default">
            <a href="/dashboard/plan#plans">Upgrade to Pro</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">API</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate dynamic card images via API.<br />
          Design a template in the editor, save it, then pass your metrics as URL parameters.
        </p>
      </div>

      <div className="space-y-6">

      {/* API Keys & Usage */}
      <section className="rounded-2xl border-fade p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Key01Icon} size={20} strokeWidth={2} />
            <h2 className="text-lg font-heading font-semibold">API Keys</h2>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={generateKey}
            disabled={generatingKey || apiKeys.length >= 1}
            className="h-8 px-3 text-xs gap-1.5"
          >
            {generatingKey ? (
              <HugeiconsIcon icon={Loading03Icon} size={14} strokeWidth={2} className="animate-spin" />
            ) : (
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            )}
            Generate key
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Use your API key to authenticate requests. 30 requests/minute per key.
        </p>

        {apiKeys.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            No API keys yet. Generate one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-3 rounded-xl bg-sidebar space-y-2">
                <div className="flex items-center">
                  <Input
                    value={editingKeyId === apiKey.id ? editingKeyName : apiKey.name}
                    onChange={(e) => { setEditingKeyId(apiKey.id); setEditingKeyName(e.target.value); }}
                    onFocus={() => { setEditingKeyId(apiKey.id); setEditingKeyName(apiKey.name); }}
                    onBlur={() => { if (editingKeyId === apiKey.id) renameKey(apiKey.id, editingKeyName); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") { setEditingKeyId(null); e.currentTarget.blur(); }
                    }}
                    className="h-7 text-xs font-medium w-40 shrink-0"
                    maxLength={50}
                    placeholder="Key name"
                  />
                  <code className="text-xs font-mono text-muted-foreground flex-1 text-center truncate px-2">
                    {apiKey.key.slice(0, 18)}...{apiKey.key.slice(-8)}
                  </code>
                  <div className="flex items-center shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => copyKey(apiKey.key, apiKey.id)} className="h-7 w-7 p-0 opacity-70 hover:opacity-100" title="Copy key">
                      {copiedKeyId === apiKey.id ? (
                        <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={2} className="text-green-500" />
                      ) : (
                        <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={2} className="text-muted-foreground" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => rollKey(apiKey.id)} disabled={rollingKeyId === apiKey.id} className="h-7 w-7 p-0 opacity-70 hover:opacity-100" title="Roll key">
                      <span
                        className={rollingKeyId === apiKey.id ? "animate-spin" : ""}
                        onAnimationIteration={() => {
                          if (rollDoneRef.current === apiKey.id) {
                            rollDoneRef.current = null;
                            setRollingKeyId(null);
                          }
                        }}
                      >
                        <HugeiconsIcon icon={Redo02Icon} size={14} strokeWidth={2} className="text-muted-foreground" />
                      </span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => revokeKey(apiKey.id)} className="h-7 w-7 p-0 opacity-70 hover:opacity-100" title="Delete key">
                      <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} className="text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                  {apiKey.lastUsedAt && (
                    <>
                      <span>·</span>
                      <span>Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{(apiKey.requestCount ?? 0).toLocaleString()} requests</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Usage */}
        {usage && (() => {
          const pct = usage.used / usage.limit;
          const gracePct = usage.used / usage.graceLimit;
          const now = new Date();
          const dayOfMonth = now.getDate();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const remainingDays = daysInMonth - dayOfMonth;
          // Days since first usage, not since start of month
          const firstUsageDay = usage.daily.length > 0
            ? new Date(usage.daily[0].date).getUTCDate()
            : dayOfMonth;
          const activeDays = Math.max(dayOfMonth - firstUsageDay + 1, 1);
          const dailyAvg = usage.used / activeDays;
          const projected = Math.round(usage.used + dailyAvg * remainingDays);
          const projectedPct = projected / usage.limit;

          const status = gracePct >= 1
            ? { text: "Paused", color: "text-destructive", icon: AlertDiamondIcon }
            : pct >= 1
            ? { text: "Grace period", color: "text-destructive", icon: AlertDiamondIcon }
            : pct >= 0.8
            ? { text: "Almost at limit", color: "text-orange-500", icon: Alert02Icon }
            : projectedPct >= 1.5
            ? { text: "On track to exceed", color: "text-orange-500", icon: Alert02Icon }
            : { text: "All good", color: "text-green-500", icon: CheckmarkCircle02Icon };

          return (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 mt-2">
                <HugeiconsIcon icon={Analytics01Icon} size={16} strokeWidth={2} />
                <h3 className="text-sm font-heading font-semibold">Usage</h3>
                <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted uppercase">{usage.tierName}</span>
                <span className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
                  <HugeiconsIcon icon={status.icon} size={14} strokeWidth={2} />
                  {status.text}
                </span>
                <span className="ml-auto flex items-center gap-3">
                  {usage.tier !== "free" && (
                    <button
                      type="button"
                      onClick={handleManageApiSubscription}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline hover:no-underline"
                    >
                      Manage subscription
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPlansModal(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline hover:no-underline"
                  >
                    See plans
                  </button>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{usage.used.toLocaleString()} req</span> / {usage.limit.toLocaleString()}
                    </span>
                    {usage.used > 0 && remainingDays > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ~{projected.toLocaleString()} projected
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Resets {new Date(usage.resetDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                  {/* Projected bar (behind) */}
                  {usage.used > 0 && remainingDays > 0 && projected > usage.used && (
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        projectedPct > 1 ? "bg-orange-500/20" : "bg-primary/20"
                      }`}
                      style={{ width: `${Math.min(projectedPct * 100, 100)}%` }}
                    />
                  )}
                  {/* Actual bar (front) */}
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      pct > 1 ? "bg-destructive" :
                      pct > 0.8 ? "bg-orange-500" :
                      "bg-primary"
                    }`}
                    style={{ width: `${Math.min(pct * 100, 100)}%` }}
                  />
                </div>
                {/* Grace limit exceeded — API paused */}
                {gracePct >= 1 && usage.nextTier && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={AlertDiamondIcon} size={12} strokeWidth={2} />
                    API paused — grace buffer exceeded.{" "}
                    <button type="button" onClick={() => setShowPlansModal(true)} className="underline hover:no-underline cursor-pointer">Upgrade to {usage.nextTier.name} ({usage.nextTier.price})</button> to resume.
                  </p>
                )}
                {gracePct >= 1 && !usage.nextTier && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={AlertDiamondIcon} size={12} strokeWidth={2} />
                    API paused — grace buffer exceeded. Contact us for a custom plan.
                  </p>
                )}
                {/* 100% reached but still in grace buffer */}
                {pct >= 1 && gracePct < 1 && usage.nextTier && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={AlertDiamondIcon} size={12} strokeWidth={2} />
                    Limit reached — you have a 20% grace buffer before the API pauses.{" "}
                    <button type="button" onClick={() => setShowPlansModal(true)} className="underline hover:no-underline cursor-pointer">Upgrade to {usage.nextTier.name} ({usage.nextTier.price})</button>
                  </p>
                )}
                {/* 80%+ reached */}
                {pct >= 0.8 && pct < 1 && usage.nextTier && (
                  <p className="text-xs text-orange-500 font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={Alert02Icon} size={12} strokeWidth={2} />
                    You&apos;ve used {Math.round(pct * 100)}% of your quota.{" "}
                    <button type="button" onClick={() => setShowPlansModal(true)} className="underline hover:no-underline cursor-pointer">Upgrade to {usage.nextTier.name} ({usage.nextTier.price})</button> to avoid interruption.
                  </p>
                )}
                {/* Projected to exceed by 150%+ */}
                {pct < 0.8 && projectedPct >= 1.5 && usage.nextTier && (
                  <p className="text-xs text-orange-500 font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={Alert02Icon} size={12} strokeWidth={2} />
                    At this pace you&apos;ll exceed your limit.{" "}
                    <button type="button" onClick={() => setShowPlansModal(true)} className="underline hover:no-underline cursor-pointer">Consider upgrading to {usage.nextTier.name} ({usage.nextTier.price})</button>.
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Templates */}
      <section className="rounded-2xl border-fade p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={DashboardSquare01Icon} size={20} strokeWidth={2} />
            <h2 className="text-lg font-heading font-semibold">Templates</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDocsModal(true)}
            className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={InformationCircleIcon} size={14} strokeWidth={2} />
            How it works
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Templates store your visual design (background, font, colors, layout). Save one from the editor, then pass only your dynamic values via API. Previews use sample data.
        </p>

        {templates.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 space-y-3">
            <p>No templates yet.</p>
            <Button asChild variant="outline" size="sm">
              <a href="/dashboard/editor">Create one in the editor</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tpl) => (
              <div key={tpl.id} className="group p-4 rounded-xl bg-sidebar">
                <div className="flex gap-4">
                  {/* Preview thumbnail */}
                  {(() => {
                    const url = buildPreviewUrl(tpl);
                    if (!url) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(url)}
                        className="shrink-0 w-28 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`Preview of ${tpl.name}`}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </button>
                    );
                  })()}

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Name + ID */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {editingTemplateId === tpl.id ? (
                          <input
                            autoFocus
                            value={editingTemplateName}
                            onChange={(e) => setEditingTemplateName(e.target.value)}
                            onBlur={() => renameTemplate(tpl.id, editingTemplateName)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                              if (e.key === "Escape") setEditingTemplateId(null);
                            }}
                            className="text-sm font-medium bg-transparent border-b border-primary outline-none w-full"
                            maxLength={50}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{tpl.name}</span>
                            <code className="font-mono text-[10px] text-muted-foreground/50">{tpl.id}</code>
                            <button
                              type="button"
                              onClick={() => { setEditingTemplateId(tpl.id); setEditingTemplateName(tpl.name); }}
                              className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                              title="Rename"
                            >
                              <HugeiconsIcon icon={PencilEdit02Icon} size={12} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openTemplateModal(tpl)}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          title="View API details"
                        >
                          <HugeiconsIcon icon={InformationCircleIcon} size={14} strokeWidth={2} />
                          <span className="hidden sm:inline">Details</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyTemplateUrl(tpl)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Copy API URL"
                        >
                          {copiedTemplateId === tpl.id ? (
                            <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={2} className="text-green-500" />
                          ) : (
                            <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={2} />
                          )}
                        </Button>
                        {confirmDeleteId === tpl.id ? (
                          <span className="flex items-center gap-1.5 text-xs px-2">
                            <span className="text-destructive">Delete?</span>
                            <button type="button" onClick={() => deleteTemplate(tpl.id)} className="font-semibold text-destructive hover:underline">Yes</button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-muted-foreground hover:underline">No</button>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(tpl.id)}
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            title="Delete template"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium uppercase">{getTemplateTypeLabel(tpl)}</span>
                      <span>{getTemplateSlotsLabel(tpl)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      </div>
      {/* ── End single column ── */}

      {/* How it works modal */}
      <RadixDialog.Root open={showDocsModal} onOpenChange={setShowDocsModal}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl bg-background border border-border p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <RadixDialog.Title className="text-lg font-heading font-semibold">How it works</RadixDialog.Title>
              <RadixDialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
              </RadixDialog.Close>
            </div>

            <div className="space-y-4 text-sm">
              <div className="text-muted-foreground text-xs space-y-3">
                <p>
                  <span className="text-foreground font-medium">1. Design your card</span> in the editor and save it as an API template.
                </p>
                <p>
                  <span className="text-foreground font-medium">2. Copy the URL</span> from your template above — it contains all your design settings.
                </p>
                <p>
                  <span className="text-foreground font-medium">3. Replace the dynamic values</span> (<code className="bg-muted px-1 py-0.5 rounded">v1</code>, <code className="bg-muted px-1 py-0.5 rounded">v2</code>...) with your actual data. The API returns a PNG image.
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-xs break-all leading-relaxed">
                <span className="text-green-500">GET</span>{" "}https://groar.app/api/card?key=YOUR_API_KEY&s=...&<span className="text-primary font-semibold">v1=12500</span>&<span className="text-primary font-semibold">v2=350</span>
              </div>

              <div className="text-muted-foreground text-xs space-y-1">
                <p>Returns a <strong className="text-foreground">PNG image</strong>. Use it as an <code className="bg-muted px-1 py-0.5 rounded">&lt;img src=&quot;...&quot;&gt;</code> — the image updates every time you call it with new values.</p>
                <p>Rate limit: <strong className="text-foreground">30 requests/minute</strong> per API key.</p>
              </div>

              {/* Dynamic params */}
              <div className="space-y-2">
                <h3 className="font-medium text-xs">Dynamic parameters</h3>
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border text-xs">
                  <ParamRow name="key" required desc="Your API key" />
                  <ParamRow name="s" required desc="Encoded design settings — don't modify, just keep it as-is from your template URL" />
                  <ParamRow name="v1, v2..." desc="Metric values — prefix with + for growth indicator (e.g. v1=+250)" />
                  <ParamRow name="goal" desc="Goal value (progress template only)" />
                  <ParamRow name="a1, a2..." desc="Announcement texts (announcement template only)" />
                  <ParamRow name="e1, e2..." desc="Announcement emojis (announcement template only)" />
                </div>
              </div>

              {/* Overrides */}
              <div className="space-y-2">
                <h3 className="font-medium text-xs">Optional overrides</h3>
                <p className="text-muted-foreground text-xs">
                  Override any visual setting per-request. Use <code className="bg-muted px-1 py-0.5 rounded">bg=random</code>, <code className="bg-muted px-1 py-0.5 rounded">font=random</code>, or <code className="bg-muted px-1 py-0.5 rounded">emoji=random</code> for variety.
                </p>
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border text-xs">
                  <ParamRow name="bg" desc="Background preset ID | &quot;random&quot;" />
                  <ParamRow name="font" desc="bricolage | inter | space-grotesk | dm-mono | averia-serif-libre | dm-serif-display | random" />
                  <ParamRow name="color" desc="Hex color — e.g. %23ffffff | %231a1a1a" />
                  <ParamRow name="size" desc="post | square | banner" />
                  <ParamRow name="heading" desc="Custom heading text" />
                  <ParamRow name="handle" desc="Display name shown top-left — e.g. @username" />
                  <ParamRow name="date" desc="Date label shown top-right — e.g. March 2026" />
                  <ParamRow name="layout" desc="stack | columns (metrics template only)" />
                  <ParamRow name="emoji" desc="Emoji character | random (milestone template only)" />
                  <ParamRow name="branding" desc="true | false — show or hide your logo" />
                  {usage && usage.tier !== "free" && (
                    <ParamRow name="watermark" desc="true | false — add the groar.app watermark (off by default)" />
                  )}
                </div>
              </div>
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      {/* API Plans modal */}
      <RadixDialog.Root open={showPlansModal} onOpenChange={setShowPlansModal}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl bg-background border border-border p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <RadixDialog.Title className="text-xl font-heading font-semibold">API Plans</RadixDialog.Title>
              <RadixDialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
              </RadixDialog.Close>
            </div>

            <p className="text-base text-muted-foreground">
              Need more requests or want to remove the watermark? Upgrade your API plan.
            </p>

            <div className="space-y-3">
              {API_TIER_ORDER.filter(t => t !== "free").map((tierKey) => {
                const tier = API_TIERS[tierKey];
                const isCurrent = usage?.tier === tierKey;
                const isNextTier = usage?.nextTier?.tier === tierKey;
                const isEnterprise = tierKey === "enterprise";
                const features: string[] = tierKey === "growth"
                  ? ["5,000 requests/month", "No watermark", "30 req/min rate limit"]
                  : tierKey === "scale"
                  ? ["Everything in Growth", "50,000 requests/month", "50 req/min rate limit", "Priority support"]
                  : ["Let's talk about it"];

                return (
                  <div
                    key={tierKey}
                    className={`relative p-4 rounded-xl ${
                      isCurrent
                        ? "bg-foreground text-background"
                        : isNextTier
                        ? "bg-sidebar ring-2 ring-primary"
                        : "bg-sidebar"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-heading font-bold">{tier.name}</h3>
                          {isEnterprise ? (
                            <span className={`text-sm ${isCurrent ? "text-background/60" : "text-muted-foreground"}`}>Custom pricing</span>
                          ) : (
                            <span className="flex items-baseline gap-0.5">
                              <span className="text-base font-heading font-extrabold">${tier.priceValue}</span>
                              <span className={`text-xs ${isCurrent ? "text-background/60" : "text-muted-foreground"}`}>/mo</span>
                            </span>
                          )}
                          {isCurrent && (
                            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <ul className={`mt-2 space-y-1.5 text-sm ${isCurrent ? "text-background/70" : "text-muted-foreground"}`}>
                          {features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5">
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} className={isCurrent ? "text-background/50" : "text-primary"} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="shrink-0">
                        {isEnterprise ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-sm"
                            asChild
                          >
                            <a href="mailto:yannick@groar.app?subject=Enterprise%20API%20plan">Contact us</a>
                          </Button>
                        ) : isCurrent ? (
                          <Button
                            variant="defaultReverse"
                            size="sm"
                            className="text-sm"
                            disabled
                          >
                            Current plan
                          </Button>
                        ) : (
                          <Button
                            variant={isNextTier ? "default" : "outline"}
                            size="sm"
                            className="text-sm"
                            disabled={checkoutLoading === tierKey}
                            onClick={() => handleApiTierCheckout(tierKey as "growth" | "scale")}
                          >
                            {checkoutLoading === tierKey ? (
                              <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                            ) : usage?.tier === "growth" && tierKey === "scale" ? (
                              "Upgrade to Scale"
                            ) : (
                              `Upgrade — ${tier.price}`
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {usage && usage.tier !== "free" && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-muted-foreground"
                  disabled={portalLoading}
                  onClick={handleManageApiSubscription}
                >
                  {portalLoading ? (
                    <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                  ) : (
                    "Manage subscription"
                  )}
                </Button>
              </div>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      {/* Preview lightbox */}
      <RadixDialog.Root open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <RadixDialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-8" onClick={() => setPreviewUrl(null)}>
            <VisuallyHidden.Root><RadixDialog.Title>Template preview</RadixDialog.Title></VisuallyHidden.Root>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Template preview"
                className="max-w-[600px] max-h-full rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      {/* Template modal */}
      <ApiTemplateModal
        open={showModal}
        onOpenChange={setShowModal}
        template={modalTemplate}
        settings={modalSettings}
      />
    </div>
  );
}

function ParamRow({ name, desc, required }: { name: string; desc: string; required?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <code className="font-mono font-medium text-foreground shrink-0 min-w-[5rem]">
        {name}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </code>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}

export default function ApiPage() {
  return (
    <Suspense>
      <ApiContent />
    </Suspense>
  );
}
