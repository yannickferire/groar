export default function XLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-foreground to-foreground/80 text-background rounded-lg border-2 border-foreground ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </span>
  );
}
