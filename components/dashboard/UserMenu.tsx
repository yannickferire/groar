"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, UserCircleIcon, CreditCardIcon, MoreVerticalIcon, Settings03Icon, DashboardSquare01Icon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import posthog from "posthog-js";
import { useTheme } from "next-themes";

const THEME_OPTIONS = [
  { value: "light", icon: Sun01Icon, label: "Light" },
  { value: "dark", icon: Moon02Icon, label: "Dark" },
] as const;

export default function UserMenu({ isAdmin }: { isAdmin?: boolean }) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    posthog.capture("sign_out", {
      user_id: session?.user?.id,
    });
    posthog.reset();
    await authClient.signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-2 py-1.5 w-full rounded-lg hover:bg-sidebar-accent transition-colors text-left">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "Avatar"}
              width={28}
              height={28}
              className="rounded-full shrink-0"
            />
          ) : (
            <HugeiconsIcon icon={UserCircleIcon} size={28} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
          )}
          <span className="text-sm truncate flex-1">
            {session?.user?.name || "Account"}
          </span>
          <HugeiconsIcon icon={MoreVerticalIcon} size={16} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/g0-ctrl" className="cursor-pointer text-blue-500">
              <HugeiconsIcon icon={DashboardSquare01Icon} size={16} strokeWidth={1.5} />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/plan" className="cursor-pointer">
            <HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={1.5} />
            Plan & Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="cursor-pointer">
            <HugeiconsIcon icon={Settings03Icon} size={16} strokeWidth={1.5} />
            Settings
          </Link>
        </DropdownMenuItem>
        <div className="px-2 py-1.5">
          <div className="grid grid-cols-2 p-1 rounded-lg bg-muted">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  theme === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HugeiconsIcon icon={opt.icon} size={14} strokeWidth={1.5} className="shrink-0" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer">
          <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.5} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
