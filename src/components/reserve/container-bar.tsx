import { freeCbm, pendingCbm, takenCbm } from "@/lib/sailing-search";
import type { SailingRow } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** The container: taken · pending · yours · free, as a share of capacity. */
export function ContainerBar({ sailing, yours }: { sailing: SailingRow; yours: number }) {
  const cap = Number(sailing.capacity_cbm) || 1;
  const free = freeCbm(sailing);
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / cap) * 100))}%`;
  const mine = Math.min(yours, free);

  const tone = free <= 0 ? "text-danger" : free <= 10 ? "text-warning" : "text-foreground";

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-[18px] flex-1 overflow-hidden rounded-[5px] border border-border-strong bg-surface shadow-[inset_0_1px_2px_rgba(15,31,51,0.08)]">
        <div className="h-full bg-foreground transition-[width] duration-200" style={{ width: pct(takenCbm(sailing)) }} />
        <div className="bar-pending h-full transition-[width] duration-200" style={{ width: pct(pendingCbm(sailing)) }} />
        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: pct(mine) }} />
        <div className="bar-sweep" />
      </div>
      <div className="flex shrink-0 flex-col items-end leading-[1.15]">
        <span className={cn("text-sm font-bold", tone)}>
          {free <= 0 ? "Full" : `${free.toFixed(1)} cbm free`}
        </span>
        <span className="text-[11px] text-muted-foreground">of {Number(sailing.capacity_cbm).toFixed(0)} cbm</span>
      </div>
    </div>
  );
}
