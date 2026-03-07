"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { RankingIcon, Fire02Icon, Download04Icon } from "@hugeicons/core-free-icons";
import XIcon from "@/components/icons/XIcon";

export type LeaderboardEntry = {
  name: string;
  image: string | null;
  xUsername: string | null;
  startupName: string | null;
  startupWebsite: string | null;
  exportsCount: number;
  currentStreak: number;
  score: number;
  pointsToday: number;
  id?: string;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm font-mono font-bold text-muted-foreground">{rank}</span>;
}

function getHiResAvatar(url: string): string {
  if (url.includes("googleusercontent.com")) {
    return url.replace(/=s\d+-c/, "=s256-c");
  }
  if (url.includes("pbs.twimg.com")) {
    return url.replace("_normal", "_200x200");
  }
  return url;
}

function Avatar({ image, name, size = 40 }: { image: string | null; name: string | null; size?: number }) {
  if (image) {
    return (
      <Image
        src={getHiResAvatar(image)}
        alt={name || "User avatar"}
        width={size * 2}
        height={size * 2}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

type LeaderboardTableProps = {
  apiUrl?: string;
  currentUserId?: string | null;
  initialData?: LeaderboardEntry[];
};

const gridCols = "grid-cols-[2.5rem_1fr_auto] md:grid-cols-[3rem_1fr_5rem_5rem_4.5rem_4.5rem]";

export default function LeaderboardTable({ apiUrl = "/api/leaderboard", currentUserId, initialData }: LeaderboardTableProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  useEffect(() => {
    if (!initialData) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard, initialData]);

  return (
    <div>
      <p className="text-xs text-muted-foreground text-right mb-3">Last 30 days</p>
      {loading ? (
        <div className="rounded-2xl border-fade overflow-hidden">
          <div className={`grid ${gridCols} gap-3 md:gap-4 px-4 md:px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide`}>
            <span>#</span>
            <span>User</span>
            <span className="text-right hidden md:block">Streak</span>
            <span className="text-right hidden md:block">Exports</span>
            <span className="text-right hidden md:block">Today</span>
            <span className="text-right">Score</span>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`grid ${gridCols} gap-3 md:gap-4 px-4 md:px-5 py-3 border-t border-border/50`}>
              <div className="h-5 w-6 rounded bg-sidebar" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sidebar" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded bg-sidebar" />
                  <div className="h-3 w-16 rounded bg-sidebar" />
                </div>
              </div>
              <div className="h-5 w-8 rounded bg-sidebar ml-auto hidden md:block" />
              <div className="h-5 w-8 rounded bg-sidebar ml-auto hidden md:block" />
              <div className="h-5 w-8 rounded bg-sidebar ml-auto hidden md:block" />
              <div className="h-5 w-8 rounded bg-sidebar ml-auto" />
            </div>
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="rounded-2xl border-fade p-12 text-center">
          <HugeiconsIcon icon={RankingIcon} size={48} strokeWidth={1.5} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-heading font-semibold">No rankings yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Export your first visual to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-fade overflow-hidden">
          <div className={`grid ${gridCols} gap-3 md:gap-4 px-4 md:px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide`}>
            <span>#</span>
            <span>User</span>
            <span className="text-right hidden md:flex items-center justify-end gap-1">
              <HugeiconsIcon icon={Fire02Icon} size={14} strokeWidth={1.5} className="shrink-0" />
              Streak
            </span>
            <span className="text-right hidden md:flex items-center justify-end gap-1">
              <HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} className="shrink-0" />
              Exports
            </span>
            <span className="text-right hidden md:block">Today</span>
            <span className="text-right">Score</span>
          </div>

          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = currentUserId ? user.id === currentUserId : false;

            return (
              <div
                key={user.id || index}
                className={`grid ${gridCols} gap-3 md:gap-4 px-4 md:px-5 py-3 border-t border-border/50 items-center ${
                  isCurrentUser ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center justify-center w-6 md:w-8">
                  <RankBadge rank={rank} />
                </div>

                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <Avatar image={user.image} name={user.name} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || "Anonymous"}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-xs text-primary font-normal">(you)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {user.xUsername && (
                        <a
                          href={`https://x.com/${user.xUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                            <XIcon className="w-3 h-3 fill-current" />
                          </span>
                          <span>@{user.xUsername}</span>
                        </a>
                      )}
                      {user.startupWebsite && user.startupWebsite.split(", ").filter(Boolean).map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Image
                            src={`https://www.google.com/s2/favicons?domain=${url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}&sz=32`}
                            alt=""
                            width={14}
                            height={14}
                            className="rounded-sm shrink-0"
                          />
                          <span>{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <span className="text-right text-sm font-mono hidden md:flex items-center justify-end gap-1">
                  {user.currentStreak > 0 ? (
                    <>
                      <HugeiconsIcon icon={Fire02Icon} size={14} strokeWidth={2} className="text-orange-500" />
                      {user.currentStreak}
                    </>
                  ) : "—"}
                </span>
                <span className="text-right text-sm font-mono hidden md:flex items-center justify-end gap-1">
                  <HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  {user.exportsCount}
                </span>
                <span className="text-right text-sm font-mono font-bold hidden md:block">
                  {user.pointsToday > 0 ? `+${user.pointsToday}` : "—"}
                </span>
                <span className="text-right text-sm font-mono font-bold">{user.score}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
