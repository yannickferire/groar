"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { RankingIcon, Fire02Icon, Download04Icon, CalendarCheckIn01Icon, Layout01Icon, PaintBoardIcon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import { authClient } from "@/lib/auth-client";

type LeaderboardEntry = {
  id: string;
  name: string;
  image: string | null;
  xUsername: string | null;
  exportsCount: number;
  totalLoginDays: number;
  currentStreak: number;
  longestStreak: number;
  uniqueTemplatesCount: number;
  uniqueBackgroundsCount: number;
  score: number;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm font-mono font-bold text-muted-foreground">{rank}</span>;
}

function Avatar({ image, name, size = 40 }: { image: string | null; name: string | null; size?: number }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name || ""}
        width={size}
        height={size}
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

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SCORE_RULES: { icon: IconSvgElement; label: string; pts: string }[] = [
  { icon: CalendarCheckIn01Icon, label: "Daily login", pts: "+20" },
  { icon: Download04Icon, label: "Export (max 3/day)", pts: "+10" },
  { icon: Layout01Icon, label: "New template", pts: "+50" },
  { icon: PaintBoardIcon, label: "New background", pts: "+20" },
];

export default function LeaderboardPage() {
  const { data: session } = authClient.useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserScore, setCurrentUserScore] = useState(0);
  const [currentUserExports, setCurrentUserExports] = useState(0);
  const [currentUserStreak, setCurrentUserStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setCurrentUserId(data.currentUserId);
        setCurrentUserRank(data.currentUserRank);
        setCurrentUserScore(data.currentUserScore ?? 0);
        setCurrentUserExports(data.currentUserExports ?? 0);
        setCurrentUserStreak(data.currentUserStreak ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See how you rank among the 🐯 GROAR community.
        </p>
      </div>

      {/* Your rank card */}
      {!loading && (
        <div className="rounded-2xl border-fade bg-primary/5 p-5">
          <div className="flex items-center gap-4">
            <Avatar
              image={session?.user?.image || null}
              name={session?.user?.name || null}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name || "You"}
              </p>
              <p className="text-xs text-muted-foreground">Your ranking</p>
            </div>
            <div className="flex items-center gap-6">
              {currentUserStreak > 0 && (
                <div className="text-center">
                  <p className="text-xl font-mono font-bold flex items-center justify-center gap-1">
                    <HugeiconsIcon icon={Fire02Icon} size={18} strokeWidth={2} className="text-orange-500" />
                    {currentUserStreak}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Streak</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-mono font-bold flex items-center justify-center gap-1">
                  <HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={2} className="text-muted-foreground" />
                  {currentUserExports}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exports</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-mono font-bold">{currentUserScore}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</p>
              </div>
              <div className="text-center pl-4 border-l border-border/50">
                <p className="text-2xl font-mono font-bold text-primary">
                  {currentUserRank !== null ? `#${currentUserRank}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rank</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score rules */}
      <div className="flex flex-wrap gap-2">
        {SCORE_RULES.map((rule) => (
          <span
            key={rule.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-sidebar px-3 py-1.5 text-xs text-muted-foreground"
          >
            <HugeiconsIcon icon={rule.icon} size={13} strokeWidth={1.5} />
            {rule.label}
            <span className="font-mono font-bold text-foreground">{rule.pts}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar px-3 py-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Fire02Icon} size={13} strokeWidth={1.5} />
          Streaks
          <span>7 days <span className="font-mono font-bold text-foreground">+50</span> · 30 days <span className="font-mono font-bold text-foreground">+100</span> · 90 days <span className="font-mono font-bold text-foreground">+300</span></span>
        </span>
      </div>

      {/* Top 10 */}
      {loading ? (
        <div className="rounded-2xl border-fade overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_5rem_5rem_4.5rem] gap-4 px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide">
            <span>#</span>
            <span>User</span>
            <span className="text-right">Streak</span>
            <span className="text-right">Exports</span>
            <span className="text-right">Score</span>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-[3rem_1fr_5rem_5rem_4.5rem] gap-4 px-5 py-3 border-t border-border/50">
              <div className="h-5 w-6 rounded bg-sidebar" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sidebar" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded bg-sidebar" />
                  <div className="h-3 w-16 rounded bg-sidebar" />
                </div>
              </div>
              <div className="h-5 w-8 rounded bg-sidebar ml-auto" />
              <div className="h-5 w-8 rounded bg-sidebar ml-auto" />
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
          {/* Header */}
          <div className="grid grid-cols-[3rem_1fr_5rem_5rem_4.5rem] gap-4 px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide">
            <span>#</span>
            <span>User</span>
            <span className="text-right flex items-center justify-end gap-1">
              <HugeiconsIcon icon={Fire02Icon} size={14} strokeWidth={1.5} className="shrink-0" />
              Streak
            </span>
            <span className="text-right flex items-center justify-end gap-1">
              <HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} className="shrink-0" />
              Exports
            </span>
            <span className="text-right">Score</span>
          </div>

          {/* Rows — Top 10 */}
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className={`grid grid-cols-[3rem_1fr_5rem_5rem_4.5rem] gap-4 px-5 py-3 border-t border-border/50 items-center ${
                  isCurrentUser ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  <RankBadge rank={rank} />
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <Avatar image={user.image} name={user.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || "Anonymous"}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-xs text-primary font-normal">(you)</span>
                      )}
                    </p>
                    {user.xUsername ? (
                      <a
                        href={`https://x.com/${user.xUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                          <XIcon />
                        </span>
                        <span>@{user.xUsername}</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                <span className="text-right text-sm font-mono flex items-center justify-end gap-1">
                  {user.currentStreak > 0 ? (
                    <>
                      <HugeiconsIcon icon={Fire02Icon} size={14} strokeWidth={2} className="text-orange-500" />
                      {user.currentStreak}
                    </>
                  ) : "—"}
                </span>
                <span className="text-right text-sm font-mono flex items-center justify-end gap-1">
                  <HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  {user.exportsCount}
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
