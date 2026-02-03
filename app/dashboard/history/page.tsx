"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddSquareIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import ExportsEmptyState from "@/components/dashboard/ExportsEmptyState";

type Export = {
  id: string;
  imageUrl: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

export default function HistoryPage() {
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);

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

  const hasExports = exports.length > 0;

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="aspect-video bg-sidebar" />
            </div>
          ))}
        </div>
      ) : hasExports ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exports.map((exp) => (
            <div
              key={exp.id}
              className="rounded-2xl border-fade overflow-hidden"
            >
              <div className="aspect-video relative">
                <Image
                  src={exp.imageUrl}
                  alt="Export"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ExportsEmptyState />
      )}
    </div>
  );
}
