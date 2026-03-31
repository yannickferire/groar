"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon, Home11Icon, Link01Icon, Clock01Icon, Analytics01Icon, FlashIcon, CrownIcon, SparklesIcon, ChromeIcon, RankingIcon, Notification03Icon, GiftIcon, SourceCodeSquareIcon, RoboticIcon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { PlanType, PLANS, ProTierInfo, fetchProTierInfo } from "@/lib/plans";

type NavItem = {
  label: string;
  href: string;
  icon: IconSvgElement;
  premium?: boolean;
  proOnly?: boolean;
  comingSoon?: boolean;
  beta?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Analytics", href: "/dashboard/analytics", icon: Analytics01Icon, premium: true },
  { label: "Connections", href: "/dashboard/connections", icon: Link01Icon },
  { label: "History", href: "/dashboard/history", icon: Clock01Icon, premium: true },
  { label: "Notifications", href: "/dashboard/notifications", icon: Notification03Icon },
  { label: "Automation", href: "/dashboard/automation", icon: RoboticIcon, premium: true, proOnly: true, beta: true },
  { label: "API", href: "/dashboard/api", icon: SourceCodeSquareIcon, premium: true, proOnly: true, beta: true },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: RankingIcon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [userPlan, setUserPlan] = useState<PlanType | null>(null);
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [pointsToday, setPointsToday] = useState<number | null>(null);
  const [animatingPoints, setAnimatingPoints] = useState<number | null>(null);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchPlan = useCallback(() => {
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => {
        setUserPlan(data.plan);
        setIsTrialing(!!data.isTrialing);
        setTrialEnd(data.trialEnd || null);
        setHasUsedTrial(!!data.hasUsedTrial);
        setIsAdmin(!!data.isAdmin);
      })
      .catch(() => setUserPlan("free"));
  }, []);

  useEffect(() => {
    fetchPlan();
    fetchProTierInfo()
      .then(setProTierInfo)
      .catch(() => {});
  }, [fetchPlan]);

  // Re-fetch plan when trial starts or plan changes
  useEffect(() => {
    const onPlanUpdated = () => fetchPlan();
    window.addEventListener("groar:plan-updated", onPlanUpdated);
    return () => window.removeEventListener("groar:plan-updated", onPlanUpdated);
  }, [fetchPlan]);

  // Poll unread notification count every 60s
  useEffect(() => {
    const fetchUnread = () =>
      fetch("/api/notifications?unread=true")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setUnreadNotifications(data.unreadCount ?? 0);
        })
        .catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handlePointsEvent = useCallback((e: Event) => {
    const { earned, today } = (e as CustomEvent).detail;
    setPointsToday(today);
    if (earned > 0) {
      setAnimatingPoints(earned);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = setTimeout(() => setAnimatingPoints(null), 1500);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("groar:points", handlePointsEvent);
    const onNotifRead = () => setUnreadNotifications((prev) => Math.max(0, prev - 1));
    const onNotifsAllRead = () => setUnreadNotifications(0);
    window.addEventListener("groar:notification-read", onNotifRead);
    window.addEventListener("groar:notifications-all-read", onNotifsAllRead);
    return () => {
      window.removeEventListener("groar:points", handlePointsEvent);
      window.removeEventListener("groar:notification-read", onNotifRead);
      window.removeEventListener("groar:notifications-all-read", onNotifsAllRead);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [handlePointsEvent]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/dashboard">
          <Image
            src="/groar-logo.png"
            alt="Groar"
            width={180}
            height={48}
            className="h-auto w-36 dark:hidden"
          />
          <Image
            src="/groar-logo_white.png"
            alt="Groar"
            width={180}
            height={48}
            className="h-auto w-36 hidden dark:block"
          />
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="mx-0 mt-3 mb-3" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {/* Dashboard link */}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard")}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <HugeiconsIcon
                      icon={Home11Icon}
                      size={20}
                      strokeWidth={2}
                    />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* New visual CTA button */}
            <div className="my-2">
              <Button asChild variant="default" className="w-full justify-start">
                <Link href="/dashboard/editor">
                  <HugeiconsIcon icon={AddSquareIcon} size={18} strokeWidth={2} />
                  New visual
                </Link>
              </Button>
            </div>

            {/* Other nav items */}
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                if (item.comingSoon) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        tooltip={`${item.label} (Coming soon)`}
                        className="opacity-50 pointer-events-none"
                      >
                        <HugeiconsIcon
                          icon={item.icon}
                          size={20}
                          strokeWidth={2}
                        />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Soon</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const isLocked = item.proOnly
                  ? userPlan === "free" || isTrialing
                  : item.premium && userPlan === "free";

                if (isLocked) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={`${item.label} (Pro)`}
                        className="opacity-70"
                      >
                        <Link href={item.href}>
                          <HugeiconsIcon
                            icon={item.icon}
                            size={20}
                            strokeWidth={2}
                          />
                          <span className="flex-1">{item.label}</span>
                          <HugeiconsIcon
                            icon={CrownIcon}
                            size={14}
                            strokeWidth={2}
                            className="text-primary opacity-85"
                          />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const isLeaderboard = item.href === "/dashboard/leaderboard";
                const isNotifications = item.href === "/dashboard/notifications";

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <HugeiconsIcon
                          icon={item.icon}
                          size={20}
                          strokeWidth={2}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.beta && (
                          <span className={`text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded-full ${isActive(item.href) ? "bg-muted" : "bg-sidebar-accent"}`}>Beta</span>
                        )}
                        {isNotifications && unreadNotifications > 0 && (
                          <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-400/90 text-white text-[11px] font-bold">
                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                    {isLeaderboard && pointsToday !== null && pointsToday > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <span className="text-[11px] font-mono font-bold text-muted-foreground">
                          +{pointsToday}
                        </span>
                        {animatingPoints !== null && (
                          <span
                            key={animatingPoints + "-" + pointsToday}
                            className="absolute -top-1 left-0 text-[11px] font-mono font-bold text-green-500 pointer-events-none"
                            style={{
                              animation: "points-float 1.5s ease-out forwards",
                            }}
                          >
                            +{animatingPoints}
                          </span>
                        )}
                      </span>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Trial banner — above Chrome extension for trialing users */}
        {isTrialing && trialEnd && (
          <div className="mx-2 mb-2 rounded-2xl bg-primary/10 border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <HugeiconsIcon icon={CrownIcon} size={16} strokeWidth={2} className="text-primary" />
              <span className="font-heading font-bold text-sm" suppressHydrationWarning>
                Pro trial — {Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} day{Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) !== 1 ? "s" : ""} left
              </span>
            </div>
            <Button asChild variant="default" size="sm" className="w-full mt-1">
              <Link href="/dashboard/plan#plans">
                <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                Claim your spot
              </Link>
            </Button>
          </div>
        )}

        {userPlan && !["pro", "friend"].includes(userPlan) && !isTrialing ? (
          <div className="mx-2 mb-2 p-4 rounded-2xl bg-foreground text-background relative overflow-hidden">
            {/* Gradient effect */}
            <div className="absolute -bottom-10 -right-20 w-40 h-30 bg-linear-to-tl from-primary/40 via-primary/20 to-transparent blur-2xl rotate-[-25deg]" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground">
                  <HugeiconsIcon icon={CrownIcon} size={14} strokeWidth={2} />
                </div>
                <span className="font-heading font-bold text-sm">Level up your growth</span>
              </div>

              {!hasUsedTrial ? (
                <>
                  <p className="text-xs text-background/70 mb-3">
                    Unlock unlimited exports, analytics, and more.
                  </p>
                  <Button
                    variant="defaultReverse"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      fetch("/api/user/trial", { method: "POST" })
                        .then(() => { window?.datafast?.("trial_started"); window.location.reload(); })
                        .catch(() => { window.location.href = "/dashboard/plan#plans"; });
                    }}
                  >
                    <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                    Start free trial
                  </Button>
                  <p className="text-[11px] text-background/50 text-center mt-1.5">No credit card required</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-background/70 mb-3">
                    Unlock unlimited exports, analytics, and more.
                  </p>
                  <Button asChild variant="defaultReverse" size="sm" className="w-full">
                    <Link href="/dashboard/plan#plans">
                      <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                      Upgrade to Pro
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
        <SidebarSeparator />
        <UserMenu isAdmin={isAdmin} />
      </SidebarFooter>
    </Sidebar>
  );
}
