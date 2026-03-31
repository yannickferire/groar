"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  proOnly?: boolean;
};

export default function ProGate({ children, proOnly }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => {
        const isPro = ["pro", "friend"].includes(d.plan);
        if (proOnly) {
          setAllowed(isPro && !d.isTrialing);
        } else {
          setAllowed(isPro);
        }
      })
      .catch(() => setAllowed(false));
  }, [proOnly]);

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="flex flex-col items-center justify-center space-y-6 max-w-md text-center">
          <p className="text-8xl">🦁</p>
          <h1 className="text-4xl font-bold font-heading">Pro feature</h1>
          <p className="text-xl text-muted-foreground">
            Only the king of the jungle can access this.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard/plan#plans">Upgrade to Pro</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
