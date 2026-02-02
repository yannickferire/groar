"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { PaintBrush01Icon, Link03Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
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
  { label: "Editor", href: "/dashboard", icon: PaintBrush01Icon },
  { label: "Connections", href: "/dashboard/connections", icon: Link03Icon },
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
      <SidebarHeader className="p-4">
        <Link href="/">
          <Image
            src="/groar-logo.png"
            alt="Groar"
            width={120}
            height={32}
            className="h-auto w-28"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
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
                        strokeWidth={1.5}
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
