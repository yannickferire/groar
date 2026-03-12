"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Crown02Icon, Search01Icon, GiftIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type XAnalytics = {
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  impressionsCount: number;
  date: string;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  xUsername: string | null;
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
  xAnalytics: XAnalytics | null;
};

type FilterType = "all" | "pro" | "free" | "trial" | "trial_expired" | "no_sub";

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

function formatShortDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getUserCategory(user: UserRow): FilterType {
  // No subscription at all
  if (!user.plan && !user.status) return "no_sub";

  // Active paid plan (not trialing)
  if (user.status === "active" && user.plan && user.plan !== "free") return "pro";

  // Active trial
  if (user.status === "trialing" && user.trialEnd && new Date(user.trialEnd) > new Date()) return "trial";

  // Expired trial
  if (user.status === "trialing" && user.trialEnd && new Date(user.trialEnd) <= new Date()) return "trial_expired";

  // Free plan (active status but free plan)
  return "free";
}

function PlanBadge({ user }: { user: UserRow }) {
  const category = getUserCategory(user);

  switch (category) {
    case "pro":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <HugeiconsIcon icon={Crown02Icon} size={12} strokeWidth={2} />
          {user.plan}
        </Badge>
      );
    case "trial": {
      const daysLeft = user.trialEnd ? Math.ceil((new Date(user.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      return <Badge className="bg-primary/10 text-primary border-primary/30">trial ({daysLeft}d)</Badge>;
    }
    case "trial_expired":
      return <Badge variant="secondary" className="text-amber-600">trial expired</Badge>;
    case "free":
      return <Badge variant="outline">free</Badge>;
    case "no_sub":
      return <Badge variant="secondary" className="text-muted-foreground">no sub</Badge>;
  }
}

function UserAvatar({ user }: { user: UserRow }) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name || "User avatar"}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
      {(user.name || user.email || "?")[0].toUpperCase()}
    </div>
  );
}

