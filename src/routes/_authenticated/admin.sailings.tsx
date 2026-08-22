import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { laneLabel, useSailings, type SailingRow } from "@/lib/queries";
import { longDate, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/sailings")({
  component: AdminSailings,
});

const STATUSES = ["scheduled", "open", "closed", "sailed", "arrived", "released"] as const;

function AdminSailings() {
  const { data: sailings = [] } = useSailings();
  const queryClient = useQueryClient();
  const ports = Array.from(new Map(sailings.map((s) => [s.origin.id, s.origin])).values());
  const destination = sailings[0]?.destination;

  type SailingStatus = (typeof STATUSES)[number];

  async function setStatus(s: SailingRow, status: SailingStatus) {
    const { error } = await supabase.from("sailings").update({ status }).eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${s.voyage_no} is now ${status}`);
    queryClient.invalidateQueries({ queryKey: ["sailings"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Back office"
        title="Sailings"
        lead="Create voyages, set capacity and manage cargo cut-offs."
        actions={
          <NewSailingDialog
            ports={ports}
            destinationId={destination?.id}
            onDone={() => queryClient.invalidateQueries({ queryKey: ["sailings"] })}
          />
        }
      />

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-left text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            <tr>
              {["Voyage", "Lane", "Cut-off", "ETD", "ETA", "Capacity", "Free", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sailings.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3.5 font-mono font-bold">{s.voyage_no}</td>
                <td className="px-5 py-3.5">{laneLabel(s)}</td>
                <td className="px-5 py-3.5">
                  <LiveValue value={shortDate(s.cargo_cutoff_at)} className="text-sm" />
                </td>
                <td className="px-5 py-3.5">
                  <LiveValue value={shortDate(s.etd)} className="text-sm" />
                </td>
                <td className="px-5 py-3.5">
                  <LiveValue value={shortDate(s.eta)} className="text-sm" />
                </td>
                <td className="px-5 py-3.5">
                  <LiveValue value={Number(s.capacity_cbm)} unit="cbm" className="text-sm" />
                </td>
                <td className="px-5 py-3.5">
                  <LiveValue value={s.availableCbm.toFixed(1)} unit="cbm" className="text-sm" tone="primary" />
                </td>
                <td className="px-5 py-3.5">
                  <Select value={s.status} onValueChange={(v) => setStatus(s, v as SailingStatus)}>
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((st) => (
                        <SelectItem key={st} value={st} className="capitalize">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {sailings[0] ? (
        <p className="text-sm text-muted-foreground">
          Latest schedule change reflected {longDate(sailings[0].lastChangeAt)}.
        </p>
      ) : null}
    </div>
  );
}

function NewSailingDialog({
  ports,
  destinationId,
  onDone,
}: {
  ports: Array<{ id: string; name: string }>;
  destinationId: string | undefined;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    voyage_no: "",
    origin_port_id: "",
    cargo_cutoff_at: "",
    etd: "",
    eta: "",
    capacity_cbm: 66,
    capacity_kg: 26000,
  });

  async function create() {
    if (!destinationId) return;
    const { error } = await supabase.from("sailings").insert({
      ...form,
      destination_port_id: destinationId,
      status: "open",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sailing created");
    setOpen(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New sailing</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New sailing</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Voyage number</Label>
            <Input
              className="mt-2 font-mono"
              placeholder="AYBL-YTN-2620"
              value={form.voyage_no}
              onChange={(e) => setForm({ ...form, voyage_no: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Origin port</Label>
            <Select value={form.origin_port_id} onValueChange={(v) => setForm({ ...form, origin_port_id: v })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {ports.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cargo cut-off</Label>
            <Input type="datetime-local" className="mt-2" value={form.cargo_cutoff_at} onChange={(e) => setForm({ ...form, cargo_cutoff_at: e.target.value })} />
          </div>
          <div>
            <Label>ETD</Label>
            <Input type="datetime-local" className="mt-2" value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })} />
          </div>
          <div>
            <Label>ETA Bridgetown</Label>
            <Input type="datetime-local" className="mt-2" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Capacity cbm</Label>
              <Input type="number" className="mt-2 font-mono" value={form.capacity_cbm} onChange={(e) => setForm({ ...form, capacity_cbm: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Capacity kg</Label>
              <Input type="number" className="mt-2 font-mono" value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: Number(e.target.value) })} />
            </div>
          </div>
        </div>
        <Button onClick={create} className="mt-2">
          Create sailing
        </Button>
      </DialogContent>
    </Dialog>
  );
}
