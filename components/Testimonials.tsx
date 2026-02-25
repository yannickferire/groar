import Image from "next/image";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge02Icon } from "@hugeicons/core-free-icons";

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
    text: "Bro, I know you have 12 years of experience in frontend but the UI of Groar is a masterclass. I'm not exaggerating. I'm not trying to flatter you. I really think the UI is so well designed. I love it!",
    url: "https://x.com/EmrikLecomte/status/2026421376978932069",
    avatar: "/testimonials/emrik-lecomte.jpg",
  },
  {
    author: "Stefan Rows",
    handle: "StefanRows",
    verified: true,
    text: "Been using groar.app to turn my X metrics into shareable visuals. Dead simple — pick your stats, choose a background, download. Takes 10 seconds. Nice tool by @yannick_ferire",
    url: "https://x.com/StefanRows/status/2023361398395596861",
    avatar: "/testimonials/stefan-rows.jpg",
  },
  {
    author: "Nowshad Hossain",
    handle: "nhrdev",
    verified: true,
    text: "Thanks a lot @yannick_ferire for making these visuals creation that easy using groar.app",
    url: "https://x.com/nhrdev/status/2026321650895999168",
    avatar: "/testimonials/nhrdev.jpg",
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
      className="block break-inside-avoid rounded-2xl border border-white/10 bg-black p-4 font-sans"
    >
      {/* Header row: avatar + name/handle + X logo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Image
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
        {tweet.text.split(/([@#][\w]+|https?:\/\/\S+|[\w]+\.[\w]+\.?\w*)/g).map((part, i) =>
          /^[@#]/.test(part) || /^https?:\/\//.test(part) || /^[\w]+\.[\w]+/.test(part) ? (
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
  return (
    <section className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">What builders say</h2>
        <p className="text-muted-foreground mt-2">Don&apos;t take our word for it</p>
      </div>
      <StaggerContainer staggerDelay={0.15} className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {TWEETS.map((tweet) => (
          <StaggerItem key={tweet.handle} className="mb-4">
            <TweetCard tweet={tweet} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
