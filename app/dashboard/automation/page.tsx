"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RoboticIcon, Key01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AutomationPage() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => {
        setIsPro(["pro", "friend"].includes(data.plan));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl mt-6" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-heading font-bold">Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically post your milestones, schedule visuals, and connect your favorite tools.
          </p>
        </div>
        <div className="mt-10 text-center py-16 rounded-2xl border-fade">
          <HugeiconsIcon icon={Key01Icon} size={32} strokeWidth={1.5} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Automation is available on Pro plans.</p>
          <Button asChild variant="default">
            <a href="/dashboard/plan#plans">Upgrade to Pro</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="p-4 rounded-2xl bg-muted mb-4">
          <HugeiconsIcon
            icon={RoboticIcon}
            size={32}
            strokeWidth={1.5}
            className="text-muted-foreground"
          />
        </div>
        <h1 className="font-heading font-bold text-2xl mb-2">Automation</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Automatically post your milestones, schedule visuals, and connect your favorite tools. Coming soon.
        </p>
      </div>
    </div>
  );
}
