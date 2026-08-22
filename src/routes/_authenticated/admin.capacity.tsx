import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { FillBar } from "@/components/sailing-card";
import { supabase } from "@/integrations/supabase/client";
import { laneLabel, useSailings } from "@/lib/queries";
import { countdown, longDate, usd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/capacity")({
  component: CapacityConsole,
});

interface HoldRow {
  id: string;
  ref: string;
  sailing_id: string;
  chargeable_cbm: number;
  gross_kg: number;
  total_usd: number;
  hold_expires_at: string | null;
}

function CapacityConsole() {
  const { data: sailings = [] } = useSailings();
  const queryClient = useQueryClient();

  const { data: holds = [] } = useQuery({
    queryKey: ["holds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, ref, sailing_id, chargeable_cbm, gross_kg, total_usd, hold_expires_at")
        .eq("status", "held")
        .order("hold_expires_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as HoldRow[];
    },
  });

  async function act(id: string, status: "confirmed" | "cancelled" | "expired", note: string) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("booking_events").insert({ booking_id: id, status, note });
    toast.success(note);
    queryClient.invalidateQueries({ queryKey: ["holds"] });
    queryClient.invalidateQueries({ queryKey: ["sailings"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Back office" title="Capacity console" lead="Space committed against every open sailing, in cbm and kg." />

      <div className="grid gap-4 xl:grid-cols-2">
        {sailings.map((s) => {
          const kgFill = Number(s.capacity_kg) ? (s.bookedKg / Number(s.capacity_kg)) * 100 : 0;
          return (
            <Panel key={s.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold">{s.voyage_no}</p>
                  <p className="text-sm text-muted-foreground">{laneLabel(s)}</p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  cut-off in {countdown(s.cargo_cutoff_at)}
                </p>
              </div>

              <div className="mt-5">
                <FillBar sailing={s} />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
                <Metric k="Booked" v={s.bookedCbm.toFixed(1)} u="cbm" />
                <Metric k="Held" v={s.heldCbm.toFixed(1)} u="cbm" />
                <Metric k="Backfill" v={s.backfillCbm.toFixed(1)} u="cbm" />
                <Metric k="Free" v={s.availableCbm.toFixed(1)} u="cbm" />
                <Metric k="Weight used" v={s.bookedKg.toFixed(0)} u="kg" />
                <Metric k="Weight cap" v={Number(s.capacity_kg)} u="kg" />
                <Metric k="Weight fill" v={`${kgFill.toFixed(0)}%`} />
                <Metric k="Volume cap" v={Number(s.capacity_cbm)} u="cbm" />
              </dl>
            </Panel>
          );
        })}
      </div>

      <Panel className="p-0">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-bold">Live holds</h2>
          <p className="text-sm text-muted-foreground">Holds release automatically 48 hours after they are placed.</p>
        </div>
        <div className="divide-y divide-border">
          {holds.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted-foreground">No live holds.</p>
          ) : (
            holds.map((h) => {
              const s = sailings.find((x) => x.id === h.sailing_id);
              return (
                <div key={h.id} className="flex flex-wrap items-center gap-4 px-6 py-4 text-sm">
                  <span className="min-w-32 font-mono font-bold">{h.ref}</span>
                  <span className="min-w-40 text-muted-foreground">{s ? s.voyage_no : "—"}</span>
                  <LiveValue value={Number(h.chargeable_cbm)} unit="cbm" className="text-sm" />
                  <LiveValue value={usd(Number(h.total_usd))} className="text-sm" />
                  <span className="font-mono text-xs text-warning">
                    expires {h.hold_expires_at ? longDate(h.hold_expires_at) : "—"}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" onClick={() => act(h.id, "confirmed", "Hold confirmed by ops")}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(h.id, "cancelled", "Hold released by ops")}>
                      Release
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(h.id, "expired", "Rolled to next sailing")}>
                      Roll
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}

function Metric({ k, v, u }: { k: string; v: string | number; u?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{k}</dt>
      <dd className="mt-1">
        <LiveValue value={v} unit={u} className="text-sm" />
      </dd>
    </div>
  );
}
