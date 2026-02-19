"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  userCreatedAt: string;
  plan: string | null;
  status: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  externalId: string | null;
  externalCustomerId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  billingPeriod: string | null;
  subscriptionCreatedAt: string | null;
  subscriptionUpdatedAt: string | null;
  exportCount: string;
  providers: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ user }: { user: UserRow }) {
  if (user.status === "active") {
    return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">active</Badge>;
  }
  if (user.status === "trialing") {
    const isExpired = user.trialEnd && new Date(user.trialEnd) <= new Date();
    if (isExpired) {
      return <Badge variant="secondary" className="text-amber-600">trialing (expired)</Badge>;
    }
    const daysLeft = user.trialEnd ? Math.ceil((new Date(user.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    return <Badge className="bg-primary/10 text-primary border-primary/30">trialing ({daysLeft}d left)</Badge>;
  }
  if (user.status === "canceled") {
    return <Badge variant="secondary" className="text-red-500">canceled</Badge>;
  }
  if (user.status) {
    return <Badge variant="outline">{user.status}</Badge>;
  }
  return <span className="text-muted-foreground">—</span>;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then((data) => setUsers(data.users || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeTrials = users.filter(u => u.status === "trialing" && u.trialEnd && new Date(u.trialEnd) > new Date());
  const expiredTrials = users.filter(u => u.trialStart && u.trialEnd && new Date(u.trialEnd) <= new Date() && u.status !== "active");
  const proUsers = users.filter(u => u.status === "active");
  const freeUsers = users.filter(u => !u.plan || u.plan === "free");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users.length} users — {freeUsers.length} free — {activeTrials.length} trialing — {expiredTrials.length} expired — {proUsers.length} pro
        </p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-2xl border-fade overflow-hidden">
            <button
              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium">{user.name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email || user.id}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="outline" className="font-mono text-xs">{user.plan || "no sub"}</Badge>
                <StatusBadge user={user} />
                <span className="text-xs text-muted-foreground">{user.exportCount} exports</span>
                <span className="text-xs text-muted-foreground">{user.providers || "—"}</span>
              </div>
            </button>

            {expandedUser === user.id && (
              <div className="px-5 pb-4 pt-0 border-t border-border/50">
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-xs mt-3">
                  <div>
                    <dt className="text-muted-foreground">User ID</dt>
                    <dd className="font-mono mt-0.5 break-all">{user.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Signed up</dt>
                    <dd className="mt-0.5">{formatDate(user.userCreatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Auth providers</dt>
                    <dd className="mt-0.5">{user.providers || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="mt-0.5 font-medium">{user.plan || "none"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-0.5">{user.status || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Billing period</dt>
                    <dd className="mt-0.5">{user.billingPeriod || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Polar subscription ID</dt>
                    <dd className="font-mono mt-0.5 break-all">{user.externalId || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Polar customer ID</dt>
                    <dd className="font-mono mt-0.5 break-all">{user.externalCustomerId || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Exports</dt>
                    <dd className="mt-0.5">{user.exportCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Trial start</dt>
                    <dd className="mt-0.5">{formatDate(user.trialStart)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Trial end</dt>
                    <dd className="mt-0.5">{formatDate(user.trialEnd)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Current period</dt>
                    <dd className="mt-0.5">
                      {user.currentPeriodStart || user.currentPeriodEnd
                        ? `${formatDate(user.currentPeriodStart)} → ${formatDate(user.currentPeriodEnd)}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Subscription created</dt>
                    <dd className="mt-0.5">{formatDate(user.subscriptionCreatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Subscription updated</dt>
                    <dd className="mt-0.5">{formatDate(user.subscriptionUpdatedAt)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
