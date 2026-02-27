"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification03Icon,
  CheckmarkCircle02Icon,
  SparklesIcon,
  UserLove01Icon,
  News01Icon,
  Download04Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type Notification = {
  id: string;
  type: "milestone" | "badge" | "system";
  title: string;
  body: string | null;
  metadata: {
    metric?: "followers" | "posts";
    value?: number;
    milestone?: number;
    handle?: string;
    badgeId?: string;
    badgeName?: string;
    badgeEmoji?: string;
  };
  read: boolean;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildEditorUrl(metadata: Notification["metadata"]): string {
  if (!metadata.milestone) return "/dashboard/editor";
  const params = new URLSearchParams({
    template: "milestone",
    metric: metadata.metric || "followers",
    value: metadata.milestone.toString(),
  });
  return `/dashboard/editor?${params.toString()}`;
}

function NotificationCard({
  notification,
  onMarkRead,
  isFirst,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isFirst: boolean;
}) {
  const isMilestone = notification.type === "milestone";
  const isBadge = notification.type === "badge";
  const isFollowers = notification.metadata.metric === "followers";
  const isExports = notification.metadata.metric === "exports";

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors cursor-pointer ${
        notification.read
          ? "border-border/50 bg-background"
          : "border-primary/20 bg-primary/5"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`shrink-0 p-2.5 rounded-xl ${
            isMilestone
              ? "bg-primary/10 text-primary"
              : isBadge
                ? "bg-amber-100 text-amber-600"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {isBadge && notification.metadata.badgeEmoji ? (
            <span className="text-xl leading-none">{notification.metadata.badgeEmoji}</span>
          ) : (
            <HugeiconsIcon
              icon={isExports ? Download04Icon : isFollowers ? UserLove01Icon : News01Icon}
              size={22}
              strokeWidth={2}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-base">
              {notification.title}
            </h3>
            {!notification.read && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-red-400/90" />
            )}
          </div>
          {notification.body && (
            <p className="text-sm text-muted-foreground mb-3">
              {notification.body}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isMilestone && notification.metadata.milestone && (
              <Button
                asChild
                size="sm"
                variant={isFirst ? "default" : "outline"}
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={buildEditorUrl(notification.metadata)}>
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    size={14}
                    strokeWidth={2}
                  />
                  Import in editor
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <span className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
          {timeAgo(notification.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update sidebar badge via custom event
      window.dispatchEvent(new CustomEvent("groar:notification-read"));

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    []
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // Update sidebar badge via custom event
    window.dispatchEvent(new CustomEvent("groar:notifications-all-read"));

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
                <Skeleton className="h-8 w-36 mt-2" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Notifications</h1>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            <HugeiconsIcon icon={Settings01Icon} size={14} strokeWidth={2} />
            Notification settings
          </Link>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={14}
              strokeWidth={2}
            />
            Mark all read
          </Button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-2xl bg-muted mb-4">
            <HugeiconsIcon
              icon={Notification03Icon}
              size={32}
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
          </div>
          <h2 className="font-heading font-bold text-lg mb-2">
            No notifications yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            When you hit a follower milestone or earn a badge, you&apos;ll see it
            here with a ready-to-share visual.
          </p>
        </div>
      )}

      {/* Notification list */}
      <div className="space-y-3">
        {notifications.map((notification, index) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkRead={markRead}
            isFirst={index === 0}
          />
        ))}
      </div>

    </div>
  );
}
