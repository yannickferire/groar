"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { FadeInView } from "@/components/ui/motion";
import XIcon from "@/components/icons/XIcon";

type Tweet = {
  author: string;
  handle: string;
  verified: boolean;
  text: string;
  url: string;
  avatar: string;
  badge?: string;
};

const TWEETS: Tweet[] = [
  {
    author: "Emrik LECOMTE",
    handle: "EmrikLecomte",
    verified: true,
    text: "Bro, I know you have 12 years of experience in frontend but **the UI of Groar is a masterclass**. I'm not exaggerating. I'm not trying to flatter you. I really think the UI is so well designed. I love it!",
    url: "https://x.com/EmrikLecomte/status/2026421376978932069",
    avatar: "/testimonials/EmrikLecomte.jpg",
  },
  {
    author: "Stefan Rows",
    handle: "StefanRows",
    verified: true,
    text: "Been using groar.app to turn my X metrics into shareable visuals. **Dead simple** — pick your stats, choose a background, download. **Takes 10 seconds**. Nice tool by @yannick_ferire",
    url: "https://x.com/StefanRows/status/2023361398395596861",
    avatar: "/testimonials/StefanRows.jpg",
  },
  {
    author: "Nowshad Hossain",
    handle: "nhrdev",
    verified: true,
    text: "Thanks a lot @yannick_ferire for making these visuals creation that easy using groar.app",
    url: "https://x.com/nhrdev/status/2026321650895999168",
    avatar: "/testimonials/nhrdev.jpg",
  },
  {
    author: "Daniel Merrick",
    handle: "danmerrick117",
    verified: true,
    text: "So cool, especially how **smooth setting it up is**. Had my first graphic made in ~1min after signing up. **One happy customer here!**",
    url: "https://x.com/danmerrick117",
    avatar: "/testimonials/danmerrick117.jpg",
    badge: "First customer ever",
  },
  {
    author: "Özhan Yılmaz",
    handle: "ozhan_dev",
    verified: true,
    text: "Thanks man! **Groar looks cool**. Sharing milestones with images really works for me growing and having **a good design for sharable milestone** is really great idea.",
    url: "https://x.com/ozhan_dev",
    avatar: "/testimonials/ozhan_dev.jpg",
  },
  {
    author: "jim | FixMyLanding",
    handle: "jimdin79",
    verified: true,
    text: "**Groar is a sick tool**, and I am sure you will grow it to the moon!",
    url: "https://x.com/jimdin79",
    avatar: "/testimonials/jimdin79.jpg",
  },
  {
    author: "Ardent_dev",
    handle: "ardent__dev",
    verified: true,
    text: "Huge shoutout to @yannick_ferire for the amazing visual tool (GROAR) **the visuals are awesome** and somehow they even **boost reach**. No idea how, but it works.",
    url: "https://x.com/ardent__dev/status/2031345006703947937",
    avatar: "/testimonials/ardent__dev.jpg",
  },
  {
    author: "Ramit Koul",
    handle: "ramitkoul",
    verified: true,
    text: "this is a **must have tool**. everyone building in public should try this out.",
    url: "https://x.com/ramitkoul",
    avatar: "/testimonials/ramitkoul.jpg",
  },
  {
    author: "R.",
    handle: "RichDoesTech",
    verified: true,
    text: "I was gonna use for free but it was so good **I ended up purchasing before even exporting** 😅",
    url: "https://x.com/RichDoesTech",
    avatar: "/testimonials/RichDoesTech.jpg",
  },
];


function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <a
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[320px] shrink-0 rounded-2xl border border-white/10 bg-black p-4 font-sans"
    >
      {/* Header row: avatar + name/handle + X logo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tweet.avatar}
            alt={tweet.author}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px] text-white truncate">{tweet.author}</span>
              {tweet.verified && (
                <HugeiconsIcon icon={CheckmarkBadge02Icon} size={16} className="text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[13px] text-[#71767b]">@{tweet.handle}</p>
          </div>
        </div>
        <XIcon className="w-4 h-4 text-[#71767b] shrink-0 mt-1" />
      </div>

      {/* Badge */}
      {tweet.badge && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <span>★</span>
          {tweet.badge}
        </div>
      )}

      {/* Tweet body */}
      <p className={`${tweet.badge ? "mt-2" : "mt-3"} text-[15px] leading-[1.45] text-[#e7e9ea]`}>
        {tweet.text.split(/(\*\*[^*]+\*\*|[@#][\w]+|https?:\/\/\S+|[\w]+\.[\w]+\.?\w*)/g).map((part, i) =>
          /^\*\*/.test(part) ? (
            <span key={i} className="text-white font-semibold bg-primary/40 px-1 py-0.5 -my-px">{part.slice(2, -2)}</span>
          ) : /^[@#]/.test(part) || /^https?:\/\//.test(part) || /^[\w]+\.[\w]+/.test(part) ? (
            <span key={i} className="text-[#1d9bf0]">{part}</span>
          ) : (
            part
          )
        )}
      </p>
    </a>
  );
}

export default function Testimonials() {
  const [paused, setPaused] = useState(false);

  // Split tweets into two rows
  const mid = Math.ceil(TWEETS.length / 2);
  const topRow = TWEETS.slice(0, mid);
  const bottomRow = TWEETS.slice(mid);

  // Duplicate for seamless loop
  const topAll = [...topRow, ...topRow];
  const bottomAll = [...bottomRow, ...bottomRow];

  const duration = TWEETS.length * 6;

  return (
    <section className="w-full">
      <FadeInView direction="up" distance={24} className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">What other builders say</h2>
        <p className="text-muted-foreground mt-2">Don&apos;t take our word for it</p>
      </FadeInView>
      <div
        className="flex flex-col gap-4"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Top row — scrolls left, wider visible area */}
        <div className="overflow-hidden mask-l-from-75% mask-r-from-75%">
          <div
            className="flex gap-4 w-max"
            style={{
              animation: `scroll-left ${duration}s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {topAll.map((tweet, i) => (
              <TweetCard key={`top-${tweet.handle}-${i}`} tweet={tweet} />
            ))}
          </div>
        </div>
        {/* Bottom row — scrolls right, narrower visible area */}
        <div className="overflow-hidden mask-l-from-60% mask-r-from-60%">
          <div
            className="flex gap-4 w-max"
            style={{
              animation: `scroll-right ${duration}s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {bottomAll.map((tweet, i) => (
              <TweetCard key={`bottom-${tweet.handle}-${i}`} tweet={tweet} />
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
