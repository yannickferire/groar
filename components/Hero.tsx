import XLogo from "@/components/icons/XLogo";

export default function Hero() {
  return (
    <section className="max-w-3xl text-balance text-center flex flex-col gap-6 mx-auto">
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
        Make your social metrics <span className="highlighted">Roaaar</span>
      </h1>
      <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
        Turn cold data analytics into high-signal visuals.<br className="hidden md:block" />
        Share your wins and watch the engagement grow.
      </p>
      <p className="text-sm text-muted-foreground">
        Available on <XLogo className="mx-1" /><span className="sr-only">X (Twitter)</span> · More platforms coming soon
      </p>
    </section>
  );
}
