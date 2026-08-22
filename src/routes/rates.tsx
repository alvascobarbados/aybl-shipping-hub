import { createFileRoute } from "@tanstack/react-router";

import { PublicLayout } from "@/components/public-layout";
import { PageHeader, Panel } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { laneLabel, quoteFor, usePriceRules, useSailings } from "@/lib/queries";
import { usd } from "@/lib/format";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "Rates & fees — ABL Shipping direct LCL to Bridgetown" },
      { name: "description", content: "How ABL Shipping pricing works: lead-time steps, demand pricing, fare types and the full fee schedule per cubic metre." },
      { property: "og:title", content: "ABL Shipping rates and fee schedule" },
      { property: "og:description", content: "Lead-time steps, demand pricing and every fee, per cubic metre." },
    ],
  }),
  component: RatesPage,
});

function RatesPage() {
  const { data: rules } = usePriceRules();
  const { data: sailings = [] } = useSailings();
  const lanes = Array.from(new Map(sailings.map((s) => [s.origin.code, s])).values());

  return (
    <PublicLayout>
      <div className="wrap space-y-8 py-12">
        <PageHeader
          eyebrow="Pricing"
          title="How pricing works"
          lead="One all-in price per booking. Freight moves with how early you book and how full the sailing is; everything else is a published fee."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {lanes.map((s) => {
            const q = rules ? quoteFor(s, rules, { cbm: 1 }) : null;
            return (
              <Panel key={s.origin.code}>
                <p className="font-bold">{laneLabel(s)}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {(q?.lines ?? []).map((l) => (
                    <div key={l.key} className="flex justify-between">
                      <span className="text-secondary-foreground">{l.label}</span>
                      <LiveValue value={usd(l.amount, { cents: true })} className="text-sm" />
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-3 font-bold">
                    <span>All-in for 1 cbm</span>
                    <LiveValue value={q ? usd(q.total) : "—"} stamp={s.lastChangeAt} className="text-sm" />
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>

        {rules ? (
          <Panel className="p-0">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-bold">Booking window</h2>
              <p className="text-sm text-muted-foreground">Freight multiplier applied to the lane floor rate.</p>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                <Row k="Early" d={`${rules.early_days}+ days before cut-off`} v="×1.00" />
                <Row k="Standard" d={`${rules.std_days}–${rules.early_days} days before cut-off`} v={`×${rules.std_mult}`} />
                <Row k="Late" d={`under ${rules.std_days} days`} v={`×${rules.late_mult}`} />
                <Row k="Sailing over 70% full" d="demand step" v={`×${rules.demand70_mult}`} />
                <Row k="Sailing over 85% full" d="demand step" v={`×${rules.demand85_mult}`} />
                <Row k="Flex fare" d="free roll to the next sailing" v={`×${rules.flex_mult}`} />
                <Row k="Standing booking" d="same space every sailing, never pays the late step" v={`−${Math.round(rules.standing_discount * 100)}%`} />
              </tbody>
            </table>
          </Panel>
        ) : null}
      </div>
    </PublicLayout>
  );
}

function Row({ k, d, v }: { k: string; d: string; v: string }) {
  return (
    <tr>
      <td className="px-6 py-3.5 font-semibold">{k}</td>
      <td className="px-6 py-3.5 text-secondary-foreground">{d}</td>
      <td className="px-6 py-3.5 text-right">
        <LiveValue value={v} className="text-sm" />
      </td>
    </tr>
  );
}
