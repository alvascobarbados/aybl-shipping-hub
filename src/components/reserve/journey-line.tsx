import { shortDate } from "@/lib/format";
import { transitDays, type SailingRow } from "@/lib/queries";
import { originCity } from "@/lib/sailing-search";
import { cn } from "@/lib/utils";

/** Two big dates with a ship between them: sails → arrives. */
export function JourneyLine({ sailing, size = "md" }: { sailing: SailingRow; size?: "sm" | "md" | "lg" }) {
  const date = size === "lg" ? "text-[26px]" : size === "md" ? "text-[24px]" : "text-[22px]";
  const label = size === "lg" ? "text-xs" : "text-[11px]";

  return (
    <div className="flex items-start gap-2">
      <div className="flex shrink-0 flex-col gap-px">
        <span className={cn("font-mono font-semibold tracking-[-0.02em] tabular-nums", date)}>
          {shortDate(sailing.etd)}
        </span>
        <span className={cn("text-muted-foreground", label)}>Sails · {originCity(sailing.origin)}</span>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 pt-3">
        <div className="flex w-full items-center gap-[5px] text-faint">
          <i className="block h-px flex-1 bg-line" />
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" aria-hidden>
            <path d="M2 11h12l-1.5 3h-9z" />
            <path d="M4 11V6h5l3 5" />
            <path d="M6 6V4h2v2" />
          </svg>
          <i className="block h-px flex-1 bg-line" />
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 5h6M5 2l3 3-3 3" />
          </svg>
        </div>
        <span className={cn("whitespace-nowrap text-muted-foreground", label)}>
          {transitDays(sailing)} days · direct
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-px text-right">
        <span className={cn("font-mono font-semibold tracking-[-0.02em] tabular-nums", date)}>
          {shortDate(sailing.eta)}
        </span>
        <span className={cn("text-muted-foreground", label)}>Arrives {sailing.destination.name}</span>
      </div>
    </div>
  );
}
