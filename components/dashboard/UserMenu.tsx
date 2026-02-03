"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

export default function UserMenu() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
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
      <button
        onClick={handleSignOut}
        className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Sign out"
      >
        <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
