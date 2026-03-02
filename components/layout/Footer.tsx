"use client";

import Link from "next/link";
import Logo from "./Logo";
import { FadeInView } from "@/components/ui/motion";

export default function Footer() {
  return (
    <FadeInView direction="down" distance={24} amount={0.8}>
      <footer className="w-full max-w-6xl mx-auto border-t border-border mt-12 md:mt-24">
        <div className="py-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <div className="flex flex-col items-center md:items-start gap-2 md:w-2/5 shrink-0">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Turn your social media metrics
              <br />
              into shareable visuals
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 items-start w-full">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">Pages</h4>
              <div className="flex flex-col gap-1 text-sm text-foreground/60">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link href="/open" className="hover:text-foreground transition-colors">
                  Open Stats
                </Link>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Login
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">Compare</h4>
              <div className="flex flex-col gap-1 text-sm text-foreground/60">
                <Link href="/vs/canva" className="hover:text-foreground transition-colors">
                  vs Canva
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">Legal</h4>
              <div className="flex flex-col gap-1 text-sm text-foreground/60">
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
                className="text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                @yannick_ferire
              </a>
            </div>
          </div>
        </div>
        <div className="pb-8 flex items-center justify-start gap-4">
          <a href="https://launch.cab/product/groar" target="_blank" rel="noopener noreferrer">
            <img src="https://launch.cab/api/badges/img/218fb417-54b1-4dab-a291-fa86e793bb74.svg?t=218fb417-54b1-4dab-a291-fa86e793bb74.1772116152241.d4789835032b82a6.96cc9b948c18afbe&tagline=TOP+%23%7Brank%7D&logoPosition=left" alt="Featured on launch.cab" />
          </a>
          <a href="https://www.foundrlist.com/product/groar" target="_blank" rel="noopener noreferrer">
            <img src="https://www.foundrlist.com/api/badge/groar" alt="Live on FoundrList" width="140" height="56" />
          </a>
        </div>
      </footer>
    </FadeInView>
  );
}
