"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon, Mail01Icon, Mail02Icon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

type EmailPreferences = {
  emailMilestones: boolean;
  emailTrialReminders: boolean;
  emailProductUpdates: boolean;
};

function SettingsContent() {
  const { data: session } = authClient.useSession();
  const [prefs, setPrefs] = useState<EmailPreferences>({
    emailMilestones: true,
    emailTrialReminders: true,
    emailProductUpdates: true,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setPrefs(data);
      })
      .catch(() => {})
      .finally(() => setLoadingPrefs(false));
  }, []);

  const allEmailsOn = prefs.emailMilestones || prefs.emailTrialReminders || prefs.emailProductUpdates;

  const togglePref = useCallback(async (key: keyof EmailPreferences, checked: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: checked }));
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: checked }),
    });
  }, []);

  const toggleAllEmails = useCallback(async (checked: boolean) => {
    const newPrefs = {
      emailMilestones: checked,
      emailTrialReminders: checked,
      emailProductUpdates: checked,
    };
    setPrefs(newPrefs);
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPrefs),
    });
  }, []);

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

      {/* Email preferences */}
      <div className="rounded-2xl border-fade p-6 space-y-6">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Mail02Icon} size={20} strokeWidth={2} />
          <h2 className="text-lg font-heading font-semibold">Email preferences</h2>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">All emails</p>
              <p className="text-sm text-muted-foreground">
                Receive all emails from Groar.
              </p>
            </div>
            <Switch
              checked={allEmailsOn}
              onCheckedChange={toggleAllEmails}
              disabled={loadingPrefs}
            />
          </div>

          <div className="border-t border-border" />

          <div className={`flex items-center justify-between gap-4 ${!allEmailsOn ? "opacity-50" : ""}`}>
            <div>
              <p className="text-sm font-medium">Milestones</p>
              <p className="text-sm text-muted-foreground">
                Get notified when you hit a milestone.
              </p>
            </div>
            <Switch
              checked={prefs.emailMilestones}
              onCheckedChange={(checked) => togglePref("emailMilestones", checked)}
              disabled={loadingPrefs || !allEmailsOn}
            />
          </div>

          <div className={`flex items-center justify-between gap-4 ${!allEmailsOn ? "opacity-50" : ""}`}>
            <div>
              <p className="text-sm font-medium">Trial & billing</p>
              <p className="text-sm text-muted-foreground">
                Trial reminders and billing updates.
              </p>
            </div>
            <Switch
              checked={prefs.emailTrialReminders}
              onCheckedChange={(checked) => togglePref("emailTrialReminders", checked)}
              disabled={loadingPrefs || !allEmailsOn}
            />
          </div>

          <div className={`flex items-center justify-between gap-4 ${!allEmailsOn ? "opacity-50" : ""}`}>
            <div>
              <p className="text-sm font-medium">Product updates</p>
              <p className="text-sm text-muted-foreground">
                New features and product updates.
              </p>
            </div>
            <Switch
              checked={prefs.emailProductUpdates}
              onCheckedChange={(checked) => togglePref("emailProductUpdates", checked)}
              disabled={loadingPrefs || !allEmailsOn}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
