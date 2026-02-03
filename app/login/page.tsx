"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon, Loading03Icon } from "@hugeicons/core-free-icons";

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "twitter" | null>(null);

  const handleGoogle = () => {
    setLoading("google");
    authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  };

  const handleTwitter = () => {
    setLoading("twitter");
    authClient.signIn.social({ provider: "twitter", callbackURL: "/dashboard" });
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Link href="/">
          <Image
            src="/groar-logo.png"
            alt="Groar"
            width={280}
            height={75}
            priority
            className="h-auto w-60 sm:w-70"
          />
        </Link>

        <div className="w-full rounded-3xl border-fade p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-xl font-heading font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleTwitter}
              variant="default"
              size="xl"
              className="w-full"
              disabled={loading !== null}
            >
              {loading === "twitter" ? (
                <HugeiconsIcon icon={Loading03Icon} size={20} strokeWidth={2} className="animate-spin" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )}
              Continue with X
            </Button>

            <Button
              onClick={handleGoogle}
              variant="outline"
              size="lg"
              className="w-full"
              disabled={loading !== null}
            >
              {loading === "google" ? (
                <HugeiconsIcon icon={Loading03Icon} size={20} strokeWidth={2} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={GoogleIcon} size={20} strokeWidth={1.5} />
              )}
              Continue with Google
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
