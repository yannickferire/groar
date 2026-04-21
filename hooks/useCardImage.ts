import { useEffect, useRef, useState, useMemo } from "react";
import type { EditorSettings } from "@/components/editor/types";

/**
 * Fetches a card image from /api/card whenever settings change (debounced).
 * Returns a blob URL for display and the raw blob for export/copy.
 * Used by CardPreview (automation pages).
 */
export function useCardImage(settings: EditorSettings, delay = 100) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Stable serialized key — only triggers fetch when settings actually change
  const settingsJson = useMemo(() => JSON.stringify(settings), [settings]);

  // Debounce: only fire fetch after `delay` ms of no changes
  const [debouncedJson, setDebouncedJson] = useState(settingsJson);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedJson(settingsJson), delay);
    return () => clearTimeout(timer);
  }, [settingsJson, delay]);

  useEffect(() => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    fetch("/api/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: debouncedJson,
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Card API error: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;

        // Revoke previous object URL to avoid memory leaks
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);

        const objectUrl = URL.createObjectURL(blob);
        prevUrlRef.current = objectUrl;
        setImageUrl(objectUrl);
        setImageBlob(blob);
        setIsLoading(false);
      })
      .catch((err) => {
        // AbortError is expected when component unmounts or settings change quickly
        if (err.name === "AbortError") return;
        console.error("[useCardImage]", err);
        setIsLoading(false);
      });

    return () => {
      // Use abort with a reason so Sentry doesn't capture it as an unhandled error
      controller.abort("cleanup");
    };
  }, [debouncedJson]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  return { imageUrl, imageBlob, isLoading };
}
