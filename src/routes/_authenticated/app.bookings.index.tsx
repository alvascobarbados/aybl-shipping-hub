import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState, PageHeader, Panel } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, useBookings } from "@/lib/bookings";
import { shortDate, usd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/bookings/")({
  component: MyBookings,
});

function MyBookings() {
  const { data: bookings = [], isLoading } = useBookings();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Customer portal" title="My bookings" lead="Every booking your company has placed with AYBL." />

      {isLoading ? null : bookings.length === 0 ? (
        <EmptyState title="No bookings yet" hint="Pick a sailing on the board to hold your first cubic metres." />
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border text-left text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              <tr>
                {["Ref", "Sailing", "Lane", "Volume", "Fare", "Status", "ETA", "Payment"].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-5 py-3.5">
                    <Link to="/app/bookings/$ref" params={{ ref: b.ref }} className="font-mono font-bold text-primary">
                      {b.ref}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-mono">{b.sailing.voyage_no}</td>
                  <td className="px-5 py-3.5">
                    {b.sailing.origin.name} → {b.sailing.destination.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <LiveValue value={Number(b.chargeable_cbm)} unit="cbm" className="text-sm" />
                  </td>
                  <td className="px-5 py-3.5 capitalize">{b.fare}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold">
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <LiveValue value={shortDate(b.sailing.eta)} className="text-sm" />
                  </td>
                  <td className="px-5 py-3.5">
                    {b.status === "held" ? (
                      <Button size="sm">Pay now</Button>
                    ) : (
                      <LiveValue value={usd(Number(b.total_usd))} className="text-sm" tone="muted" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
