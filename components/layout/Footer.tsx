"use client";

import Link from "next/link";
import Logo from "./Logo";
import { FadeInView } from "@/components/ui/motion";

export default function Footer() {
  return (
    <FadeInView direction="down" distance={24} amount={0.8}>
      <footer className="w-full max-w-6xl mx-auto border-t border-border mt-12 md:mt-24">
        <div className="py-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <div className="flex flex-col items-center md:items-start gap-2 md:w-1/3 shrink-0">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Turn your social media metrics
              <br />
              into shareable visuals
            </p>
          </div>
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">Pages</h4>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Login
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">Compare</h4>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <Link href="/vs/canva" className="hover:text-foreground transition-colors">
                  vs Canva
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">Legal</h4>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">Made by</h4>
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
        </div>
      </footer>
    </FadeInView>
  );
}
