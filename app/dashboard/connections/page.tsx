"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, Add01Icon, Rocket01Icon, Delete02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { PLAN_LIMITS, PlanType } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

type Account = {
  id: string;
  accountId: string;
  providerId: string;
  createdAt: string;
};

type SocialPlatform = {
  id: string;
  label: string;
  provider: "twitter";
  icon: React.ReactNode;
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "twitter",
    label: "X (Twitter)",
    provider: "twitter",
    icon: (
      <span className="inline-flex items-center justify-center w-10 h-10 bg-foreground text-background rounded-xl shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </span>
    ),
  },
];

function ConnectionsContent() {
  const { data: session } = authClient.useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [plan, setPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxPerProvider = PLAN_LIMITS[plan].maxConnectionsPerProvider;

  const fetchData = useCallback(async () => {
    try {
      const [connectionsRes, planRes] = await Promise.all([
        fetch("/api/connections"),
        fetch("/api/user/plan"),
      ]);
      if (connectionsRes.status === 403) {
        setError("premium");
        setLoading(false);
        return;
      }
      const connectionsData = await connectionsRes.json();
      const planData = await planRes.json();
      setAccounts(connectionsData.accounts || []);
      setPlan(planData.plan || "free");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDisconnect = async (accountId: string) => {
    setDisconnecting(accountId);
    posthog.capture("social_account_disconnected", {
      provider: accounts.find((a) => a.id === accountId)?.providerId,
    });
    try {
      await fetch(`/api/connections/${accountId}`, { method: "DELETE" });
      await fetchData();
    } finally {
      setDisconnecting(null);
    }
  };

  const handleConnect = (provider: "twitter") => {
    posthog.capture("social_account_connected", {
      provider,
      is_reconnect: false,
    });
    authClient.signIn.social({
      provider,
      callbackURL: "/dashboard/connections",
    });
  };

  const handleReconnect = (provider: "twitter") => {
    posthog.capture("social_account_connected", {
      provider,
      is_reconnect: true,
    });
    // Re-triggering OAuth will refresh the tokens
    authClient.signIn.social({
      provider,
      callbackURL: "/dashboard/connections",
    });
  };

  const googleAccount = accounts.find((a) => a.providerId === "google");

  if (error === "premium") {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="space-y-6 max-w-md text-center">
          <p className="text-8xl">🦁</p>
          <h1 className="text-4xl font-bold font-heading">Pro feature</h1>
          <p className="text-xl text-muted-foreground">
            Only the king of the jungle can access this.
          </p>
          <Button asChild size="lg">
            <Link href="/pricing">Upgrade to Pro</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Connections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your linked social accounts.
        </p>
      </div>

      {/* Google (auth provider, only shown if connected) */}
      {googleAccount && (
        <div className="rounded-2xl border-fade p-6 flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-10 h-10 bg-white border border-border rounded-xl shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </span>
          <div className="flex-1">
            <p className="font-medium font-heading">Google</p>
            <p className="text-xs text-muted-foreground">Sign-in method</p>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
            <HugeiconsIcon icon={Link01Icon} size={12} strokeWidth={2} />
            Connected
          </Badge>
        </div>
      )}

      {/* Social platforms (with multi-account support) */}
      {SOCIAL_PLATFORMS.map((platform) => {
        const platformAccounts = accounts.filter(
          (a) => a.providerId === platform.id
        );
        const count = platformAccounts.length;
        const canAdd = count < maxPerProvider;

        return (
          <div key={platform.id} className="rounded-2xl border-fade overflow-hidden">
            {/* Platform header */}
            <div className="p-6 flex items-center gap-4">
              {platform.icon}
              <p className="font-medium font-heading flex-1">{platform.label}</p>
              {loading ? (
                <div className="h-5 w-28 rounded-full bg-sidebar" />
              ) : count > 0 ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                  <HugeiconsIcon icon={Link01Icon} size={12} strokeWidth={2} />
                  {count}/{maxPerProvider} Connected
                </Badge>
              ) : (
                <Badge variant="secondary">0/{maxPerProvider} Connected</Badge>
              )}
            </div>

            {/* Connected accounts list */}
            {!loading && count > 0 && (
              <ul className="border-t border-border/50">
                {platformAccounts.map((account) => (
                  <li
                    key={account.id}
                    className="px-6 py-3 flex items-center gap-3 border-b border-border/50 last:border-b-0"
                  >
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Account avatar"
                        width={28}
                        height={28}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                    )}
                    <span className="text-sm flex-1 truncate">
                      {session?.user?.xUsername
                        ? `@${session.user.xUsername}`
                        : session?.user?.name || account.accountId}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReconnect(platform.provider)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <HugeiconsIcon icon={Link01Icon} size={14} strokeWidth={2} />
                        Reconnect
                      </Button>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        disabled={disconnecting === account.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        aria-label="Disconnect"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Add account button or upgrade link */}
            <div className="px-6 py-3 border-t border-border/50">
              {loading ? (
                <div className="h-8 w-32 rounded-md bg-sidebar" />
              ) : canAdd ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleConnect(platform.provider)}
                  className="text-muted-foreground hover:text-foreground -ml-2"
                >
                  <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
                  {count === 0 ? "Connect account" : "Add account"}
                </Button>
              ) : (
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Upgrade your plan to connect more accounts
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {/* Coming soon */}
      <div className="rounded-2xl border border-dashed border-border p-6 flex items-center gap-4 text-muted-foreground">
        <HugeiconsIcon icon={Rocket01Icon} size={24} strokeWidth={1.5} />
        <div>
          <p className="font-medium font-heading text-foreground">More platforms coming soon</p>
          <p className="text-xs mt-0.5">
            GitHub, Instagram, LinkedIn, TikTok and more will be available in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense>
      <ConnectionsContent />
    </Suspense>
  );
}
