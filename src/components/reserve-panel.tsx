import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { LiveValue } from "@/components/live-value";
import { StatusPill } from "@/components/sailing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { countdown, shortDate, usd, weekdayDate } from "@/lib/format";
import { bookPath } from "@/lib/reserve";
import {
  boardStatus,
  laneLabel,
  quoteFor,
  useOriginPorts,
  usePriceRules,
  useSailings,
  type SailingRow,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * The one job of the public site: pick a lane, a sailing and a volume, see the
 * all-in price, reserve. Every figure comes from live data through LiveValue.
 */
export function ReservePanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sailings = [], isPending: sailingsLoading } = useSailings();
  const { data: rules } = usePriceRules();
  const { data: ports = [], isPending: portsLoading } = useOriginPorts();

  const loading = sailingsLoading || portsLoading;

  const bookable = sailings.filter((s) => boardStatus(s) !== "closed");
  // Lanes always come from the port list, so both chips show even with no open sailings.
  const lanes = ports.length
    ? ports
    : Array.from(new Map(bookable.map((s) => [s.origin.code, s.origin])).values());
  // Default to the lane whose next cargo cut-off is soonest.
  const soonest = bookable[0]?.origin.code ?? lanes[0]?.code ?? null;

  const [lane, setLane] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [cbm, setCbm] = useState(1);
  const [kg, setKg] = useState<string>("");

  const activeLane = lane ?? soonest;
  const laneSailings = bookable.filter((s) => s.origin.code === activeLane).slice(0, 3);
  const sailing: SailingRow | undefined = laneSailings.find((s) => s.id === pickedId) ?? laneSailings[0];

  const grossKg = Number(kg) || 0;
  const quote = useMemo(
    () => (sailing && rules ? quoteFor(sailing, rules, { cbm, grossKg }) : null),
    [sailing, rules, cbm, grossKg],
  );

  const waitlist = sailing ? quote !== null && quote.chargeableCbm > sailing.availableCbm : false;

  function reserve() {
    if (!sailing) return;
    const search = { cbm, kg: grossKg > 0 ? grossKg : undefined };
    if (user) {
      navigate({ to: "/app/book/$sailingId", params: { sailingId: sailing.id }, search });
      return;
    }
    navigate({ to: "/signup", search: { next: bookPath(sailing.id), ...search } });
  }

  return (
    <div id="reserve" className="scroll-mt-20 rounded-xl border border-border bg-card shadow-card">
      {/* Lane toggle */}
      <div className="flex flex-wrap gap-2 border-b border-border p-5">
        {lanes.map((p) => (
          <button
            key={p.code}
            onClick={() => {
              setLane(p.code);
              setPickedId(null);
            }}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              activeLane === p.code
                ? "border-primary bg-accent text-primary"
                : "border-border text-secondary-foreground hover:border-primary",
            )}
          >
            {p.name} → Bridgetown
          </button>
        ))}
      </div>

      {/* Sailing picker — the only dark surface on the page */}
      <div className="bg-board p-2 text-board-foreground sm:p-3">
        <ul className="divide-y divide-board-2">
          {laneSailings.map((s) => {
            const active = s.id === sailing?.id;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setPickedId(s.id)}
                  className={cn(
                    "flex w-full flex-wrap items-center gap-x-6 gap-y-2 rounded-lg px-3 py-4 text-left transition-colors",
                    active ? "bg-board-2/60 ring-1 ring-board-green/60" : "hover:bg-board-2/40",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-bold">{s.voyage_no}</p>
                    <p className="mt-0.5 text-xs text-board-muted">
                      Cut-off <LiveValue value={shortDate(s.cargo_cutoff_at)} tone="board" className="text-xs" /> ·{" "}
                      <LiveValue value={countdown(s.cargo_cutoff_at)} tone="amber" className="text-xs" /> left
                    </p>
                  </div>
                  <div className="text-xs text-board-muted">
                    Sails <LiveValue value={shortDate(s.etd)} tone="board" className="text-xs" /> · arrives{" "}
                    <LiveValue value={shortDate(s.eta)} tone="board" className="text-xs" />
                  </div>
                  <div className="text-xs text-board-muted">
                    <LiveValue
                      value={s.availableCbm.toFixed(1)}
                      unit="cbm free"
                      tone={s.availableCbm <= 10 ? "amber" : "green"}
                      className="text-xs"
                    />
                  </div>
                  <div className="text-xs text-board-muted">
                    from <LiveValue value={usd(Number(s.origin.floor_rate_usd))} unit="/cbm" tone="board" className="text-xs" />
                  </div>
                  <StatusPill status={boardStatus(s)} />
                </button>
              </li>
            );
          })}
          {loading
            ? [0, 1, 2].map((i) => (
                <li key={i} className="px-3 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-board-2" />
                  <div className="mt-2 h-3 w-56 animate-pulse rounded bg-board-2" />
                </li>
              ))
            : null}
          {!loading && laneSailings.length === 0 ? (
            <li className="px-3 py-6 text-sm text-board-muted">
              No open sailings on this lane right now.{" "}
              <Link to="/contact" className="font-semibold text-board-foreground underline">
                Join the waitlist or contact us
              </Link>{" "}
              and we'll tell you as soon as the next one opens.
            </li>
          ) : null}
        </ul>
      </div>

      <div className="p-5 sm:p-6">
        {/* Volume */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-semibold">Volume</Label>
            <div className="mt-2 flex items-center gap-3">
              <Button variant="outline" size="icon" className="size-11" aria-label="Less volume" onClick={() => setCbm((c) => Math.max(0.5, +(c - 0.5).toFixed(1)))}>
                <Minus />
              </Button>
              <div className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface">
                <LiveValue value={cbm.toFixed(1)} unit="cbm" />
              </div>
              <Button variant="outline" size="icon" className="size-11" aria-label="More volume" onClick={() => setCbm((c) => +(c + 0.5).toFixed(1))}>
                <Plus />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="kg" className="text-sm font-semibold">
              Gross weight (kg) — optional
            </Label>
            <Input id="kg" inputMode="numeric" className="mt-2 h-11 font-mono" value={kg} onChange={(e) => setKg(e.target.value)} />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Your supplier's packing list shows the cbm and kg.</p>

        {/* Price */}
        <div className="mt-6 border-t border-border pt-6">
          {sailing && quote ? (
            <>
              <p className="text-sm text-muted-foreground">
                {laneLabel(sailing)} · cut-off{" "}
                <LiveValue value={weekdayDate(sailing.cargo_cutoff_at)} className="text-sm" />
              </p>
              <p className="mt-2 text-4xl sm:text-5xl">
                <LiveValue value={usd(quote.total)} stamp={sailing.lastChangeAt} />
              </p>
              <p className="mt-1 text-sm text-secondary-foreground">
                all-in · <LiveValue value={usd(quote.allInPerCbm)} unit="/cbm" className="text-sm" />
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Flex fare, insurance, pickup and delivery are on the next step.
              </p>

              {waitlist ? (
                <p className="mt-4 rounded-lg bg-warning-soft p-3 text-xs text-warning">
                  Only <LiveValue value={sailing.availableCbm.toFixed(1)} unit="cbm" className="text-xs" /> left on this
                  sailing. We'll hold what fits and waitlist the rest for the next sailing on this lane.
                </p>
              ) : null}

              <div className="mt-5 hidden sm:block">
                <Button size="lg" className="w-full" onClick={reserve}>
                  {waitlist ? "Join waitlist" : "Reserve space"}
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  No payment yet — the space is held while you confirm.
                </p>
              </div>

              {/* Sticky action bar on phones */}
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-3 shadow-lg sm:hidden">
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <LiveValue value={usd(quote.total)} className="text-lg" />
                    <span className="block text-[11px] text-muted-foreground">all-in, no payment yet</span>
                  </div>
                  <Button size="lg" className="ml-auto" onClick={reserve}>
                    {waitlist ? "Join waitlist" : "Reserve space"}
                  </Button>
                </div>
              </div>
            </>
          ) : loading || (sailing && !quote) ? (
            <div className="space-y-3">
              <div className="h-4 w-48 animate-pulse rounded bg-surface" />
              <div className="h-10 w-40 animate-pulse rounded bg-surface" />
              <div className="h-4 w-32 animate-pulse rounded bg-surface" />
            </div>
          ) : (
            <div className="text-sm text-secondary-foreground">
              <p>No sailings are open on this lane yet.</p>
              <p className="mt-2">
                <Link to="/contact" className="font-semibold text-primary">
                  Join the waitlist or contact us →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
