import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "@/components/public-layout";
import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { LiveValue } from "@/components/live-value";
import { useSailings, laneLabel, transitDays } from "@/lib/queries";
import { shortDate, weekdayDate } from "@/lib/format";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — booking LCL space with ABL Shipping" },
      { name: "description", content: "Book cubic metres, send cartons to our origin CFS, we load and seal, you collect in Bridgetown. Every milestone tracked." },
      { property: "og:title", content: "How ABL Shipping works" },
      { property: "og:description", content: "From booking space to collecting cargo in Bridgetown, step by step." },
    ],
  }),
  component: HowItWorksPage,
});

const stages = [
  ["Book space", "Pick a sailing and enter your volume and weight. Space is held for 48 hours while you confirm with your supplier."],
  ["Pay & confirm", "Your line items are locked to the booking. A later tariff change never touches a confirmed price."],
  ["Cartons received", "Your supplier delivers to the origin CFS quoting the booking reference. We check in and photograph on request."],
  ["Loaded & sealed", "Your cartons are loaded, the container is sealed and the seal number appears on your booking."],
  ["Sailed", "One vessel, no transhipment through Panama."],
  ["Arrived Bridgetown", "We devan at the destination CFS and release."],
  ["Ready to collect", "Collect yourself or have it delivered anywhere in Barbados."],
];

function HowItWorksPage() {
  const { data: sailings = [] } = useSailings();
  const next = sailings[0];

  return (
    <PublicLayout>
      <div className="wrap space-y-10 py-12">
        <PageHeader
          eyebrow="The service"
          title="From your supplier's door to Bridgetown"
          lead="A scheduled direct LCL service. You buy cubic metres on a named voyage, not a slot in someone's consolidation queue."
        />

        <ol className="grid gap-4 md:grid-cols-2">
          {stages.map(([t, b], i) => (
            <li key={t} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <span className="font-mono text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-2 font-bold">{t}</h2>
              <p className="mt-2 text-sm text-secondary-foreground">{b}</p>
            </li>
          ))}
        </ol>

        <section className="space-y-3">
          <h2 className="text-2xl font-extrabold">Cut-offs, explained</h2>
          <p className="text-secondary-foreground">
            The cargo cut-off is the last moment your cartons can arrive at our origin warehouse and still travel on
            that sailing. A sailing takes bookings from the day it opens until its cut-off; after that it closes,
            loads and sails. Book earlier and the freight rate is lower.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold">The schedule</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border text-left text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                <tr>
                  {["Voyage", "Lane", "Cut-off", "Sails", "Arrives", "Space"].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sailings.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3.5 font-mono font-semibold">{s.voyage_no}</td>
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
                      <LiveValue value={s.availableCbm.toFixed(1)} unit="cbm" className="text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {next ? (
          <Panel className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Next cut-off</p>
              <p className="mt-2 font-bold">{laneLabel(next)}</p>
              <p className="text-sm text-secondary-foreground">
                Cargo cut-off <LiveValue value={weekdayDate(next.cargo_cutoff_at)} className="text-sm" /> · transit{" "}
                <LiveValue value={transitDays(next)} unit="days" className="text-sm" />
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/" hash="search" search={{ reserve: undefined, cbm: undefined }}>
                Reserve space
              </Link>
            </Button>
          </Panel>
        ) : null}
      </div>
    </PublicLayout>
  );
}
