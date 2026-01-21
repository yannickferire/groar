"use client";

import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

export default function Header() {
  const scrollToEditor = () => {
    const editor = document.getElementById("editor");
    if (editor) {
      editor.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <FadeIn delay={0} duration={0.6} direction="none">
      <header className="w-full max-w-4xl mx-auto mt-4 flex items-center justify-between py-4 mb-16">
        <Logo />
        <Button onClick={scrollToEditor} variant="default" size="default">
          <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} aria-hidden="true" />
          Try it
        </Button>
      </header>
    </FadeIn>
  );
}
