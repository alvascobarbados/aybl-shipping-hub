import { LiveValue } from "@/components/live-value";
import type { SortKey } from "@/lib/sailing-search";
import { cn } from "@/lib/utils";

interface Props {
  lane: string;
  count: number;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onEdit: () => void;
  soonestSub: string | null;
  mostSpaceSub: string | null;
}

export function ResultsHeader({ lane, count, sort, onSort, onEdit, soonestSub, mostSpaceSub }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-extrabold tracking-[-0.02em]">{lane}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          <LiveValue value={count} unit={count === 1 ? "sailing" : "sailings"} className="text-xs" tone="muted" /> ·{" "}
          <button type="button" onClick={onEdit} className="font-semibold text-primary underline-offset-2 hover:underline">
            Edit search
          </button>
        </p>
      </div>
      <div className="flex gap-2">
        <SortTab active={sort === "soonest"} onClick={() => onSort("soonest")} label="Soonest" sub={soonestSub} />
        <SortTab active={sort === "space"} onClick={() => onSort("space")} label="Most space" sub={mostSpaceSub} />
      </div>
    </div>
  );
}

function SortTab({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-secondary-foreground hover:border-border-strong",
      )}
    >
      <span className="block">{label}</span>
      {sub ? <span className="mt-0.5 block font-mono text-[11px] font-semibold tabular-nums opacity-80">{sub}</span> : null}
    </button>
  );
}
