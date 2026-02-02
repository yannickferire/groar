"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HistoryPage() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your recently created visuals.
        </p>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border-fade p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} size={28} strokeWidth={1.5} />
          <HugeiconsIcon icon={Image01Icon} size={28} strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-medium font-heading">No visuals yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your created visuals will appear here.
          </p>
        </div>
        <Button asChild variant="default">
          <Link href="/dashboard">Create your first visual</Link>
        </Button>
      </div>
    </div>
  );
}
