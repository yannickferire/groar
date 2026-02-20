"use client";

import { useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session?.user]);

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <Link href="/">
            <Image
              src="/groar-logo.png"
              alt="Groar"
              width={120}
              height={32}
              className="h-auto w-28"
            />
          </Link>
          <SidebarTrigger />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 pb-30 md:p-8 md:pb-30">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
