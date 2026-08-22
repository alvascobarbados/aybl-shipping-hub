import { createFileRoute, Link } from "@tanstack/react-router";
import { Ship, Boxes, Timer, DollarSign } from "lucide-react";

import { PageHeader, Panel } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { useSailings, laneLabel, boardStatus } from "@/lib/queries";
import { shortDate, usd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: sailings = [] } = useSailings();
  const open = sailings.filter((s) => s.status === "open");
  const capacity = open.reduce((a, s) => a + Number(s.capacity_cbm), 0);
  const committed = open.reduce((a, s) => a + s.committedCbm, 0);
  const held = open.reduce((a, s) => a + s.heldCbm, 0);
  const fill = capacity ? Math.round((committed / capacity) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Back office" title="Dashboard" lead="Live position across every open sailing." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Ship className="size-4" />} label="Open sailings" value={open.length} />
        <Stat icon={<Boxes className="size-4" />} label="Committed space" value={committed.toFixed(1)} unit="cbm" />
        <Stat icon={<Timer className="size-4" />} label="Live holds" value={held.toFixed(1)} unit="cbm" />
        <Stat icon={<DollarSign className="size-4" />} label="Fill rate" value={`${fill}%`} />
      </div>

      <Panel className="p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-bold">Open sailings</h2>
          <Link to="/admin/sailings" className="text-sm font-semibold text-primary">
            Manage
          </Link>
        </div>
        <div className="divide-y divide-border">
          {open.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
              <div className="min-w-56 flex-1">
                <p className="font-mono text-sm font-bold">{s.voyage_no}</p>
                <p className="text-sm text-muted-foreground">{laneLabel(s)}</p>
              </div>
              <div className="text-sm">
                <span className="mr-2 text-muted-foreground">Cut-off</span>
                <LiveValue value={shortDate(s.cargo_cutoff_at)} />
              </div>
              <div className="text-sm">
                <span className="mr-2 text-muted-foreground">Free</span>
                <LiveValue value={s.availableCbm} unit="cbm" tone={s.availableCbm <= 10 ? "primary" : "default"} />
              </div>
              <div className="text-sm">
                <span className="mr-2 text-muted-foreground">From</span>
                <LiveValue value={usd(Number(s.origin.floor_rate_usd))} unit="/cbm" />
              </div>
              <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold capitalize">
                {boardStatus(s)}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Stat({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string | number; unit?: string }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold tracking-wide uppercase">{label}</span>
      </div>
      <p className="mt-3 text-2xl">
        <LiveValue value={value} unit={unit} />
      </p>
    </Panel>
  );
}
