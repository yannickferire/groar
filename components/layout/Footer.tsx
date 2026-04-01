"use client";

import Link from "next/link";
import Logo from "./Logo";
import { FadeInView } from "@/components/ui/motion";

export default function Footer() {
  return (
    <FadeInView direction="down" distance={24} amount={0.2}>
      <footer className="w-full max-w-6xl mx-auto border-t border-border mt-12 md:mt-24 px-4">
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
                <Link href="/leaderboard" className="hover:text-foreground transition-colors">
                  Leaderboard
                </Link>
                <Link href="/wall" className="hover:text-foreground transition-colors">
                  Community Wall
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
                <Link href="/vs" className="hover:text-foreground transition-colors">
                  Compare
                </Link>
                <Link href="/vs/screenshots" className="hover:text-foreground transition-colors">
                  vs Screenshots
                </Link>
                <Link href="/vs/canva" className="hover:text-foreground transition-colors">
                  vs Canva
                </Link>
                <Link href="/vs/piktochart" className="hover:text-foreground transition-colors">
                  vs Piktochart
                </Link>
                <Link href="/vs/image-charts" className="hover:text-foreground transition-colors">
                  vs Image-Charts
                </Link>
                <Link href="/vs/spreadsheets" className="hover:text-foreground transition-colors">
                  vs Spreadsheets
                </Link>
                <Link href="/vs/build-in-public" className="hover:text-foreground transition-colors">
                  Build in Public
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
        <div className="pb-8 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-start gap-4">
            <a href="https://peerpush.net/p/groar" target="_blank" rel="noopener">
              <img loading="lazy" src="https://peerpush.net/p/groar/badge.png" alt="🐯 GROAR badge" className="h-12 w-auto" />
            </a>
            <a href="https://rankinpublic.xyz/products/groar.app" target="_blank" rel="noopener noreferrer">
              <img loading="lazy" src="https://rankinpublic.xyz/api/badges/badge2.png?site=groar.app" alt="Featured on RankInPublic" width="250" height="80" className="h-12 w-auto" />
            </a>
            <a href="https://everfeatured.com/products/groar-1773139535336" target="_blank" rel="noopener noreferrer">
              <img loading="lazy" src="https://everfeatured.com/badge/groar-1773139535336?theme=light" alt="Featured on EverFeatured" width="380" height="72" className="h-12 w-auto" />
            </a>
            <a href="https://launch.cab/product/groar" target="_blank" rel="noopener noreferrer">
              <img loading="lazy" src="https://launch.cab/api/badges/img/218fb417-54b1-4dab-a291-fa86e793bb74.svg?t=218fb417-54b1-4dab-a291-fa86e793bb74.1772116152241.d4789835032b82a6.96cc9b948c18afbe&tagline=TOP+%23%7Brank%7D&logoPosition=left" alt="Featured on launch.cab" />
            </a>
          </div>
          <div className="flex items-center justify-start gap-4">
            <a href="https://findly.tools/groar?utm_source=groar" target="_blank" rel="noopener noreferrer">
              <img loading="lazy" src="https://findly.tools/badges/findly-tools-badge-light.svg" alt="Featured on Findly.tools" className="h-12 w-auto" />
            </a>
            <a href="https://twelve.tools" target="_blank" rel="noopener noreferrer">
              <img loading="lazy" src="https://twelve.tools/badge0-white.svg" alt="Featured on Twelve Tools" className="h-12" />
            </a>
            <a href="https://wired.business" target="_blank" rel="noopener noreferrer">
              <img loading="lazy" src="https://wired.business/badge0-white.svg" alt="Featured on Wired Business" className="max-h-12" />
            </a>
            <a href="https://www.stackco.st/tool/groar" target="_blank" rel="noopener noreferrer">
              <img loading="lazy" src="https://www.stackco.st/api/badge/tool/groar" alt="Featured on stackco.st — Groar" height="54" className="h-[44px] w-auto border border-border rounded-md" />
            </a>
            <a href="https://neeed.directory/products/groar?utm_source=groar" target="_blank" rel="noopener">
              <img loading="lazy" src="https://neeed.directory/badges/neeed-badge-light.svg" alt="Featured on neeed.directory" width="139" className="h-12" />
            </a>
            <a href="https://www.foundrlist.com/product/groar" target="_blank" rel="noopener noreferrer" className="-ml-3 -mr-3">
              <img loading="lazy" src="https://www.foundrlist.com/api/badge/groar" alt="Live on FoundrList" width="140" height="56" className="h-14 -my-1" />
            </a>
            <a href="https://ufind.best/products/groar?utm_source=ufind.best" target="_blank" rel="noopener">
              <img loading="lazy" src="https://ufind.best/badges/ufind-best-badge-light.svg" alt="Featured on ufind.best" width="150" className="h-12" />
            </a>
          </div>
        </div>
      </footer>
    </FadeInView>
  );
}
