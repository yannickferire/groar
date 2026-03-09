"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon, Mail01Icon, Mail02Icon, PencilEdit01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type EmailPreferences = {
  emailMilestones: boolean;
  emailTrialReminders: boolean;
  emailProductUpdates: boolean;
};

function SettingsContent() {
  const { data: session, refetch } = authClient.useSession() as { data: ReturnType<typeof authClient.useSession>["data"]; refetch: () => void };
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const saveName = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === session?.user?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await authClient.updateUser({ name: trimmed });
      refetch();
    } catch (e) {
      console.error("Failed to update name:", e);
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }, [nameValue, session?.user?.name, refetch]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }

    setUploadingImage(true);
    try {
      // Convert to base64 data URL for Better Auth
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          await authClient.updateUser({ image: dataUrl });
          refetch();
        } catch (err) {
          console.error("Failed to update avatar:", err);
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImage(false);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [refetch]);

  // Get higher-res Twitter image (replace _normal with _bigger or _200x200)
  const avatarUrl = session?.user?.image?.replace(/_normal\./, "_200x200.") || session?.user?.image;

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

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={session?.user?.name || "Avatar"}
                width={64}
                height={64}
                className="rounded-full w-16 h-16 object-cover"
                unoptimized
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <HugeiconsIcon icon={UserCircleIcon} size={32} strokeWidth={1.5} className="text-muted-foreground" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              {uploadingImage ? (
                <HugeiconsIcon icon={Loading03Icon} size={20} strokeWidth={2} className="text-white animate-spin" />
              ) : (
                <HugeiconsIcon icon={PencilEdit01Icon} size={20} strokeWidth={2} className="text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Display name</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="h-8 text-sm"
                  autoFocus
                  disabled={savingName}
                />
                <Button size="sm" variant="default" onClick={saveName} disabled={savingName} className="h-8 px-3 text-xs">
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} disabled={savingName} className="h-8 px-3 text-xs">
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameValue(session?.user?.name || "");
                  setEditingName(true);
                }}
                className="flex items-center gap-1.5 group/name cursor-pointer"
              >
                <p className="font-medium">{session?.user?.name || "—"}</p>
                <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={2} className="text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
              </button>
            )}
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
