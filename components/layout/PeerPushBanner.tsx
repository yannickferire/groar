"use client";

const PEERPUSH_URL = "https://peerpush.net/p/groar";

export default function PeerPushBanner() {
  return (
    <a
      href={PEERPUSH_URL}
      target="_blank"
      rel="noopener"
      className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer mb-1"
    >
      <span className="text-sm text-muted-foreground text-center">
        🏆 #1 Product of the Day on PeerPush! <span className="font-semibold highlighted">Grab your 25% discount code</span>
      </span>
    </a>
  );
}
