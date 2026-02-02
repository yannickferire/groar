"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Link03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export default function ConnectionsPage() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Connections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your social accounts to auto-fill your metrics.
        </p>
      </div>

      {/* X/Twitter connection card */}
      <div className="rounded-2xl border-fade p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-10 h-10 bg-foreground text-background rounded-xl">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </span>
          <div>
            <p className="font-medium font-heading">X (Twitter)</p>
            <p className="text-xs text-muted-foreground">Not connected</p>
          </div>
        </div>
        <Button variant="outline" disabled>
          <HugeiconsIcon icon={Link03Icon} size={16} strokeWidth={1.5} className="mr-2" />
          Coming soon
        </Button>
      </div>
    </div>
  );
}
