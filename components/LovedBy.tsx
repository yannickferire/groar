"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

type LovedByData = {
  totalUsers: number;
  avatars: Array<{ image: string; name: string | null }>;
};

const numberFormatter = new Intl.NumberFormat("fr-FR");
const DISPLAY_COUNT = 5;

export default function LovedBy() {
  const [lovedBy, setLovedBy] = useState<LovedByData>({
    totalUsers: 0,
    avatars: [],
  });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

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

  const displayed: Array<{ image: string; name: string | null; originalIndex: number }> = [];
  for (let i = 0; i < lovedBy.avatars.length && displayed.length < DISPLAY_COUNT; i++) {
    if (!failed[i]) {
      displayed.push({ ...lovedBy.avatars[i], originalIndex: i });
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center -space-x-2">
        {loading ? (
          [...Array(DISPLAY_COUNT)].map((_, index) => (
            <div
              key={`avatar-skeleton-${index}`}
              className="h-9 w-9 rounded-full bg-sidebar"
            />
          ))
        ) : (
          displayed.map((avatar) => (
            <div
              key={`avatar-${avatar.originalIndex}-${avatar.image}`}
              className="h-9 w-9 rounded-full overflow-hidden border border-border bg-sidebar flex items-center justify-center"
            >
              {avatar.image ? (
                <Image
                  src={avatar.image}
                  alt={avatar.name || "Avatar"}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  onError={() => setFailed((prev) => ({ ...prev, [avatar.originalIndex]: true }))}
                />
              ) : (
                <HugeiconsIcon icon={UserCircleIcon} size={22} strokeWidth={1.5} />
              )}
            </div>
          ))
        )}
      </div>
      {loading ? (
        <div className="ml-3 h-6 w-36 rounded-full bg-sidebar animate-pulse" />
      ) : lovedBy.totalUsers > DISPLAY_COUNT ? (
        <span className="ml-3 px-2.5 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground">
          {Math.floor(lovedBy.totalUsers / 10) * 10}+ creators<span className="hidden md:inline">, join them!</span>
        </span>
      ) : null}
    </div>
  );
}
