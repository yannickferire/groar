export default function MoreLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 bg-linear-to-br from-muted to-muted/80 rounded-lg border-2 border-border ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </span>
  );
}
