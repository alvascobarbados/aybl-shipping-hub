import { createFileRoute } from "@tanstack/react-router";
import { Check, Download, FileText } from "lucide-react";

import { PageHeader, Panel } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { MILESTONES, STATUS_LABEL, useBooking, useBookingEvents } from "@/lib/bookings";
import { longDate, usd, astTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/bookings/$ref")({
  component: BookingDetail,
});

function BookingDetail() {
  const { ref } = Route.useParams();
  const { data: booking, isLoading } = useBooking(ref);
  const { data: events = [] } = useBookingEvents(booking?.id);

  if (isLoading) return <p className="text-muted-foreground">Loading booking…</p>;
  if (!booking) return <p className="text-muted-foreground">Booking not found.</p>;

  const reached = new Set(events.map((e) => e.status));
  const eventAt = (k: string) => events.find((e) => e.status === k)?.created_at;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={STATUS_LABEL[booking.status] ?? booking.status}
        title={booking.ref}
        lead={`${booking.sailing.origin.name} → ${booking.sailing.destination.name} · ${booking.sailing.voyage_no}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel>
            <h2 className="font-bold">Tracking</h2>
            <ol className="mt-5 space-y-0">
              {MILESTONES.map((m, i) => {
                const done = reached.has(m.key);
                return (
                  <li key={m.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid size-7 place-items-center rounded-full border",
                          done ? "border-success bg-success text-primary-foreground" : "border-border bg-surface text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-4" /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                      </span>
                      {i < MILESTONES.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
                    </div>
                    <div className="pb-6">
                      <p className={cn("text-sm font-semibold", !done && "text-muted-foreground")}>{m.label}</p>
                      {done ? (
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {longDate(eventAt(m.key) ?? "")} · {astTime(eventAt(m.key) ?? "")} AST
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel>
            <h2 className="font-bold">Next step: get cargo to {booking.sailing.origin.name}</h2>
            <p className="mt-2 text-sm text-secondary-foreground">
              Your supplier delivers to our CFS before the cargo cut-off on{" "}
              <LiveValue value={longDate(booking.sailing.cargo_cutoff_at)} className="text-sm" />.
            </p>
            <div className="mt-4 rounded-lg bg-surface p-4 text-sm">
              <p className="font-semibold">{booking.sailing.origin.cfs_address}</p>
              <p className="mt-1 text-secondary-foreground">{booking.sailing.origin.cfs_address_zh}</p>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-border p-4">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Carton marking</p>
              <p className="mt-1 font-mono text-lg font-bold">{booking.ref}</p>
              <p className="text-xs text-muted-foreground">Mark every carton. Cartons without the reference are refused.</p>
            </div>
          </Panel>

          <Panel>
            <h2 className="font-bold">Documents</h2>
            <ul className="mt-4 divide-y divide-border text-sm">
              {["Booking confirmation", "Supplier delivery label (EN / 中文)", "House B/L", "Invoice"].map((d) => (
                <li key={d} className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    {d}
                  </span>
                  <Button variant="outline" size="sm">
                    <Download /> PDF
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel className="lg:sticky lg:top-24">
          <h2 className="font-bold">Booking</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Fact k="Sailing" v={booking.sailing.voyage_no} />
            <Fact k="Sails" v={longDate(booking.sailing.etd)} />
            <Fact k="Arrives" v={longDate(booking.sailing.eta)} />
            <Fact k="Volume" v={`${Number(booking.chargeable_cbm)} cbm`} />
            <Fact k="Gross weight" v={`${Number(booking.gross_kg)} kg`} />
            <Fact k="Fare" v={booking.fare} />
            <Fact k="Seal" v={booking.seal_no ?? "—"} />
          </dl>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            {(booking.price_breakdown?.lines ?? []).map((l) => (
              <div key={l.key} className="flex justify-between">
                <span className="text-secondary-foreground">{l.label}</span>
                <LiveValue value={usd(Number(l.amount), { cents: true })} className="text-sm" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-bold">Total</span>
            <span className="text-xl">
              <LiveValue value={usd(Number(booking.total_usd))} />
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-secondary-foreground">{k}</dt>
      <dd className="capitalize">
        <LiveValue value={v} className="text-sm" />
      </dd>
    </div>
  );
}
