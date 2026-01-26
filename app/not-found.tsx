import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <p className="text-8xl">🐯</p>
        <h1 className="text-4xl font-bold font-heading">404</h1>
        <p className="text-xl text-muted-foreground">
          This page has gone extinct.
          <br />
          Even tigers can&apos;t track it down.
        </p>
        <Button asChild size="lg">
          <Link href="/">
            Back home
          </Link>
        </Button>
      </div>
    </main>
  );
}
