"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";

export default function UserMenu() {
  // TODO: Replace with real user session from BetterAuth
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground">
      <HugeiconsIcon icon={UserCircleIcon} size={20} strokeWidth={1.5} />
      <span className="truncate">Account</span>
    </div>
  );
}
