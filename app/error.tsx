"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <p className="text-8xl">🙀</p>
        <h1 className="text-4xl font-bold font-heading">500</h1>
        <p className="text-xl text-muted-foreground">
          Something went wrong!
          <br />
          The tiger tripped on a cable.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/">
              Back home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
