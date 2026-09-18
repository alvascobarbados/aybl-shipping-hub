import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  onChange: (n: number) => void;
  size?: "sm" | "md";
}

/** One bordered pill: − · quantity · +. Half-cbm steps. */
export function CbmStepper({ value, max, onChange, size = "sm" }: Props) {
  const h = size === "md" ? "h-[38px]" : "h-9";
  const w = size === "md" ? "w-[38px]" : "w-9";
  const canLess = value > 0.5;
  const canMore = value + 0.5 <= max;

  return (
    <div className={cn("flex items-stretch overflow-hidden rounded-lg border border-border-strong bg-card", h)}>
      <button
        type="button"
        aria-label="Half a cubic metre less"
        disabled={!canLess}
        onClick={() => onChange(+(value - 0.5).toFixed(1))}
        className={cn("inline-flex items-center justify-center text-primary disabled:opacity-35", w)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M3 8h10" />
        </svg>
      </button>
      <span className="inline-flex min-w-[76px] items-baseline justify-center gap-1 border-x border-border pt-[9px]">
        <span className="font-mono text-[15px] font-semibold tabular-nums text-primary">{value.toFixed(1)}</span>
        <span className="text-[11px] text-muted-foreground">cbm</span>
      </span>
      <button
        type="button"
        aria-label="Half a cubic metre more"
        disabled={!canMore}
        onClick={() => onChange(+(value + 0.5).toFixed(1))}
        className={cn("inline-flex items-center justify-center text-primary disabled:opacity-35", w)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M8 3v10M3 8h10" />
        </svg>
      </button>
    </div>
  );
}
