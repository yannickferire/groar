"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeInView } from "@/components/ui/motion";

export default function MadeBy() {
  return (
    <section className="w-full max-w-md mx-auto py-4 px-4">
      <FadeInView>
        <div className="rounded-3xl border-fade p-6 md:p-8 flex flex-col items-center text-center gap-4">
          <Link
            href="https://x.com/yannick_ferire"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/yannick-ferire.jpg"
              alt="Yannick Ferire"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
            />
          </Link>
          <div>
            <h3 className="text-lg font-heading font-semibold mb-2">
              Made by{" "}
              <Link
                href="https://x.com/yannick_ferire"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                @yannick_ferire
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground text-balance relative">
              <span className="text-7xl text-primary/60 font-heading leading-none absolute -top-6 -left-6">&ldquo;</span>
              I started making visuals for my own Build&nbsp;In&nbsp;Public journey. People kept asking what tool I used, so I built it.
            </p>
          </div>
        </div>
      </FadeInView>
    </section>
  );
}
