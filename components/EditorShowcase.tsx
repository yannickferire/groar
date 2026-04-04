"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, ChartLineData02Icon, Target01Icon, Menu02Icon } from "@hugeicons/core-free-icons";
import { Tilt3D } from "@/components/ui/tilt-3d";

const templates = [
  {
    name: "Milestone",
    icon: CrownIcon,
    tagline: "Turn wins into content",
    description: "1K followers, $10K MRR, first sale. Pick a number, add context, and share a visual your audience actually remembers.",
    image: "/proof-backgrounds/template-milestone.jpg",
  },
  {
    name: "Metrics",
    icon: ChartLineData02Icon,
    tagline: "Your numbers, one visual",
    description: "Pull up to 5 key metrics into a single image. Followers, revenue, stars, karma. No spreadsheet screenshot needed.",
    image: "/proof-backgrounds/metrics.jpg",
  },
  {
    name: "Progress",
    icon: Target01Icon,
    tagline: "Show the whole journey",
    description: "A progress bar from where you started to where you're headed. Perfect for fundraising, audience goals, or revenue targets.",
    image: "/proof-backgrounds/template-progress.jpg",
  },
  {
    name: "List",
    icon: Menu02Icon,
    tagline: "Ship it, then share it",
    description: "New features, changelog, weekly wins. List what you've built and let your audience follow along.",
    image: "/proof-backgrounds/template-list.jpg",
  },
];

const TEMPLATE_ASPECT = 605 / 1016;

function getDetachRatio(h: number) {
  return Math.min(0.7, Math.max(0.5, 0.7 - (h - 600) * (0.2 / 600)));
}

function computeFallbackPos(detachPoint: number, desktopEl: HTMLDivElement | null) {
  const desktopRect = desktopEl?.getBoundingClientRect();
  const pageWidth = desktopRect?.width ?? window.innerWidth;
  const pageLeft = desktopRect?.left ?? 0;
  const stickyWidth = Math.min(1024, pageWidth);
  const stickyLeft = pageLeft + (pageWidth - stickyWidth) / 2;
  const tplWidth = stickyWidth * 0.635;
  const tplLeft = stickyLeft + stickyWidth - tplWidth - stickyWidth * 0.01;
  const tplHeight = tplWidth * TEMPLATE_ASPECT;
  const computedTop = detachPoint - tplHeight / 2;
  return { top: computedTop, left: tplLeft, width: tplWidth };
}

