"use client";

import Link from "next/link";
import Logo from "./Logo";
import { FadeInView } from "@/components/ui/motion";

export default function Footer() {
  return (
    <FadeInView direction="down" distance={24} amount={0.8}>
      <footer className="w-full max-w-6xl mx-auto border-t border-border mt-24">
        <div className="py-8 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Turn your social media metrics
              <br />
              into shareable visuals
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
            <a
              href="https://x.com/yannick_ferire"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              @yannick_ferire
            </a>
          </div>
        </div>
      </footer>
    </FadeInView>
  );
}
