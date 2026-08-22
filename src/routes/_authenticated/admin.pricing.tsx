import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { calcQuote, type PriceRules } from "@/lib/pricing";
import { laneLabel, usePriceRules, useSailings } from "@/lib/queries";
import { daysUntil, usd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: PricingRules,
});

const FIELDS: Array<[keyof PriceRules, string]> = [
  ["early_days", "Early window (days)"],
  ["std_days", "Standard window (days)"],
  ["std_mult", "Standard multiplier"],
  ["late_mult", "Late multiplier"],
  ["demand70_mult", "Demand ≥70% multiplier"],
  ["demand85_mult", "Demand ≥85% multiplier"],
  ["flex_mult", "Flex fare multiplier"],
  ["standing_discount", "Standing discount"],
  ["cfs_fee_per_cbm", "Origin CFS fee / cbm"],
  ["terminal_fee_per_cbm", "Terminal fee / cbm"],
  ["doc_fee", "Documentation fee"],
  ["insurance_rate", "Insurance rate"],
  ["insurance_min", "Insurance minimum"],
  ["photo_check_fee", "Photo check fee"],
  ["pickup_fee_gz", "Pickup fee · Guangzhou"],
  ["pickup_fee_yiwu", "Pickup fee · Yiwu"],
  ["delivery_fee_base", "Delivery base fee"],
  ["delivery_fee_per_cbm", "Delivery fee / cbm"],
];

function PricingRules() {
  const { data: rules } = usePriceRules();
  const { data: sailings = [] } = useSailings();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PriceRules | null>(null);
  const [cbm, setCbm] = useState(3);
  const [sailingId, setSailingId] = useState<string>("");

  useEffect(() => {
    if (rules) setDraft(rules);
  }, [rules]);

  const sailing = sailings.find((s) => s.id === sailingId) ?? sailings[0];
  const preview =
    draft && sailing
      ? calcQuote({
          cbm,
          floorRateUsd: Number(sailing.origin.floor_rate_usd),
          originPortName: sailing.origin.name,
          daysToCutoff: daysUntil(sailing.cargo_cutoff_at),
          committedCbm: sailing.committedCbm,
          capacityCbm: Number(sailing.capacity_cbm),
          rules: draft,
        })
      : null;

  async function save() {
    if (!draft) return;
    const { error } = await supabase
      .from("price_rules")
      .update(draft as unknown as Record<string, unknown>)
      .eq("version", draft.version);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tariff saved. Confirmed bookings keep their stored price.");
    queryClient.invalidateQueries({ queryKey: ["price_rules"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Back office"
        title="Pricing rules"
        lead="One active ruleset drives the public quote, the booking page and this preview."
        actions={<Button onClick={save}>Save tariff</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <Panel>
          <h2 className="font-bold">Active ruleset {draft ? <span className="font-mono text-sm text-muted-foreground">{draft.version}</span> : null}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {draft
              ? FIELDS.map(([k, label]) => (
                  <div key={String(k)}>
                    <Label className="text-sm font-semibold">{label}</Label>
                    <Input
                      type="number"
                      step="0.001"
                      className="mt-2 font-mono"
                      value={Number(draft[k])}
                      onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })}
                    />
                  </div>
                ))
              : null}
          </div>
        </Panel>

        <Panel className="lg:sticky lg:top-24">
          <h2 className="font-bold">Preview</h2>
          <div className="mt-4 grid gap-3">
            <div>
              <Label className="text-sm font-semibold">Sailing</Label>
              <Select value={sailing?.id ?? ""} onValueChange={setSailingId}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sailings.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.voyage_no} · {laneLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Volume (cbm)</Label>
              <Input type="number" step="0.5" min={0.5} className="mt-2 font-mono" value={cbm} onChange={(e) => setCbm(Number(e.target.value))} />
            </div>
          </div>

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            {(preview?.lines ?? []).map((l) => (
              <div key={l.key} className="flex justify-between">
                <dt className="text-secondary-foreground">{l.label}</dt>
                <dd>
                  <LiveValue value={usd(l.amount, { cents: true })} className="text-sm" />
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-bold">Total</span>
            <span className="text-xl">
              <LiveValue value={preview ? usd(preview.total) : "—"} />
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
