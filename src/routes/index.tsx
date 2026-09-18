import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PublicLayout } from "@/components/public-layout";
import { Legend } from "@/components/reserve/legend";
import { ReserveDrawer } from "@/components/reserve/reserve-drawer";
import { ResultsHeader } from "@/components/reserve/results-header";
import { SailingResultRow } from "@/components/reserve/sailing-row";
import { SearchCard } from "@/components/reserve/search-card";
import { Button } from "@/components/ui/button";
import { shortDate } from "@/lib/format";
import { useOriginPorts, useSailings } from "@/lib/queries";
import { num } from "@/lib/reserve";
import {
  DEFAULT_CRITERIA,
  badgesFor,
  freeCbm,
  portLabel,
  runSearch,
  useAvailabilityRealtime,
  type SearchCriteria,
  type SortKey,
} from "@/lib/sailing-search";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    reserve: typeof s["reserve"] === "string" ? (s["reserve"] as string) : undefined,
    cbm: num(s["cbm"]),
  }),
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
        content: "Reserve space by the cubic metre on scheduled direct sailings to Bridgetown. One all-in price.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: sailings = [], isPending } = useSailings();
  const { data: ports = [] } = useOriginPorts();
  useAvailabilityRealtime();

  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA);
  const [sort, setSort] = useState<SortKey>("soonest");
  const [qty, setQty] = useState<Record<string, number>>({});

  const rows = useMemo(() => runSearch(sailings, criteria, sort), [sailings, criteria, sort]);
  const badges = useMemo(() => badgesFor(rows), [rows]);

  const soonestRow = rows.find((r) => r.id === badges.soonestId);
  const mostSpaceRow = [...rows].sort((a, b) => freeCbm(b) - freeCbm(a))[0];

  const fromPort = ports.find((p) => p.code === criteria.from);
  const laneLabel = `${fromPort ? portLabel(fromPort) : "China (All)"} → Bridgetown, Barbados`;

  const openSailing = sailings.find((s) => s.id === search.reserve) ?? null;
  const drawerCbm = openSailing ? (qty[openSailing.id] ?? search.cbm ?? 1) : 1;

  const setCbm = (id: string, n: number) => setQty((q) => ({ ...q, [id]: n }));

  function openDrawer(id: string, cbm: number) {
    setCbm(id, cbm);
    void navigate({ to: "/", search: { reserve: id, cbm } });
  }

  function closeDrawer() {
    void navigate({ to: "/", search: { reserve: undefined, cbm: undefined } });
  }

  return (
    <PublicLayout>
      <section id="search" className="scroll-mt-20 border-b border-border bg-surface py-10 sm:py-12">
        <div className="wrap max-w-[1120px]">
          <h1 className="text-[28px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-4xl">
            Reserve space on the next sailing to Bridgetown.
          </h1>
          <p className="mt-2 text-base text-secondary-foreground">
            Direct from Yantian or Shanghai. Book by the cubic metre.
          </p>
          <div className="mt-6">
            <SearchCard value={criteria} onSearch={setCriteria} />
          </div>
        </div>
      </section>

      <section className="wrap max-w-[1120px] py-8">
        <ResultsHeader
          lane={laneLabel}
          count={rows.length}
          sort={sort}
          onSort={setSort}
          onEdit={() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" })}
          soonestSub={soonestRow ? shortDate(soonestRow.cargo_cutoff_at) : null}
          mostSpaceSub={mostSpaceRow ? `${freeCbm(mostSpaceRow).toFixed(1)} cbm` : null}
        />

        <div className="mt-5">
          {isPending ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="border-t border-border py-6">
                <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-2" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="border-t border-border py-10 text-center">
              <p className="text-sm font-semibold">No sailings match.</p>
              <Button
                variant="outline"
                className="mt-3 rounded-lg"
                onClick={() => setCriteria({ ...DEFAULT_CRITERIA })}
              >
                Show all from China
              </Button>
            </div>
          ) : (
            rows.map((s) => (
              <SailingResultRow
                key={s.id}
                sailing={s}
                cbm={Math.min(qty[s.id] ?? 1, Math.max(0.5, freeCbm(s)))}
                onCbm={(n) => setCbm(s.id, n)}
                onReserve={() => openDrawer(s.id, Math.min(qty[s.id] ?? 1, Math.max(0.5, freeCbm(s))))}
                soonest={badges.soonestId === s.id}
                mostSpace={badges.mostSpaceId === s.id}
              />
            ))
          )}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <Legend />
        </div>
      </section>

      <ReserveDrawer
        sailing={openSailing}
        cbm={drawerCbm}
        onCbm={(n) => openSailing && setCbm(openSailing.id, n)}
        onClose={closeDrawer}
      />
    </PublicLayout>
  );
}
