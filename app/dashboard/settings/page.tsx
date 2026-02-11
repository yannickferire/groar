"use client";

import { authClient } from "@/lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings.
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border-fade p-6 space-y-6">
        <h2 className="text-lg font-heading font-semibold">Profile</h2>

        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "Avatar"}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <HugeiconsIcon icon={UserCircleIcon} size={32} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{session?.user?.name || "—"}</p>
            <p className="text-sm text-muted-foreground">
              Profile managed by your sign-in provider
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar">
            <HugeiconsIcon icon={Mail01Icon} size={20} strokeWidth={1.5} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm">{session?.user?.email || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon */}
      <div className="rounded-2xl border border-dashed border-border p-6">
        <p className="text-sm text-muted-foreground">
          More settings coming soon: notification preferences, data export, and account deletion.
        </p>
      </div>
    </div>
  );
}
