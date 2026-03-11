"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export default function EditorPreview() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [45, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={ref} className="w-full max-w-5xl mx-auto -mt-4 md:-mt-12" style={{ perspective: "1200px" }}>
      <motion.div
        style={{ rotateX, scale, opacity }}
        className="relative rounded-2xl overflow-hidden p-1.5 md:p-2 bg-fade"
      >
        <Image
          src="/proof-backgrounds/editor.jpg"
          alt="GROAR editor — create beautiful visuals from your analytics in seconds"
          width={1920}
          height={1080}
          sizes="(max-width: 768px) 100vw, 1152px"
          className="w-full h-auto rounded-xl"
          priority
        />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </motion.div>
    </section>
  );
}
