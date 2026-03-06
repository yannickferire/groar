"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";

export default function VsCta({ title }: { title?: string }) {
  const { data: session } = authClient.useSession();

  if (session) {
    return (
      <section className="text-center py-10 md:py-14">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          {title || "Your dashboard is waiting"}
        </h2>
        <p className="text-muted-foreground mb-6 text-balance">
          You&apos;re already in. Go create your next metric visual.
        </p>
        <Button asChild variant="default" size="lg">
          <Link href="/dashboard">
            <HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={2} aria-hidden="true" />
            Go to Dashboard
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="text-center py-10 md:py-14">
      <h2 className="text-2xl md:text-3xl font-bold mb-3">
        {title || "Ready to showcase your growth?"}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
        Try 🐯 GROAR for free — no credit card required.
        <br />
        Create your first metric visual in under 10 seconds.
      </p>
      <Button asChild variant="default" size="lg">
        <Link href="/login?callbackUrl=%2Fdashboard%3Ftrial%3Dstart">
          <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} aria-hidden="true" />
          Try 🐯 GROAR for free
        </Link>
      </Button>
    </section>
  );
}