const numberFormatter = new Intl.NumberFormat("fr-FR");

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [giftingPlan, setGiftingPlan] = useState(false);
  const [giftingPro, setGiftingPro] = useState(false);

  const handleGiftFriend = async (userId: string) => {
    setGiftingPlan(true);
    try {
      const res = await fetch("/api/admin/users/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: "friend" }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, plan: "friend", status: "active" } : u
        )
      );
      setSelectedUser((prev) =>
        prev && prev.id === userId ? { ...prev, plan: "friend", status: "active" } : prev
      );
    } catch {
      alert("Failed to update plan");
    } finally {
      setGiftingPlan(false);
    }
  };

  const handleGiftPro = async (userId: string) => {
    setGiftingPro(true);
    try {
      const res = await fetch("/api/admin/users/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: "pro" }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, plan: "pro", status: "active" } : u
        )
      );
      setSelectedUser((prev) =>
        prev && prev.id === userId ? { ...prev, plan: "pro", status: "active" } : prev
      );
    } catch {
      alert("Failed to update plan");
    } finally {
      setGiftingPro(false);
    }
  };

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

  const counts = useMemo(() => {
    const c = { all: 0, pro: 0, free: 0, trial: 0, trial_expired: 0, no_sub: 0 };
    for (const u of users) {
      c.all++;
      c[getUserCategory(u)]++;
    }
    return c;
  }, [users]);

  const stats = useMemo(() => {
    const proTrialUsers = users.filter((u) => {
      const cat = getUserCategory(u);
      return cat === "pro" || cat === "trial";
    });
    const proTrialWithExport = proTrialUsers.filter((u) => parseInt(u.exportCount) > 0);
    const exportRate = proTrialUsers.length > 0
      ? Math.round((proTrialWithExport.length / proTrialUsers.length) * 100)
      : 0;

    const expiredTrials = users.filter((u) => getUserCategory(u) === "trial_expired");
    const convertedTrials = users.filter((u) => {
      const cat = getUserCategory(u);
      return cat === "pro" && u.trialEnd;
    });
    const trialConversion = (expiredTrials.length + convertedTrials.length) > 0
      ? Math.round((convertedTrials.length / (expiredTrials.length + convertedTrials.length)) * 100)
      : 0;

    const totalExports = users.reduce((sum, u) => sum + parseInt(u.exportCount), 0);

    const activeUsers = proTrialUsers.length;
    const avgExports = activeUsers > 0
      ? Math.round((proTrialWithExport.reduce((sum, u) => sum + parseInt(u.exportCount), 0) / activeUsers) * 10) / 10
      : 0;

    return { exportRate, proTrialWithExport: proTrialWithExport.length, proTrialTotal: proTrialUsers.length, trialConversion, convertedTrials: convertedTrials.length, totalTrials: expiredTrials.length + convertedTrials.length, totalExports, avgExports, activeUsers };
  }, [users]);

  const filtered = useMemo(() => {
    let list = users;

    if (filter !== "all") {
      list = list.filter((u) => getUserCategory(u) === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.xUsername && u.xUsername.toLowerCase().includes(q))
      );
    }

    return list;
  }, [users, filter, search]);

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

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "pro", label: `Pro (${counts.pro})` },
    { key: "trial", label: `Trial (${counts.trial})` },
    { key: "trial_expired", label: `Expired (${counts.trial_expired})` },
    { key: "free", label: `Free (${counts.free})` },
    { key: "no_sub", label: `No sub (${counts.no_sub})` },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.all} users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/g0-ctrl/exports">Export Debug</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/g0-ctrl/stats">Export Stats</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Export rate (pro/trial)</p>
          <p className="text-2xl font-heading font-bold mt-1">{stats.exportRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stats.proTrialWithExport}/{stats.proTrialTotal} users</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Trial → Pro conversion</p>
          <p className="text-2xl font-heading font-bold mt-1">{stats.trialConversion}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stats.convertedTrials}/{stats.totalTrials} trials</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Total exports</p>
          <p className="text-2xl font-heading font-bold mt-1">{numberFormatter.format(stats.totalExports)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">all users</p>
        </div>
        <div className="rounded-xl border-fade p-4">
          <p className="text-xs text-muted-foreground">Avg exports / active user</p>
          <p className="text-2xl font-heading font-bold mt-1">{stats.avgExports}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stats.activeUsers} active users</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or X handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border-fade overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left font-medium px-4 py-3">User</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">X Handle</th>
              <th className="text-left font-medium px-4 py-3">Plan</th>
              <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">Exports</th>
              <th className="text-right font-medium px-4 py-3 hidden md:table-cell">Signed up</th>
              <th className="text-right font-medium px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{user.name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email || user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {user.xUsername ? (
                    <span className="text-xs text-muted-foreground">@{user.xUsername}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PlanBadge user={user} />
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">{user.exportCount}</span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{formatShortDate(user.userCreatedAt)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-muted-foreground">&rsaquo;</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <UserAvatar user={selectedUser} />
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="flex items-center gap-2">
                      {selectedUser.name || "—"}
                      {getUserCategory(selectedUser) === "pro" && (
                        <HugeiconsIcon icon={Crown02Icon} size={16} strokeWidth={2} className="text-amber-500" />
                      )}
                    </DialogTitle>
                    <DialogDescription className="truncate">
                      {selectedUser.email}
                      {selectedUser.xUsername && ` · @${selectedUser.xUsername}`}
                    </DialogDescription>
                    <div className="mt-1.5">
                      <PlanBadge user={selectedUser} />
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                {/* Account */}
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Account</h3>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">User ID</dt>
                      <dd className="font-mono text-xs mt-0.5 break-all">{selectedUser.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Signed up</dt>
                      <dd className="mt-0.5 text-xs">{formatDate(selectedUser.userCreatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Auth providers</dt>
                      <dd className="mt-0.5 text-xs">{selectedUser.providers || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Exports</dt>
                      <dd className="mt-0.5 text-xs font-medium">{selectedUser.exportCount}</dd>
                    </div>
                  </dl>
                </section>

                {/* Subscription */}
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Subscription</h3>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Plan</dt>
                      <dd className="mt-0.5 text-xs font-medium">{selectedUser.plan || "none"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Status</dt>
                      <dd className="mt-0.5 text-xs">{selectedUser.status || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Billing period</dt>
                      <dd className="mt-0.5 text-xs">{selectedUser.billingPeriod || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Current period</dt>
                      <dd className="mt-0.5 text-xs">
                        {selectedUser.currentPeriodStart || selectedUser.currentPeriodEnd
                          ? `${formatShortDate(selectedUser.currentPeriodStart)} → ${formatShortDate(selectedUser.currentPeriodEnd)}`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Polar subscription ID</dt>
                      <dd className="font-mono text-xs mt-0.5 break-all">{selectedUser.externalId || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Polar customer ID</dt>
                      <dd className="font-mono text-xs mt-0.5 break-all">{selectedUser.externalCustomerId || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Subscription created</dt>
                      <dd className="mt-0.5 text-xs">{formatDate(selectedUser.subscriptionCreatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Subscription updated</dt>
                      <dd className="mt-0.5 text-xs">{formatDate(selectedUser.subscriptionUpdatedAt)}</dd>
                    </div>
                  </dl>
                  <div className="flex gap-2 mt-3">
                    {getUserCategory(selectedUser) !== "pro" && selectedUser.plan !== "friend" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={giftingPlan}
                        onClick={() => handleGiftFriend(selectedUser.id)}
                      >
                        <HugeiconsIcon icon={GiftIcon} size={14} strokeWidth={2} />
                        {giftingPlan ? "Gifting..." : "Gift Friend plan"}
                      </Button>
                    )}
                    {getUserCategory(selectedUser) !== "pro" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={giftingPro}
                        onClick={() => handleGiftPro(selectedUser.id)}
                      >
                        <HugeiconsIcon icon={Crown02Icon} size={14} strokeWidth={2} />
                        {giftingPro ? "Gifting..." : "Gift Pro plan"}
                      </Button>
                    )}
                  </div>
                </section>

                {/* Trial */}
                {(selectedUser.trialStart || selectedUser.trialEnd) && (
                  <section>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Trial</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Trial start</dt>
                        <dd className="mt-0.5 text-xs">{formatDate(selectedUser.trialStart)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Trial end</dt>
                        <dd className="mt-0.5 text-xs">{formatDate(selectedUser.trialEnd)}</dd>
                      </div>
                    </dl>
                  </section>
                )}

                {/* X Analytics */}
                {selectedUser.xAnalytics && (
                  <section>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      X Analytics
                      <span className="ml-2 font-normal normal-case">({formatShortDate(selectedUser.xAnalytics.date)})</span>
                    </h3>
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Followers</dt>
                        <dd className="mt-0.5 text-xs font-medium">{numberFormatter.format(selectedUser.xAnalytics.followersCount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Following</dt>
                        <dd className="mt-0.5 text-xs">{numberFormatter.format(selectedUser.xAnalytics.followingCount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Tweets</dt>
                        <dd className="mt-0.5 text-xs">{numberFormatter.format(selectedUser.xAnalytics.tweetCount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Impressions</dt>
                        <dd className="mt-0.5 text-xs">{numberFormatter.format(selectedUser.xAnalytics.impressionsCount)}</dd>
                      </div>
                    </dl>
                  </section>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
