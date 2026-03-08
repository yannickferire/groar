"use client";

const VOTE_URL = "https://rankinpublic.xyz/vote/jn71m7xpwnqwvc6aswe80ztz59824mgy?ref=m170w820pg3gybz0k6dfysz6xs81p3cs";

export default function RankInPublicBanner() {
  return (
    <a
      href={VOTE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer mb-4"
    >
      <span className="text-sm text-muted-foreground">
        &#x1F44B; Hey RankInPublic fam! It's the final, <span className="font-semibold highlighted">vote for us</span>
      </span>
    </a>
  );
}
