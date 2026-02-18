"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon, Home11Icon, Link01Icon, Clock01Icon, Analytics01Icon, FlashIcon, CrownIcon, SparklesIcon, ChromeIcon } from "@hugeicons/core-free-icons";
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
import { PlanType, CURRENT_PRO_PRICE } from "@/lib/plans";

type NavItem = {
  label: string;
  href: string;
  icon: IconSvgElement;
  premium?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Analytics", href: "/dashboard/analytics", icon: Analytics01Icon, premium: true },
  { label: "Connections", href: "/dashboard/connections", icon: Link01Icon, premium: true },
  { label: "History", href: "/dashboard/history", icon: Clock01Icon, premium: true },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [userPlan, setUserPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => setUserPlan(data.plan))
      .catch(() => setUserPlan("free"));
  }, []);

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
            className="h-auto w-36"
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
                const isLocked = item.premium && userPlan === "free";

                if (isLocked) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        tooltip={`${item.label} (Pro)`}
                        className="opacity-50 cursor-not-allowed"
                        disabled
                      >
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
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

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
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {userPlan && !["pro", "friend", "agency"].includes(userPlan) ? (
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

              <p className="text-xs text-background/70 mb-3">
                Unlock unlimited exports, analytics, and more — from ${CURRENT_PRO_PRICE}/mo.
              </p>

              <Button asChild variant="defaultReverse" size="sm" className="w-full">
                <Link href="/pricing">
                  <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                  Upgrade to Pro
                </Link>
              </Button>
            </div>
          </div>
        ) : userPlan && (
          <div className="mx-2 mb-2 p-4 rounded-2xl bg-foreground text-background relative overflow-hidden">
            {/* Gradient effect */}
            <div className="absolute -bottom-10 -right-20 w-40 h-30 bg-linear-to-tl from-primary/40 via-primary/20 to-transparent blur-2xl rotate-[-25deg]" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground">
                  <HugeiconsIcon icon={ChromeIcon} size={14} strokeWidth={2} />
                </div>
                <span className="font-heading font-bold text-sm">Chrome Extension</span>
              </div>

              <p className="text-xs text-background/70 mb-3">
                Export your visuals and access all your analytics while scrolling X.
              </p>

              <Button variant="defaultReverse" size="sm" className="w-full opacity-50" disabled>
                Coming soon
              </Button>
            </div>
          </div>
        )}
        <SidebarSeparator />
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
