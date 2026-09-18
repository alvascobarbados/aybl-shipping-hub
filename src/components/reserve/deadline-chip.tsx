import { LiveValue } from "@/components/live-value";
import { shortDate } from "@/lib/format";
import { deadlineText, deadlineTone } from "@/lib/sailing-search";
import { cn } from "@/lib/utils";

const tones = {
  amber: "bg-warning-soft text-warning-ink",
  red: "bg-danger-soft text-danger-ink",
  grey: "bg-surface-2 text-muted-foreground",
} as const;

export function DeadlineChip({ cutoff }: { cutoff: string }) {
  const tone = deadlineTone(cutoff);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md py-[3px] pr-2 pl-[7px] text-[11px] font-semibold whitespace-nowrap",
        tones[tone],
      )}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.5V8l2.5 1.5" />
      </svg>
      <span>
        In warehouse by <LiveValue value={shortDate(cutoff)} className="text-[11px] font-semibold" tone="muted" /> ·{" "}
        {deadlineText(cutoff)}
      </span>
    </span>
  );
}
