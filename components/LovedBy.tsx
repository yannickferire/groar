"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, UserCircleIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

type LovedByData = {
  totalUsers: number;
  avatars: Array<{ image: string; name: string | null }>;
};

const numberFormatter = new Intl.NumberFormat("fr-FR");
export default function LovedBy() {
  const [lovedBy, setLovedBy] = useState<LovedByData>({
    totalUsers: 0,
    avatars: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/loved-by");
        const data = await response.json();
        if (!cancelled) {
          setLovedBy({
            totalUsers: Number(data.totalUsers ?? 0),
            avatars: Array.isArray(data.avatars) ? data.avatars : [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-2">
        <HugeiconsIcon icon={FavouriteIcon} size={18} strokeWidth={2} />
        Loved by
      </p>
      <div className="flex items-center justify-center">
        <div className="flex items-center -space-x-2">
          {loading ? (
            [...Array(5)].map((_, index) => (
              <div
                key={`avatar-skeleton-${index}`}
                className="h-9 w-9 rounded-full bg-sidebar"
              />
            ))
          ) : (
            lovedBy.avatars.map((avatar, index) => (
              <div
                key={`avatar-${index}-${avatar.image}`}
                className="h-9 w-9 rounded-full overflow-hidden border border-border bg-sidebar flex items-center justify-center"
              >
                {avatar.image ? (
                  <Image
                    src={avatar.image}
                    alt={avatar.name || "Avatar"}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <HugeiconsIcon icon={UserCircleIcon} size={22} strokeWidth={1.5} />
                )}
              </div>
            ))
          )}
        </div>
        {lovedBy.totalUsers > lovedBy.avatars.length && (
          <span className="ml-3 px-2.5 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground">
            +{numberFormatter.format(lovedBy.totalUsers)} creators
          </span>
        )}
      </div>
    </div>
  );
}
