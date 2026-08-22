import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={cn("size-7", className)}>
      <rect x="2" y="2" width="24" height="24" rx="6" fill="currentColor" />
      <path
        d="M7 18h14M8 18l1.5-6h9L20 18M12 12V9h4v3"
        stroke="var(--color-primary-foreground)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-2xl font-extrabold tracking-[-0.04em]", className)}>
      <BrandMark className={mono ? "text-board-foreground" : "text-primary"} />
      AYBL
    </span>
  );
}
