"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { PlanType, TRIAL_DURATION_DAYS } from "@/lib/plans";
import posthog from "posthog-js";

function LoginContent() {
  const [loading, setLoading] = useState<"google" | "twitter" | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const planParam = searchParams.get("plan") as PlanType | null;
  const billingParam = searchParams.get("billing");
  const callbackUrlParam = searchParams.get("callbackUrl");

  // If already logged in (e.g. user pressed back after OAuth), redirect
  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  // Reset loading state when page becomes visible again (back button)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setLoading(null);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Determine callback URL based on params
  const getCallbackURL = () => {
    // Explicit callbackUrl takes priority (e.g., from trial signup flow)
    if (callbackUrlParam) {
      return callbackUrlParam;
    }
    if (!planParam) {
      // No plan selected, go to onboarding to choose
      return "/onboarding";
    }
    if (planParam === "free") {
      // Free plan, go directly to dashboard
      return "/dashboard";
    }
    // Paid plan, go directly to checkout
    const params = new URLSearchParams({ plan: planParam });
    if (billingParam) params.set("billing", billingParam);
    return `/checkout-redirect?${params.toString()}`;
  };

  const handleGoogle = () => {
    setLoading("google");
    posthog.capture("sign_in_started", {
      provider: "google",
      plan: planParam,
      is_trial: callbackUrlParam?.includes("trial=start") ?? false,
    });
    authClient.signIn.social({ provider: "google", callbackURL: getCallbackURL() });
  };

  const handleTwitter = () => {
    setLoading("twitter");
    posthog.capture("sign_in_started", {
      provider: "twitter",
      plan: planParam,
      is_trial: callbackUrlParam?.includes("trial=start") ?? false,
    });
    authClient.signIn.social({ provider: "twitter", callbackURL: getCallbackURL() });
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
            <h1 className="text-xl font-heading font-bold">
              {callbackUrlParam?.includes("trial=start")
                ? "Start your free trial"
                : planParam
                  ? `Get started with ${planParam === "free" ? "Free" : "Pro"}`
                  : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {callbackUrlParam?.includes("trial=start")
                ? `${TRIAL_DURATION_DAYS} days of Pro, free — no credit card required`
                : "Sign in to access your dashboard"}
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

        <div className="text-xs text-muted-foreground text-center space-y-2">
          <p className="text-balance">
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
          <p>
            <Link href="/" className="underline hover:text-foreground">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
