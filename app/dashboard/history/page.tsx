"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ExportsEmptyState from "@/components/dashboard/ExportsEmptyState";
import ExportCard, { ExportCardSkeleton } from "@/components/dashboard/ExportCard";

type Export = {
  id: string;
  imageUrl: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

const INITIAL_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export default function HistoryPage() {
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const fetchExports = useCallback(async () => {
    try {
      const res = await fetch("/api/exports");
      const data = await res.json();
      setExports(data.exports || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExports();
  }, [fetchExports]);

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, exports.length));
  };

  const hasExports = exports.length > 0;
  const visibleExports = exports.slice(0, visibleCount);
  const hasMore = visibleCount < exports.length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your created visuals.
          </p>
        </div>
        {hasExports && (
          <Button asChild variant="default">
            <Link href="/dashboard/editor">
              <HugeiconsIcon icon={AddSquareIcon} size={18} strokeWidth={2} />
              Create new
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
          {[...Array(INITIAL_COUNT)].map((_, i) => (
            <ExportCardSkeleton key={i} />
          ))}
        </div>
      ) : hasExports ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
            {visibleExports.map((exp) => (
              <ExportCard
                key={exp.id}
                id={exp.id}
                imageUrl={exp.imageUrl}
                handle={(exp.metrics as { handle?: string }).handle}
                createdAt={exp.createdAt}
                isPremium
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <ExportsEmptyState />
      )}
    </div>
  );
}
