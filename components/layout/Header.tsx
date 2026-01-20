"use client";

import Logo from "./Logo";
import { FadeIn } from "@/components/ui/motion";

export default function Header() {
  return (
    <FadeIn delay={0} duration={0.6} direction="none">
      <header className="w-full max-w-4xl mx-auto mt-4 flex items-center justify-between py-4 mb-16">
        <Logo />
      </header>
    </FadeIn>
  );
}
