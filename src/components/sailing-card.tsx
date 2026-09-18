import { Link } from "@tanstack/react-router";

import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { boardStatus, laneCodes, laneLabel, transitDays, type SailingRow } from "@/lib/queries";
import { countdown, shortDate, usd, weekdayDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyle = {
  open: "bg-success-soft text-success",
  filling: "bg-warning-soft text-warning",
  waitlist: "bg-danger-soft text-danger",
  closed: "bg-surface text-muted-foreground",
} as const;

const statusLabel = {
  open: "Open",
  filling: "Filling fast",
  waitlist: "Waitlist",
  closed: "Closed",
} as const;

export function StatusPill({ status }: { status: keyof typeof statusStyle }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", statusStyle[status])}>
      {statusLabel[status]}
    </span>
  );
}

export function FillBar({ sailing }: { sailing: SailingRow }) {
  const cap = Number(sailing.capacity_cbm) || 1;
  const pct = (n: number) => `${Math.min(100, (n / cap) * 100)}%`;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface">
        <span className="bg-primary" style={{ width: pct(sailing.bookedCbm + sailing.backfillCbm) }} />
        <span className="bg-warning" style={{ width: pct(sailing.heldCbm) }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          Booked <LiveValue value={(sailing.bookedCbm + sailing.backfillCbm).toFixed(1)} unit="cbm" className="text-xs" />
        </span>
        <span>
          Held <LiveValue value={sailing.heldCbm.toFixed(1)} unit="cbm" className="text-xs" />
        </span>
        <span>
          Free <LiveValue value={sailing.availableCbm.toFixed(1)} unit="cbm" className="text-xs" tone="primary" />
        </span>
      </div>
    </div>
  );
}

export function SailingCard({
  sailing,
  allInOneCbm,
  href,
  action,
}: {
  sailing: SailingRow;
  allInOneCbm?: number | undefined;
  href?: string | undefined;
  action?: React.ReactNode;
}) {
  const status = boardStatus(sailing);
  const waitlist = status === "waitlist";

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold tracking-tight">{sailing.voyage_no}</p>
          <h3 className="mt-1 text-lg font-bold">{laneLabel(sailing)}</h3>
          <p className="font-mono text-xs text-muted-foreground">{laneCodes(sailing)}</p>
        </div>
        <StatusPill status={status} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact k="Cargo cut-off">
          <LiveValue value={weekdayDate(sailing.cargo_cutoff_at)} />
          <span className="mt-0.5 block font-mono text-xs text-warning">{countdown(sailing.cargo_cutoff_at)} left</span>
        </Fact>
        <Fact k="Sails">
          <LiveValue value={shortDate(sailing.etd)} />
        </Fact>
        <Fact k="Arrives BGI">
          <LiveValue value={shortDate(sailing.eta)} />
        </Fact>
        <Fact k="Transit">
          <LiveValue value={transitDays(sailing)} unit="days" />
        </Fact>
      </dl>

      <div className="mt-5">
        <FillBar sailing={sailing} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <div className="flex gap-6">
          <Fact k="From">
            <LiveValue value={usd(Number(sailing.origin.floor_rate_usd))} unit="/cbm" tone="primary" />
          </Fact>
          {allInOneCbm ? (
            <Fact k="All-in for 1 cbm">
              <LiveValue value={usd(allInOneCbm)} stamp={sailing.lastChangeAt} />
            </Fact>
          ) : null}
        </div>
        <Button asChild variant={waitlist ? "outline" : "default"}>
          <Link to={href ?? "/quote"}>{waitlist ? "Join waitlist" : "Get quote"}</Link>
        </Button>
      </div>
    </article>
  );
}

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{k}</dt>
      <dd className="mt-1 text-sm font-semibold">{children}</dd>
    </div>
  );
}
