"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Refresh router when tab regains focus after being hidden for 5+ minutes
  useEffect(() => {
    let hiddenAt = 0;
    const onVisible = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });

      // Track daily login for leaderboard
      fetch("/api/user/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.pointsToday !== undefined) {
            window.dispatchEvent(new CustomEvent("groar:points", {
              detail: { earned: data.pointsEarned ?? 0, today: data.pointsToday },
            }));
          }
        })
        .catch(() => {});
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
              sizes="112px"
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
