import { useMemo, useState, type ReactNode } from "react";

import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { legacyLclEstimate, type DeliveryOption, type Fare, type OriginOption, type Quote } from "@/lib/pricing";
import { laneLabel, quoteFor, usePriceRules, type SailingRow } from "@/lib/queries";
import { usd, weekdayDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface QuoteFormValues {
  cbm: number;
  grossKg: number;
  cargoType: string;
  fare: Fare;
  standing: boolean;
  origin: OriginOption;
  delivery: DeliveryOption;
  insuranceValue: number;
  photoCheck: boolean;
}

export const defaultValues: QuoteFormValues = {
  cbm: 3,
  grossKg: 1200,
  cargoType: "general",
  fare: "saver",
  standing: false,
  origin: "cfs",
  delivery: "collect",
  insuranceValue: 0,
  photoCheck: false,
};

export function QuoteForm({
  sailing,
  cta,
  onQuote,
}: {
  sailing: SailingRow;
  cta: (quote: Quote, values: QuoteFormValues) => ReactNode;
  onQuote?: ((q: Quote, v: QuoteFormValues) => void) | undefined;
}) {
  const { data: rules } = usePriceRules();
  const [v, setV] = useState<QuoteFormValues>(defaultValues);
  const set = <K extends keyof QuoteFormValues>(k: K, val: QuoteFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const quote = useMemo(() => {
    if (!rules) return null;
    const q = quoteFor(sailing, rules, {
      cbm: v.cbm,
      grossKg: v.grossKg,
      fare: v.fare,
      standing: v.standing,
      origin: v.origin,
      delivery: v.delivery,
      insuranceValue: v.insuranceValue,
      photoCheck: v.photoCheck,
    });
    onQuote?.(q, v);
    return q;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules, sailing, v]);

  const saver = rules ? quoteFor(sailing, rules, { cbm: v.cbm, grossKg: v.grossKg, fare: "saver", standing: v.standing }) : null;
  const flex = rules ? quoteFor(sailing, rules, { cbm: v.cbm, grossKg: v.grossKg, fare: "flex", standing: v.standing }) : null;
  const oversell = quote ? quote.chargeableCbm > sailing.availableCbm : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-bold">Your cargo</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Volume (cbm)">
              <Input
                type="number"
                min={0.5}
                step={0.5}
                className="font-mono"
                value={v.cbm}
                onChange={(e) => set("cbm", Number(e.target.value))}
              />
            </Field>
            <Field label="Gross weight (kg)">
              <Input
                type="number"
                min={0}
                step={10}
                className="font-mono"
                value={v.grossKg}
                onChange={(e) => set("grossKg", Number(e.target.value))}
              />
            </Field>
            <Field label="Cargo type">
              <Select value={v.cargoType} onValueChange={(x) => set("cargoType", x)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General merchandise</SelectItem>
                  <SelectItem value="hardware">Hardware & tools</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="apparel">Apparel</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Supplier location">
              <Select value={v.origin} onValueChange={(x) => set("origin", x as OriginOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cfs">Supplier delivers to our CFS</SelectItem>
                  <SelectItem value="pickup_gz">Pickup · Guangzhou</SelectItem>
                  <SelectItem value="pickup_yiwu">Pickup · Yiwu</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="In Barbados">
              <Select value={v.delivery} onValueChange={(x) => set("delivery", x as DeliveryOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collect">Collect at destination CFS</SelectItem>
                  <SelectItem value="deliver">Deliver to my address</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Chargeable volume">
              <div className="flex h-9 items-center rounded-md border border-border bg-surface px-3">
                <LiveValue value={quote?.chargeableCbm ?? "—"} unit="cbm" className="text-sm" />
              </div>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-bold">Fare</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FareCard
              active={v.fare === "saver"}
              onClick={() => set("fare", "saver")}
              title="Saver"
              body="Fixed to this sailing. Best price."
              perCbm={saver?.ratePerCbm}
            />
            <FareCard
              active={v.fare === "flex"}
              onClick={() => set("fare", "flex")}
              title="Flex"
              body="Roll to the next sailing on this lane at no charge."
              perCbm={flex?.ratePerCbm}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-bold">Add-ons</h2>
          <div className="mt-4 space-y-4">
            <Toggle
              label="Standing booking"
              hint="Same space every sailing, discounted freight, never pays the late step."
              checked={v.standing}
              onChange={(x) => set("standing", x)}
            />
            <Toggle
              label="Photo check at origin warehouse"
              hint="We photograph your cartons on arrival at the CFS."
              checked={v.photoCheck}
              onChange={(x) => set("photoCheck", x)}
            />
            <div>
              <Label className="text-sm font-semibold">Cargo insurance — declared value (USD)</Label>
              <Input
                type="number"
                min={0}
                step={100}
                className="mt-2 font-mono"
                value={v.insuranceValue}
                onChange={(e) => set("insuranceValue", Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Leave at 0 to decline cover.</p>
            </div>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <p className="eyebrow">Your quote</p>
          <p className="mt-2 text-sm font-semibold">{laneLabel(sailing)}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {sailing.voyage_no} · cut-off {weekdayDate(sailing.cargo_cutoff_at)}
          </p>

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            {(quote?.lines ?? []).map((l) => (
              <div key={l.key} className="flex justify-between gap-4">
                <dt className="text-secondary-foreground">{l.label}</dt>
                <dd>
                  <LiveValue value={usd(l.amount, { cents: true })} className="text-sm" />
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-bold">Total</span>
            <span className="text-2xl">
              <LiveValue value={quote ? usd(quote.total) : "—"} stamp={sailing.lastChangeAt} />
            </span>
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">
            <LiveValue value={quote ? usd(quote.allInPerCbm) : "—"} unit="/cbm all-in" className="text-xs" />
          </p>

          <div
            className={cn(
              "mt-4 rounded-lg p-3 text-xs",
              oversell ? "bg-warning-soft text-warning" : "bg-surface text-secondary-foreground",
            )}
          >
            {oversell ? (
              <>
                Only <LiveValue value={sailing.availableCbm.toFixed(1)} unit="cbm" className="text-xs" /> left on this
                sailing. We'll hold what fits and waitlist the rest for the next sailing on this lane.
              </>
            ) : (
              <>
                <LiveValue value={sailing.availableCbm.toFixed(1)} unit="cbm" className="text-xs" /> free right now.
                Space is confirmed transactionally, so it can never be sold twice.
              </>
            )}
          </div>

          {quote ? <div className="mt-5">{cta(quote, v)}</div> : null}

          {quote ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Same cargo via a Panama / Miami consolidator:{" "}
              <LiveValue value={usd(legacyLclEstimate(quote.chargeableCbm))} className="text-xs" /> and{" "}
              <LiveValue value={45} unit="days" className="text-xs" />.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FareCard({
  active,
  onClick,
  title,
  body,
  perCbm,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
  perCbm?: number | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-primary bg-accent" : "border-border hover:border-primary",
      )}
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-xs text-secondary-foreground">{body}</p>
      <p className="mt-3">
        <LiveValue value={perCbm ? usd(perCbm, { cents: true }) : "—"} unit="/cbm" tone={active ? "primary" : "default"} />
      </p>
    </button>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