export default function EditorShowcase() {
  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const detachedRef = useRef(false);
  const [detached, setDetached] = useState(false);
  const [fixedPos, setFixedPos] = useState({ top: 0, left: 0, width: 0 });
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [currentRotateX, setCurrentRotateX] = useState(0);

  // Mobile scroll
  const { scrollYProgress: mobileProgress } = useScroll({
    target: mobileRef,
    offset: ["start end", "center center"],
  });
  const mobileRotateX = useTransform(mobileProgress, [0, 1], [35, 0]);
  const mobileScale = useTransform(mobileProgress, [0, 1], [0.85, 1]);
  const mobileOpacity = useTransform(mobileProgress, [0, 0.3], [0, 1]);

  // Desktop scroll
  const { scrollYProgress } = useScroll({
    target: desktopRef,
    offset: ["start end", "end end"],
  });

  // Editor tilt: 35° → 0°, then fade out once flat
  const rotateX = useTransform(scrollYProgress, [0, 0.15], [35, 0]);
  const editorScale = useTransform(scrollYProgress, [0, 0.15], [0.85, 1]);
  const editorOpacity = useTransform(scrollYProgress, [0.2, 0.35], [1, 0]);

  // Phase 2: Title + template description appear
  const titleOpacity = useTransform(scrollYProgress, [0.32, 0.4], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.32, 0.4], [30, 0]);
  const descOpacity = useTransform(scrollYProgress, [0.38, 0.46], [0, 1]);
  const descY = useTransform(scrollYProgress, [0.38, 0.46], [20, 0]);

  // Detach + template switching
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Skip detach logic if desktop version is hidden (small viewport)
    if (window.innerWidth < 1024 || window.innerHeight < 600) return;

    const rect = templateRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Track current rotation for smooth detach
    const tiltProgress = Math.min(v / 0.15, 1);
    const currentTilt = 35 * (1 - tiltProgress);
    setCurrentRotateX(currentTilt);

    const templateCenter = rect.top + rect.height / 2;
    const h = window.innerHeight;
    const detachPoint = h * getDetachRatio(h);
    const shouldDetach = templateCenter <= detachPoint;

    if (shouldDetach !== detachedRef.current) {
      detachedRef.current = shouldDetach;
      setDetached(shouldDetach);
      if (shouldDetach) {
        if (rect.top > 0) {
          setFixedPos({ top: rect.top, left: rect.left, width: rect.width });
        } else {
          setFixedPos(computeFallbackPos(detachPoint, desktopRef.current));
        }
      }
    }

    // Template switching
    if (shouldDetach) {
      const newIndex = v >= 0.92 ? 3 : v >= 0.72 ? 2 : v >= 0.54 ? 1 : 0;
      setActiveTemplate(newIndex);
    }
  });

  // Recalculate fixedPos on window resize when detached, or force re-attach if viewport too small
  useEffect(() => {
    if (!detached) return;
    const onResize = () => {
      if (window.innerWidth < 1024 || window.innerHeight < 600) {
        detachedRef.current = false;
        setDetached(false);
        return;
      }
      const rect = templateRef.current?.getBoundingClientRect();
      if (!rect) return;
      const h = window.innerHeight;
      const detachPoint = h * getDetachRatio(h);
      if (rect.top > 0) {
        setFixedPos({ top: rect.top, left: rect.left, width: rect.width });
      } else {
        setFixedPos(computeFallbackPos(detachPoint, desktopRef.current));
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [detached]);

  const current = templates[activeTemplate];

  return (
    <section className="px-4">
      {/* Mobile — simple version (also shown on short desktop screens <600px tall) */}
      <div className="block [@media(min-width:1024px)_and_(min-height:600px)]:hidden max-w-5xl mx-auto" ref={mobileRef} style={{ perspective: "1200px" }}>
        <motion.div
          style={{ rotateX: mobileRotateX, scale: mobileScale, opacity: mobileOpacity, willChange: "transform, opacity" }}
          className="relative rounded-2xl overflow-hidden p-1.5 border-fade bg-background"
        >
          <Image
            src="/proof-backgrounds/editor-v2.jpg"
            alt="GROAR editor"
            width={1920}
            height={1080}
            sizes="100vw"
            className="w-full h-auto rounded-xl"
            priority
          />
          <Image
            src="/proof-backgrounds/template-milestone.jpg"
            alt="Milestone template preview"
            width={1016}
            height={605}
            sizes="50vw"
            priority
            className="absolute top-[1.5%] right-[1%] w-[63.5%] h-auto rounded-lg shadow-lg"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </motion.div>
      </div>

      {/* Preload template images */}
      <div className="hidden">
        {templates.slice(1).map((t) => (
          <Image key={t.name} src={t.image} alt="" width={1016} height={605} loading="eager" />
        ))}
      </div>

      {/* Desktop */}
      <div ref={desktopRef} className="hidden [@media(min-width:1024px)_and_(min-height:600px)]:block" style={{ height: "380vh" }}>
        <motion.div
          className="sticky top-0 max-w-5xl mx-auto"
          style={{ perspective: "1200px" }}
          initial={{ opacity: 0, rotateX: 20, translateY: 30 }}
          animate={{ opacity: 1, rotateX: 0, translateY: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <motion.div
            style={{
              rotateX,
              scale: editorScale,
              opacity: editorOpacity,
              willChange: "transform, opacity",
            }}
            className="relative"
          >
            {/* Editor image — has overflow-hidden */}
            <div
              className="rounded-2xl overflow-hidden p-2 border-fade bg-background"
            >
              <Image
                src="/proof-backgrounds/editor-v2.jpg"
                alt="GROAR editor"
                width={1920}
                height={1080}
                sizes="960px"
                className="w-full h-auto rounded-xl"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>

            {/* Template — OUTSIDE overflow-hidden, INSIDE tilt wrapper */}
            <div
              ref={templateRef}
              className="absolute top-[1.5%] right-[1%] w-[63.5%] z-10"
              style={{ visibility: detached ? "hidden" : "visible" }}
            >
              <Image
                src="/proof-backgrounds/template-milestone.jpg"
                alt="Milestone template preview"
                width={1016}
                height={605}
                sizes="500px"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Fixed overlay — always rendered to avoid Safari mount flash */}
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{ visibility: detached ? "visible" : "hidden" }}
        >
          {/* Title */}
          <motion.div
            style={{
              opacity: titleOpacity,
              y: titleY,
              position: "absolute",
              bottom: `calc(100% - ${fixedPos.top}px + 60px)`,
              left: 0,
              right: 0,
            }}
            className="text-center px-4"
          >
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
              4 templates to cover every occasion
            </h2>
            <p className="text-muted-foreground text-balance max-w-xl mx-auto">
              Whether you&apos;re celebrating a milestone, sharing growth, or shipping updates, there&apos;s a template for that.
            </p>
          </motion.div>

          {/* Template image */}
          <div
            style={{
              position: "absolute",
              top: fixedPos.top,
              left: fixedPos.left,
              width: fixedPos.width,
              perspective: "1200px",
            }}
          >
            <div
              style={{
                transform: `rotateX(${currentRotateX}deg)`,
                transformOrigin: "center center",
                transition: "transform 0.05s linear",
              }}
            >
              <Tilt3D className="relative rounded-lg overflow-hidden pointer-events-auto shadow-[0_8px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]" maxTilt={6} scale={1.01} glare>
                <AnimatePresence initial={false}>
                  <motion.div
                    key={current.image}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, position: "absolute", inset: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Image
                      src={current.image}
                      alt={`${current.name} template preview`}
                      width={1016}
                      height={605}
                      sizes="500px"
                                            className="w-full h-auto"
                    />
                    </motion.div>
                  </AnimatePresence>
              </Tilt3D>
            </div>
          </div>

          {/* Dots */}
          <div
            style={{
              position: "absolute",
              top: fixedPos.top + fixedPos.width * TEMPLATE_ASPECT + 16,
              left: fixedPos.left,
              width: fixedPos.width,
            }}
          >
            <motion.div
              style={{ opacity: descOpacity }}
              className="flex justify-center gap-2"
            >
              {templates.map((t, i) => (
                <div
                  key={t.name}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTemplate
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </motion.div>
          </div>

          {/* Description */}
          <div
            style={{
              position: "absolute",
              top: fixedPos.top,
              height: fixedPos.width * TEMPLATE_ASPECT,
              left: 16,
              right: `calc(100% - ${fixedPos.left}px + 32px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <motion.div
              style={{
                opacity: descOpacity,
                y: descY,
              }}
              className="max-w-sm"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <HugeiconsIcon icon={current.icon} size={20} strokeWidth={2} className="text-primary" />
                    <h3 className="text-2xl font-bold tracking-tight">{current.name}</h3>
                  </div>
                  <p className="text-lg font-medium mb-1">{current.tagline}</p>
                  <p className="text-muted-foreground text-balance">
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
    </section>
  );
}
