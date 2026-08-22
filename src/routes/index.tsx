import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldCheck, Timer, Boxes, Ship, Warehouse, PackageCheck, Anchor } from "lucide-react";

import { PublicLayout } from "@/components/public-layout";
import { LiveValue } from "@/components/live-value";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePriceRules, useSailings, quoteFor, laneLabel, laneCodes, boardStatus, transitDays } from "@/lib/queries";
import { countdown, shortDate, usd, weekdayDate } from "@/lib/format";
import { legacyLclEstimate } from "@/lib/pricing";
import { StatusPill } from "@/components/sailing-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ABL Shipping - Direct LCL ocean freight, China to Bridgetown" },
      {
        name: "description",
        content:
          "Book cubic metres of space on scheduled Yantian → Bridgetown and Shanghai → Bridgetown sailings. All-in pricing, fixed cut-offs, no transhipment through Panama.",
      },
      { property: "og:title", content: "ABL Shipping - Direct LCL ocean freight, China to Bridgetown" },
      {
        property: "og:description",
        content: "Book cubic metres of space on scheduled direct sailings to Bridgetown. All-in pricing, live availability.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <PublicLayout>
      <Hero />
      <QuickQuote />
      <RouteDiagram />
      <Proof />
      <HowItWorks />
      <Schedule />
      <Rates />
      <WhoItsFor />
      <section id="container" className="wrap py-16">
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="eyebrow">Coming soon</p>
          <p className="mt-2 font-semibold">Interactive container view</p>
          <p className="mt-1 text-sm text-muted-foreground">
            See exactly how much space your cargo takes inside the container.
          </p>
        </div>
      </section>
      <FinalCta />
    </PublicLayout>
  );
}

