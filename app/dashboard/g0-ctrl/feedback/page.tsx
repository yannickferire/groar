"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Bug02Icon, Idea01Icon, MessageEdit01Icon, Tick01Icon, Cancel01Icon, ArrowTurnBackwardIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type FeedbackItem = {
  id: string;
  type: "bug" | "feature" | "general";
  message: string;
  page: string | null;
  status: "open" | "resolved" | "wontfix";
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

type StatusFilter = "all" | "open" | "resolved" | "wontfix";
type TypeFilter = "all" | "bug" | "feature" | "general";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }: { type: FeedbackItem["type"] }) {
  const config = {
    bug: { label: "Bug", icon: Bug02Icon, className: "bg-red-500/10 text-red-600 border-red-500/30" },
    feature: { label: "Feature", icon: Idea01Icon, className: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
    general: { label: "Feedback", icon: MessageEdit01Icon, className: "bg-muted text-muted-foreground border-border" },
  }[type];

  return (
    <Badge className={config.className}>
      <HugeiconsIcon icon={config.icon} size={12} strokeWidth={2} />
      {config.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: FeedbackItem["status"] }) {
  const config = {
    open: { label: "Open", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    resolved: { label: "Resolved", className: "bg-green-500/10 text-green-600 border-green-500/30" },
    wontfix: { label: "Won't fix", className: "bg-muted text-muted-foreground border-border" },
  }[status];

  return <Badge className={config.className}>{config.label}</Badge>;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedback = useCallback(() => {
    fetch("/api/feedback?status=all&limit=200")
      .then((res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then((data) => setFeedback(data.feedback || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: string, status: FeedbackItem["status"]) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      );
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: feedback.length, open: 0, resolved: 0, wontfix: 0, bug: 0, feature: 0, general: 0 };
    for (const f of feedback) {
      c[f.status]++;
      c[f.type]++;
    }
    return c;
  }, [feedback]);

  const filtered = useMemo(() => {
    let list = feedback;

    if (statusFilter !== "all") {
      list = list.filter((f) => f.status === statusFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((f) => f.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.message.toLowerCase().includes(q) ||
          (f.userName && f.userName.toLowerCase().includes(q)) ||
          (f.userEmail && f.userEmail.toLowerCase().includes(q))
      );
    }

    return list;
  }, [feedback, statusFilter, typeFilter, search]);

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "open", label: `Open (${counts.open})` },
    { key: "resolved", label: `Resolved (${counts.resolved})` },
    { key: "wontfix", label: `Won't fix (${counts.wontfix})` },
  ];

  const typeFilters: { key: TypeFilter; label: string }[] = [
    { key: "all", label: "All types" },
    { key: "bug", label: `Bug (${counts.bug})` },
    { key: "feature", label: `Feature (${counts.feature})` },
    { key: "general", label: `Other (${counts.general})` },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.open} open · {counts.all} total
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/g0-ctrl">Back to Admin</Link>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by message, name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === f.key
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {typeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === f.key
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No feedback found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 ${
                item.status === "open"
                  ? "border-border bg-background"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <TypeBadge type={item.type} />
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                  </div>

                  {/* Message */}
                  <p className="text-sm whitespace-pre-wrap break-words">{item.message}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span>{item.userName || "Unknown"} ({item.userEmail})</span>
                    {item.page && <span>· {item.page}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  {item.status === "open" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={updatingId === item.id}
                        onClick={() => updateStatus(item.id, "resolved")}
                        title="Mark as resolved"
                      >
                        <HugeiconsIcon icon={Tick01Icon} size={16} strokeWidth={2} className="text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={updatingId === item.id}
                        onClick={() => updateStatus(item.id, "wontfix")}
                        title="Won't fix"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
                      </Button>
                    </>
                  )}
                  {item.status !== "open" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={updatingId === item.id}
                      onClick={() => updateStatus(item.id, "open")}
                      title="Reopen"
                    >
                      <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
