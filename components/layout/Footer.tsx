import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="w-full max-w-6xl mx-auto border-t border-border mt-24">
      <div className="py-8 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Turn your social media metrics
            <br />
            into shareable visuals
          </p>
        </div>
        <a
          href="https://x.com/yannick_ferire"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          @yannick_ferire
        </a>
      </div>
    </footer>
  );
}