function Hero() {
  const { data: sailings = [] } = useSailings();
  const board = sailings.filter((s) => ["open", "scheduled"].includes(s.status)).slice(0, 6);

  return (
    <section className="wrap grid items-start gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
      <div>
        <p className="eyebrow">Yantian & Shanghai → Bridgetown</p>
        <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-6xl">
          Ship from China without filling a container. Or waiting in Panama.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-secondary-foreground">
          Book the cubic metres you actually need on a scheduled direct sailing. One all-in price, a published cut-off,
          and cargo that stays on one vessel to Bridgetown.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/quote">Get a 30-second quote</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/sailings">See sailings</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-board text-board-foreground shadow-lg">
        <div className="flex items-center justify-between border-b border-board-2 px-5 py-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-board-muted">DEPARTURES</p>
            <p className="text-lg font-bold">Bridgetown service</p>
          </div>
          <span className="flex items-center gap-2 font-mono text-[11px] text-board-green">
            <i className="size-[7px] rounded-full bg-board-green" aria-hidden /> LIVE
          </span>
        </div>
        <div className="divide-y divide-board-2">
          {board.map((s) => (
            <div key={s.id} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{laneLabel(s)}</p>
                <p className="font-mono text-[11px] text-board-muted">
                  {s.voyage_no} · {laneCodes(s)}
                </p>
              </div>
              <div className="text-right font-mono text-sm">
                <LiveValue value={shortDate(s.etd)} tone="board" />
                <span className="mt-0.5 block text-[11px]">
                  <LiveValue
                    value={s.availableCbm <= 0 ? "WAITLIST" : `${s.availableCbm.toFixed(1)} cbm free`}
                    tone={s.availableCbm <= 0 ? "amber" : "green"}
                    className="text-[11px]"
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickQuote() {
  const { data: sailings = [] } = useSailings();
  const { data: rules } = usePriceRules();
  const [code, setCode] = useState<string | null>(null);
  const [cbm, setCbm] = useState(3);

  const openSailings = sailings.filter((s) => boardStatus(s) !== "closed");
  const lanes = Array.from(new Map(openSailings.map((s) => [s.origin.code, s.origin])).values());
  const activeCode = code ?? lanes[0]?.code ?? null;
  const sailing = openSailings.find((s) => s.origin.code === activeCode);

  const quote = useMemo(
    () => (sailing && rules ? quoteFor(sailing, rules, { cbm }) : null),
    [sailing, rules, cbm],
  );
  const legacy = quote ? legacyLclEstimate(quote.chargeableCbm) : 0;

  return (
    <section className="bg-surface py-16">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow">30-second quote</p>
          <h2 className="mt-3 text-3xl font-extrabold">No account. No sales call.</h2>
          <p className="mt-3 text-secondary-foreground">
            Pick your origin port and drag the volume. The price is calculated live from the current sailing, its
            cut-off date and how full it already is.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {lanes.map((p) => (
              <button
                key={p.code}
                onClick={() => setCode(p.code)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCode === p.code
                    ? "border-primary bg-accent text-primary"
                    : "border-border bg-card text-secondary-foreground hover:border-primary"
                }`}
              >
                {p.name} → Bridgetown
              </button>
            ))}
          </div>
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Volume</span>
              <LiveValue value={cbm.toFixed(1)} unit="cbm" />
            </div>
            <Slider
              className="mt-4"
              min={0.5}
              max={30}
              step={0.5}
              value={[cbm]}
              onValueChange={(v) => setCbm(v[0] ?? 1)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          {quote && sailing ? (
            <>
              <p className="text-sm text-muted-foreground">
                Next sailing {sailing.voyage_no}, cut-off <LiveValue value={weekdayDate(sailing.cargo_cutoff_at)} className="text-sm" />
              </p>
              <p className="mt-4 text-5xl">
                <LiveValue value={usd(quote.total)} stamp={sailing.lastChangeAt} />
              </p>
              <p className="mt-2 text-sm text-secondary-foreground">
                all-in, port to port ·{" "}
                <LiveValue value={usd(quote.allInPerCbm)} unit="/cbm" className="text-sm" />
              </p>
              <dl className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                {quote.lines.map((l) => (
                  <div key={l.key} className="flex justify-between gap-4">
                    <dt className="text-secondary-foreground">{l.label}</dt>
                    <dd>
                      <LiveValue value={usd(l.amount, { cents: true })} className="text-sm" />
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 rounded-lg bg-surface p-4 text-sm">
                Typical Panama / Miami LCL for the same cargo:{" "}
                <LiveValue value={usd(legacy)} className="text-sm" /> and{" "}
                <LiveValue value={45} unit="days" className="text-sm" /> door to door.
              </div>
              <Button asChild className="mt-5 w-full" size="lg">
                <Link to="/quote">Continue to booking</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading live rates…</p>
          )}
        </div>
      </div>
    </section>
  );
}

function RouteDiagram() {
  const { data: sailings = [] } = useSailings();
  const first = sailings[0];
  const steps = [
    { icon: <Warehouse className="size-5" />, k: "Origin CFS", v: "Yantian or Shanghai" },
    { icon: <Ship className="size-5" />, k: "One vessel", v: "No transhipment" },
    { icon: <Anchor className="size-5" />, k: "Bridgetown", v: "BBBGI" },
    { icon: <PackageCheck className="size-5" />, k: "Collect", v: "Or delivered" },
  ];
  return (
    <section className="wrap py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.k} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">{s.icon}</div>
            <p className="mt-4 font-bold">{s.k}</p>
            <p className="text-sm text-muted-foreground">{s.v}</p>
          </div>
        ))}
      </div>
      {first ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Port-to-port transit on the current schedule: <LiveValue value={transitDays(first)} unit="days" className="text-sm" />
        </p>
      ) : null}
    </section>
  );
}

function Proof() {
  const cards = [
    {
      icon: <Boxes className="size-5" />,
      title: "Buy space by the cubic metre",
      body: "Half a pallet or half the container — you pay for the volume you book, rounded to 0.5 cbm.",
    },
    {
      icon: <Timer className="size-5" />,
      title: "Published cut-offs",
      body: "Every sailing has a cargo cut-off and a sail date. If your cartons arrive, they sail.",
    },
    {
      icon: <ShieldCheck className="size-5" />,
      title: "Price locked at booking",
      body: "Your line items are stored with the booking. A later tariff change never touches a confirmed price.",
    },
  ];
  return (
    <section className="bg-surface py-16">
      <div className="wrap grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">{c.icon}</div>
            <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
            <p className="mt-2 text-sm text-secondary-foreground">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  ["Book space", "Choose a sailing, enter your volume and hold the space for 48 hours."],
  ["Send cartons", "Your supplier delivers to our origin CFS with your booking reference on every carton."],
  ["We load & seal", "Cargo is checked in, photographed if you asked, then loaded and sealed."],
  ["Collect in Bridgetown", "Track each milestone and collect, or have it delivered."],
];

function HowItWorks() {
  return (
    <section className="wrap py-16">
      <p className="eyebrow">How it works</p>
      <h2 className="mt-3 text-3xl font-extrabold">Four steps, no freight jargon</h2>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([t, b], i) => (
          <li key={t} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <span className="font-mono text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-bold">{t}</h3>
            <p className="mt-2 text-sm text-secondary-foreground">{b}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Schedule() {
  const { data: sailings = [] } = useSailings();
  return (
    <section className="bg-surface py-16">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Schedule</p>
            <h2 className="mt-3 text-3xl font-extrabold">Upcoming sailings</h2>
          </div>
          <Link to="/sailings" className="text-sm font-semibold text-primary">
            Full sailings board →
          </Link>
        </div>
        <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              <tr>
                {["Voyage", "Lane", "Cut-off", "Sails", "Arrives", "Space", "Status"].map((h) => (
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
                  <td className="px-5 py-3.5">
                    <StatusPill status={boardStatus(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Rates() {
  const { data: sailings = [] } = useSailings();
  const { data: rules } = usePriceRules();
  const ports = Array.from(new Map(sailings.map((s) => [s.origin.code, s])).values());

  return (
    <section className="wrap py-16">
      <p className="eyebrow">Live rates</p>
      <h2 className="mt-3 text-3xl font-extrabold">What one cubic metre costs today</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {ports.map((s) => {
          const q = rules ? quoteFor(s, rules, { cbm: 1 }) : null;
          return (
            <div key={s.origin.code} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <p className="font-bold">{laneLabel(s)}</p>
              <p className="font-mono text-xs text-muted-foreground">{laneCodes(s)}</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Freight from</p>
                  <p className="mt-1 text-xl">
                    <LiveValue value={usd(Number(s.origin.floor_rate_usd))} unit="/cbm" tone="primary" />
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">All-in 1 cbm</p>
                  <p className="mt-1 text-xl">
                    <LiveValue value={q ? usd(q.total) : "—"} stamp={s.lastChangeAt} />
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/rates" className="font-semibold text-primary">
          See the full rate card and fee schedule →
        </Link>
      </p>
    </section>
  );
}

function WhoItsFor() {
  const who = [
    ["Shop owners in Bridgetown", "Restock from Yiwu and Guangzhou without waiting to fill a 20ft."],
    ["Contractors & trades", "Tools, fittings and materials on a date you can plan around."],
    ["Suppliers in Shenzhen", "Deliver cartons to a CFS you already know, with a clear label."],
  ];
  return (
    <section className="bg-surface py-16">
      <div className="wrap">
        <p className="eyebrow">Who it's for</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {who.map(([t, b]) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-bold">{t}</h3>
              <p className="mt-2 text-sm text-secondary-foreground">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { data: sailings = [] } = useSailings();
  const next = sailings.find((s) => boardStatus(s) !== "closed");
  return (
    <section className="wrap pb-4">
      <div className="rounded-xl bg-board p-10 text-center text-board-foreground">
        <h2 className="text-3xl font-extrabold">Book space on the next sailing</h2>
        {next ? (
          <p className="mt-3 font-mono text-sm text-board-muted">
            {next.voyage_no} · cut-off closes in{" "}
            <LiveValue value={countdown(next.cargo_cutoff_at)} tone="amber" className="text-sm" />
          </p>
        ) : null}
        <Button asChild size="lg" className="mt-6">
          <Link to="/quote">Get a quote</Link>
        </Button>
      </div>
    </section>
  );
}
