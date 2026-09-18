import { CbmStepper } from "@/components/reserve/cbm-stepper";
import { ContainerBar } from "@/components/reserve/container-bar";
import { DeadlineChip } from "@/components/reserve/deadline-chip";
import { JourneyLine } from "@/components/reserve/journey-line";
import { Button } from "@/components/ui/button";
import type { SailingRow as Sailing } from "@/lib/queries";
import { freeCbm, portLabel } from "@/lib/sailing-search";
import { cn } from "@/lib/utils";

interface Props {
  sailing: Sailing;
  cbm: number;
  onCbm: (n: number) => void;
  onReserve: () => void;
  soonest?: boolean;
  mostSpace?: boolean;
}

/** One flat result row — no card, no shadow, no tint. */
export function SailingResultRow({ sailing, cbm, onCbm, onReserve, soonest, mostSpace }: Props) {
  const free = freeCbm(sailing);
  const full = free <= 0;

  return (
    <div className="flex flex-col gap-3.5 border-t border-border py-4 lg:grid lg:grid-cols-[minmax(210px,1fr)_minmax(260px,1.2fr)_minmax(300px,1.3fr)] lg:items-center lg:gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-mono text-[15px] font-semibold tabular-nums">{sailing.shipment_no}</span>
          <span className="text-xs text-muted-foreground">{portLabel(sailing.origin)}</span>
          {soonest ? <Badge tone="blue">Soonest</Badge> : null}
          {mostSpace ? <Badge tone="green">Most space</Badge> : null}
        </div>
        <div className="flex">
          <DeadlineChip cutoff={sailing.cargo_cutoff_at} />
        </div>
      </div>

      <JourneyLine sailing={sailing} />

      <div className="flex flex-col gap-3">
        <ContainerBar sailing={sailing} yours={cbm} />
        <div className="flex items-center justify-between gap-3">
          <CbmStepper value={cbm} max={Math.max(0.5, free)} onChange={onCbm} />
          <Button
            type="button"
            onClick={onReserve}
            className={cn("h-9 rounded-lg px-5 text-sm font-bold", full && "bg-warning hover:bg-warning/90")}
          >
            {full ? "Waitlist" : "Reserve"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "blue" | "green"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-[2px] text-[10px] font-bold tracking-wide uppercase",
        tone === "blue" ? "bg-primary-soft text-primary" : "bg-success-soft text-success",
      )}
    >
      {children}
    </span>
  );
}
