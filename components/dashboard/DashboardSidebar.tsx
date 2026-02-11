"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon, Home11Icon, Link01Icon, Clock01Icon, Analytics01Icon } from "@hugeicons/core-free-icons";
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

type NavItem = {
  label: string;
  href: string;
  icon: IconSvgElement;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Analytics", href: "/dashboard/analytics", icon: Analytics01Icon },
  { label: "Connections", href: "/dashboard/connections", icon: Link01Icon },
  { label: "History", href: "/dashboard/history", icon: Clock01Icon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

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
              {NAV_ITEMS.map((item) => (
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
