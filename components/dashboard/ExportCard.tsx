"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import Image from "next/image";

type ExportCardProps = {
  id: string;
  imageUrl: string;
  handle?: string;
  createdAt: string;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + `, ${time}`;
}

export default function ExportCard({ id, imageUrl, handle, createdAt }: ExportCardProps) {
  return (
    <div className="group">
      <div className="rounded-2xl overflow-hidden">
        <div className="aspect-video relative">
          <Image
            src={imageUrl}
            alt="Export"
            fill
            className="object-cover"
          />
          <Link
            href={`/dashboard/editor?import=${id}`}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <span className="text-white text-sm font-medium flex items-center gap-1.5">
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
              Import in editor
            </span>
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[10px] text-muted-foreground">
          {handle || "X"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatDate(createdAt)}
        </span>
      </div>
    </div>
  );
}

export function ExportCardSkeleton() {
  return (
    <div>
      <div className="rounded-2xl overflow-hidden">
        <div className="aspect-video bg-sidebar" />
      </div>
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="h-2.5 w-14 bg-sidebar rounded" />
        <div className="h-2.5 w-16 bg-sidebar rounded" />
      </div>
    </div>
  );
}
