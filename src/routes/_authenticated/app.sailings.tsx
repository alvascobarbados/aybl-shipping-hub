import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page";
import { SailingCard } from "@/components/sailing-card";
import { quoteFor, usePriceRules, useSailings } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/sailings")({
  component: CustomerSailings,
});

function CustomerSailings() {
  const { data: sailings = [] } = useSailings();
  const { data: rules } = usePriceRules();
  const [lane, setLane] = useState("all");
  const queryClient = useQueryClient();

  // Realtime: availability is derived from bookings, so watch the source tables.
  useEffect(() => {
    const channel = supabase
      .channel("availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () =>
        queryClient.invalidateQueries({ queryKey: ["sailings"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "sailings" }, () =>
        queryClient.invalidateQueries({ queryKey: ["sailings"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const lanes = Array.from(new Map(sailings.map((s) => [s.origin.code, s.origin])).values());
  const shown = sailings.filter((s) => lane === "all" || s.origin.code === lane);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Customer portal" title="Sailings board" lead="Live space on every upcoming sailing." />

      <div className="flex flex-wrap gap-2">
        {[{ code: "all", name: "All lanes" }, ...lanes].map((p) => (
          <button
            key={p.code}
            onClick={() => setLane(p.code)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold",
              lane === p.code ? "border-primary bg-accent text-primary" : "border-border bg-card text-secondary-foreground",
            )}
          >
            {p.code === "all" ? p.name : `${p.name} → Bridgetown`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {shown.map((s) => (
          <SailingCard
            key={s.id}
            sailing={s}
            allInOneCbm={rules ? quoteFor(s, rules, { cbm: 1 }).total : undefined}
            href={`/app/book/${s.id}`}
          />
        ))}
      </div>
    </div>
  );
}
