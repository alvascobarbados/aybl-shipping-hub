import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PublicLayout } from "@/components/public-layout";
import { PageHeader } from "@/components/page";
import { SailingCard } from "@/components/sailing-card";
import { quoteFor, useSailings, usePriceRules } from "@/lib/queries";

export const Route = createFileRoute("/sailings")({
  head: () => ({
    meta: [
      { title: "Sailings — Yantian & Shanghai to Bridgetown | ABL Shipping" },
      { name: "description", content: "Live schedule of ABL Shipping direct LCL sailings to Bridgetown with cut-offs, transit times and remaining space." },
      { property: "og:title", content: "ABL Shipping sailings to Bridgetown" },
      { property: "og:description", content: "Cut-offs, sail dates and remaining space on every upcoming sailing." },
    ],
  }),
  component: PublicSailings,
});

function PublicSailings() {
  const { data: sailings = [] } = useSailings();
  const { data: rules } = usePriceRules();
  const [lane, setLane] = useState<string>("all");

  const lanes = Array.from(new Map(sailings.map((s) => [s.origin.code, s.origin])).values());
  const shown = sailings.filter((s) => lane === "all" || s.origin.code === lane);

  return (
    <PublicLayout>
      <div className="wrap space-y-8 py-12">
        <PageHeader
          eyebrow="Schedule"
          title="Upcoming sailings"
          lead="Every sailing shows its cargo cut-off, sail date and how much space is still free right now."
        />
        <div className="flex flex-wrap gap-2">
          {[{ code: "all", name: "All lanes" }, ...lanes].map((p) => (
            <button
              key={p.code}
              onClick={() => setLane(p.code)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                lane === p.code ? "border-primary bg-accent text-primary" : "border-border bg-card text-secondary-foreground"
              }`}
            >
              {p.code === "all" ? p.name : `${p.name} → Bridgetown`}
            </button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((s) => (
            <SailingCard
              key={s.id}
              sailing={s}
              allInOneCbm={rules ? quoteFor(s, rules, { cbm: 1 }).total : undefined}
              href="/quote"
            />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
