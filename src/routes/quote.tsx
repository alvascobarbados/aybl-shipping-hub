import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { PublicLayout } from "@/components/public-layout";
import { PageHeader } from "@/components/page";
import { QuoteForm } from "@/components/quote-form";
import { Button } from "@/components/ui/button";
import { boardStatus, laneLabel, useSailings } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Get a quote — AYBL LCL space to Bridgetown" },
      { name: "description", content: "Price your shipment on a live AYBL sailing in 30 seconds. All-in, port to port, no account needed." },
      { property: "og:title", content: "Get an AYBL quote in 30 seconds" },
      { property: "og:description", content: "Live all-in pricing for LCL space to Bridgetown." },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { data: sailings = [] } = useSailings();
  const bookable = sailings.filter((s) => boardStatus(s) !== "closed");
  const [id, setId] = useState<string | null>(null);
  const sailing = bookable.find((s) => s.id === id) ?? bookable[0];

  return (
    <PublicLayout>
      <div className="wrap space-y-8 py-12">
        <PageHeader
          eyebrow="30-second quote"
          title="Price your shipment"
          lead="Everything here is calculated live from the sailing you pick — its cut-off date and how full it already is."
        />

        <div className="flex flex-wrap gap-2">
          {bookable.map((s) => (
            <button
              key={s.id}
              onClick={() => setId(s.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-left text-sm font-semibold",
                sailing?.id === s.id ? "border-primary bg-accent text-primary" : "border-border bg-card text-secondary-foreground",
              )}
            >
              {laneLabel(s)} · <span className="font-mono">{shortDate(s.etd)}</span>
            </button>
          ))}
        </div>

        {sailing ? (
          <QuoteForm
            sailing={sailing}
            cta={() => (
              <Button asChild className="w-full" size="lg">
                <Link to="/signup">Create account to hold space</Link>
              </Button>
            )}
          />
        ) : (
          <p className="text-muted-foreground">No open sailings right now.</p>
        )}
      </div>
    </PublicLayout>
  );
}
