"use client";

import Image from "next/image";
import { FadeInView } from "@/components/ui/motion";

const templates = [
  { src: "/proof-backgrounds/metrics.jpg", alt: "Metrics template — monthly growth recap", rotate: "-14deg", x: "-35%", y: "50px", width: "80%", delay: 0.4 },
  { src: "/proof-backgrounds/milestone.jpg", alt: "Milestone template — 2,000 followers celebration", rotate: "-2deg", x: "0%", y: "-65px", width: "92%", delay: 0.6 },
  { src: "/proof-backgrounds/progress.jpg", alt: "Progress template — 1M impressions goal tracker", rotate: "12deg", x: "35%", y: "80px", width: "75%", delay: 0.9 },
];

export default function ProofSection() {
  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto py-4 overflow-hidden md:overflow-visible">
      <FadeInView>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
            Turn raw data into scroll-stopping content
          </h2>
          <p className="text-muted-foreground">
            Your analytics are powerful. Make them look awesome.
          </p>
        </div>
      </FadeInView>

      {/* Responsive layout: vertical on mobile, horizontal on desktop */}
      <div className="flex flex-col md:flex-row items-center relative gap-8 md:gap-0 overflow-visible mx-4 md:mx-0">
        {/* Graph */}
        <FadeInView delay={0.1} direction="up" className="w-full md:w-2/5 md:shrink-0 overflow-visible">
          <div className="relative rounded-2xl overflow-hidden">
            <Image
              src="/proof-backgrounds/graph.jpg"
              alt="Raw analytics dashboard showing impressions, follows, posts and replies charts"
              width={1200}
              height={758}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="w-full h-auto"
            />
            <div className="absolute top-2 left-2 bg-foreground/80 backdrop-blur-sm text-background text-xs font-medium px-3 py-1.5 rounded-full">
              Your analytics
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden ml-2 -mt-16 rotate-4 w-[105%]">
            <Image
              src="/proof-backgrounds/graph-2.jpg"
              alt="Analytics metrics — impressions, engagement, likes, reposts and more"
              width={1200}
              height={280}
              sizes="(max-width: 768px) 100vw, 42vw"
              className="w-full h-auto"
            />
          </div>
        </FadeInView>

        {/* Arrow + stat */}
        <FadeInView delay={0.2} direction="none">
          <div className="z-100 flex flex-row md:flex-col items-center gap-2 -mt-8 mb-2 md:-mt-10 md:mb-0">
            <p className="md:absolute text-center leading-none whitespace-nowrap"><strong className="text-primary text-xl block">2.5x</strong> more engagement</p>
            <svg className="w-32 h-32 md:w-48 md:h-48 text-foreground/70 rotate-90 md:rotate-0" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Hand-drawn style arrow */}
              <path d="M8 26c4-2 10-3 16-2s10 2 14 1" />
              <path d="M32 18c2 3 5 6 6 8-3 0-6 1-9 3" />
            </svg>
          </div>
        </FadeInView>

        {/* Stacked templates with rotation */}
        <div className="w-full max-w-sm mx-auto md:max-w-none md:mx-0 md:flex-1 relative h-64 md:h-100">
          {templates.map((template, index) => (
            <FadeInView
              key={index}
              delay={template.delay}
              direction="up"
              className="absolute inset-0 flex items-center justify-center"
              style={{
                zIndex: index === 2 ? 3 : index === 1 ? 2 : 1,
              }}
            >
              <div
                className="rounded-2xl overflow-hidden shadow-xl border border-white/10"
                style={{
                  width: template.width,
                  transform: `rotate(${template.rotate}) translateX(${template.x}) translateY(${template.y})`,
                }}
              >
                <Image
                  src={template.src}
                  alt={template.alt}
                  width={1200}
                  height={675}
                  sizes="(max-width: 768px) 80vw, 30vw"
                  className="w-full h-auto"
                />
              </div>
            </FadeInView>
          ))}
        </div>
      </div>

      <FadeInView delay={0.3}>
        <p className="text-center text-sm text-muted-foreground mt-24 md:mt-16">
          Dozens of backgrounds. Infinite combinations.
        </p>
      </FadeInView>
    </section>
  );
}
