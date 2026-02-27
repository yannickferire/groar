"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { FadeInView } from "@/components/ui/motion";

type Tweet = {
  author: string;
  handle: string;
  verified: boolean;
  text: string;
  url: string;
  avatar: string;
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
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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

      {/* Tweet body */}
      <p className="mt-3 text-[15px] leading-[1.45] text-[#e7e9ea]">
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

  // Duplicate tweets for seamless loop
  const allTweets = [...TWEETS, ...TWEETS];

  return (
    <section className="w-full">
      <FadeInView direction="up" distance={24} className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">What other builders say</h2>
        <p className="text-muted-foreground mt-2">Don&apos;t take our word for it</p>
      </FadeInView>
      <div
        className="overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex gap-4 w-max"
          style={{
            animation: `scroll ${TWEETS.length * 8}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {allTweets.map((tweet, i) => (
            <TweetCard key={`${tweet.handle}-${i}`} tweet={tweet} />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
