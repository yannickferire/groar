"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fire02Icon, Download04Icon, CalendarCheckIn01Icon, Layout01Icon, PaintBoardIcon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import { authClient } from "@/lib/auth-client";
import { BADGES } from "@/lib/badges";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import XIcon from "@/components/icons/XIcon";
import LeaderboardTable from "@/components/dashboard/LeaderboardTable";

function getSmallAvatar(url: string): string {
  if (url.includes("googleusercontent.com")) {
    if (/=s\d+/.test(url)) return url.replace(/=s\d+(-c)?/, "=s96-c");
    return url + "=s96-c";
  }
  if (url.includes("pbs.twimg.com")) return url.replace("_normal", "_x96");
  return url;
}

function Avatar({ image, name, size = 40 }: { image: string | null; name: string | null; size?: number }) {
  if (image) {
    return (
      <Image
        src={getSmallAvatar(image)}
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

const SCORE_RULES: { icon: IconSvgElement; label: string; pts: string }[] = [
  { icon: CalendarCheckIn01Icon, label: "Daily login", pts: "+20" },
  { icon: Download04Icon, label: "Export (max 5/day)", pts: "+10" },
  { icon: Layout01Icon, label: "New template", pts: "+50" },
  { icon: PaintBoardIcon, label: "New background", pts: "+20" },
];

export default function LeaderboardPage() {
  const { data: session } = authClient.useSession();
  const [currentUser, setCurrentUser] = useState<{
    id: string | null;
    rank: number | null;
    score: number;
    exports: number;
    streak: number;
    pointsToday: number;
    loggedInToday: boolean;
    exportsToday: number;
    badges: { badgeId: string; earnedAt: string }[];
  }>({
    id: null, rank: null, score: 0, exports: 0, streak: 0,
    pointsToday: 0, loggedInToday: false, exportsToday: 0, badges: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchUserStats = useCallback(() => {
    setLoading(true);
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser({
          id: data.currentUserId,
          rank: data.currentUserRank,
          score: data.currentUserScore ?? 0,
          exports: data.currentUserExports ?? 0,
          streak: data.currentUserStreak ?? 0,
          pointsToday: data.currentUserPointsToday ?? 0,
          loggedInToday: data.currentUserLoggedInToday ?? false,
          exportsToday: data.currentUserExportsToday ?? 0,
          badges: data.currentUserBadges || [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See how you rank among the GROAR community.
        </p>
      </div>

      {/* Your rank card */}
      {!loading && (
        <div className="rounded-2xl border-fade bg-primary/5 p-4 md:p-5">
          <div className="flex items-center gap-3 md:gap-4">
            <Avatar
              image={session?.user?.image || null}
              name={session?.user?.name || null}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {session?.user?.name || "You"}
              </p>
              <div className="flex flex-wrap gap-1 mt-1 -ml-1.5">
                {BADGES.map((badge) => {
                  const earned = currentUser.badges.some((b) => b.badgeId === badge.id);
                  return (
                    <Tooltip key={badge.id}>
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-md bg-background/60 text-xl cursor-default ${
                            earned ? "" : "opacity-60 grayscale"
                          }`}
                          role="img"
                          aria-label={badge.name}
                        >
                          {badge.emoji}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-[10px] opacity-70">{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
            {/* Rank — always visible */}
            <div className="text-center pl-3 md:pl-4 border-l border-border/50">
              <p className="text-2xl font-mono font-bold text-primary">
                {currentUser.rank !== null ? `#${currentUser.rank}` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rank</p>
            </div>
          </div>

          {/* Stats row — hidden on mobile */}
          <div className="hidden md:flex items-center gap-6 mt-4 pt-4 border-t border-border/30">
            {currentUser.streak > 0 && (
              <div className="text-center">
                <p className="text-lg md:text-xl font-mono font-bold flex items-center justify-center gap-1">
                  <HugeiconsIcon icon={Fire02Icon} size={16} strokeWidth={2} className="text-orange-500" />
                  {currentUser.streak}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Streak</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-lg md:text-xl font-mono font-bold flex items-center justify-center gap-1">
                <HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
                {currentUser.exports}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exports</p>
            </div>
            {currentUser.pointsToday > 0 && (
              <div className="text-center">
                <p className="text-lg md:text-xl font-mono font-bold">+{currentUser.pointsToday}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-lg md:text-xl font-mono font-bold">{currentUser.score}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</p>
            </div>
            <div className="flex-1" />
            {currentUser.rank !== null && currentUser.score > 0 && (
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `I'm ranked #${currentUser.rank} on the GROAR!\n\nJoin the community\nhttps://groar.app`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-foreground text-background h-9 px-4 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <XIcon className="w-3 h-3 fill-current" />
                Share
              </a>
            )}
          </div>
        </div>
      )}

      {/* Score rules */}
      <div className="flex flex-wrap gap-2">
        {SCORE_RULES.map((rule) => {
          const isDone =
            rule.label === "Daily login" ? currentUser.loggedInToday :
            rule.label === "Export (max 5/day)" ? currentUser.exportsToday >= 5 :
            false;
          return (
            <span
              key={rule.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-sidebar px-3 py-1.5 text-xs text-muted-foreground"
            >
              <HugeiconsIcon icon={rule.icon} size={13} strokeWidth={1.5} />
              {rule.label}
              <span className="font-mono font-bold text-foreground">{rule.pts}</span>
              {isDone && (
                <span className="ml-0.5 -mr-1 inline-flex items-center justify-center w-4 h-4 rounded-full border border-green-500 text-green-500">
                  <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 fill-current" aria-label="Done">
                    <path d="M6.5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" />
                  </svg>
                </span>
              )}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar px-3 py-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Fire02Icon} size={13} strokeWidth={1.5} />
          Streaks
          <span>7 days <span className="font-mono font-bold text-foreground">+50</span> · 30 days <span className="font-mono font-bold text-foreground">+100</span> · 90 days <span className="font-mono font-bold text-foreground">+300</span></span>
        </span>
      </div>

      {/* Leaderboard table (shared component) */}
      <LeaderboardTable apiUrl="/api/leaderboard" currentUserId={currentUser.id} />
    </div>
  );
}
