"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import Testimonials from "@/components/Testimonials";
import VsCta from "@/components/VsCta";
import VsFaq from "@/components/VsFaq";
import { faqs } from "@/lib/faqs";

const MAX_ITEMS = 48;

type CommunityExport = {
  id: string;
  imageUrl: string;
  createdAt: string;
  userName: string;
  xUsername: string | null;
  userImage: string | null;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const GRID = "grid grid-cols-1 min-[800px]:grid-cols-2 min-[1100px]:grid-cols-3 min-[1400px]:grid-cols-4 gap-4";

function Skeleton() {
  return (
    <div>
      <div className="rounded-2xl overflow-hidden">
        <div className="aspect-video bg-sidebar animate-pulse" />
      </div>
      <div className="flex items-center justify-between mt-1.5 px-1">
        <div className="h-2.5 w-20 bg-sidebar rounded animate-pulse" />
        <div className="h-2.5 w-14 bg-sidebar rounded animate-pulse" />
      </div>
    </div>
  );
}

function WallCard({ exp, priority = false }: { exp: CommunityExport; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div>
      <div className="rounded-2xl overflow-hidden bg-sidebar">
        {!loaded && <div className="aspect-video animate-pulse" />}
        <Image
          src={exp.imageUrl}
          alt={`Visual by ${exp.userName}`}
          width={1200}
          height={675}
          sizes="(max-width: 800px) 100vw, (max-width: 1100px) 50vw, (max-width: 1400px) 33vw, 25vw"
          className={`w-full h-auto transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          onLoad={() => setLoaded(true)}
        />
      </div>
      {loaded && (
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            {exp.userImage && (
              <Image src={exp.userImage} alt={`${exp.xUsername ? `@${exp.xUsername}` : exp.userName || "Creator"} profile`} width={16} height={16} className="w-4 h-4 rounded-full" />
            )}
            {exp.xUsername ? `@${exp.xUsername}` : exp.userName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatDate(exp.createdAt)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const [exports, setExports] = useState<CommunityExport[]>([]);
  const [totalExports, setTotalExports] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/exports/community?cursor=${encodeURIComponent(cursor)}`
      : "/api/exports/community";
    const res = await fetch(url);
    return res.json() as Promise<{ exports: CommunityExport[]; nextCursor: string | null; totalExports?: number }>;
  }, []);

  useEffect(() => {
    fetchPage()
      .then((data) => {
        setExports(data.exports);
        setNextCursor(data.nextCursor);
        if (data.totalExports !== undefined) setTotalExports(data.totalExports);
      })
      .finally(() => setLoading(false));
  }, [fetchPage]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const canLoadMore = nextCursor && exports.length < MAX_ITEMS;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          fetchPage(nextCursor).then((data) => {
            setExports((prev) => [...prev, ...data.exports]);
            setNextCursor(data.nextCursor);
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchPage, canLoadMore]);

  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 flex flex-col items-center py-8 md:py-16 mt-4 gap-24">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Community Wall
          </h1>
          <p className="text-muted-foreground">
            Latest visuals made by 🐯 GROAR users
            {totalExports != null && totalExports > 0 && (
              <span className="text-muted-foreground/60"> &middot; {totalExports.toLocaleString()} exported so far</span>
            )}
          </p>
        </div>

        <div className="w-full max-w-screen-2xl -mt-6">
          {loading ? (
            <div className={GRID}>
              {[...Array(12)].map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : exports.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">
              No creations yet. Be the first!
            </p>
          ) : (
            <>
              <div className={GRID}>
                {exports.map((exp, i) => (
                  <WallCard key={exp.id} exp={exp} priority={i < 8} />
                ))}
              </div>
              {canLoadMore && (
                <div ref={sentinelRef} className={`${GRID} pt-4`}>
                  {[...Array(12)].map((_, i) => <Skeleton key={i} />)}
                </div>
              )}
            </>
          )}
        </div>

        <div className="w-full">
          <Testimonials />
        </div>

        <div className="w-full max-w-3xl">
          <VsCta title="Want to join the wall?" />
        </div>

        <section className="w-full max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
          <VsFaq faqs={faqs} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
