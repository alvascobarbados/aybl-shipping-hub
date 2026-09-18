import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { TZ } from "@/lib/format";
import type { PortRow, SailingRow } from "@/lib/queries";

export type SortKey = "soonest" | "space";

export interface SearchCriteria {
  /** Origin port code, or "all" for every China port. */
  from: string;
  /** Destination port code. */
  to: string;
  /** ISO date (yyyy-mm-dd) or "" — filters out sailings whose cut-off is earlier. */
  readyBy: string;
}

export const DEFAULT_CRITERIA: SearchCriteria = { from: "all", to: "BBBGI", readyBy: "" };

/** "Shenzhen (Yantian)" · "Shanghai" · "Bridgetown". */
export function portLabel(p: Pick<PortRow, "name" | "city">) {
  return p.city && p.city !== p.name ? `${p.city} (${p.name})` : p.name;
}

export const originCity = (p: Pick<PortRow, "name" | "city">) => p.city ?? p.name;

export const takenCbm = (s: SailingRow) => s.bookedCbm;
export const pendingCbm = (s: SailingRow) => s.heldCbm + s.backfillCbm;
export const freeCbm = (s: SailingRow) => s.availableCbm;

/** Whole days from today to the cut-off, in Barbados time. */
export function daysToCutoff(cutoff: string) {
  const day = (d: Date) => new Date(d.toLocaleDateString("en-US", { timeZone: TZ })).getTime();
  return Math.round((day(new Date(cutoff)) - day(new Date())) / 86_400_000);
}

export function deadlineText(cutoff: string) {
  const d = daysToCutoff(cutoff);
  if (d < 0) return "closed";
  if (d === 0) return "today";
  if (d === 1) return "1 day";
  return `${d} days`;
}

export type DeadlineTone = "amber" | "red" | "grey";

export function deadlineTone(cutoff: string): DeadlineTone {
  const d = daysToCutoff(cutoff);
  if (d < 0) return "grey";
  if (d <= 7) return "red";
  return "amber";
}

export const isBookable = (s: SailingRow) =>
  s.status === "open" && new Date(s.cargo_cutoff_at).getTime() > Date.now();

export function runSearch(all: SailingRow[], c: SearchCriteria, sort: SortKey): SailingRow[] {
  const ready = c.readyBy ? new Date(`${c.readyBy}T23:59:59`).getTime() : null;
  const rows = all.filter((s) => {
    if (!isBookable(s)) return false;
    if (c.to !== "all" && s.destination.code !== c.to) return false;
    if (c.from !== "all" && s.origin.code !== c.from) return false;
    if (ready !== null && new Date(s.cargo_cutoff_at).getTime() < ready) return false;
    return true;
  });
  return rows.sort((a, b) =>
    sort === "space"
      ? freeCbm(b) - freeCbm(a) || +new Date(a.cargo_cutoff_at) - +new Date(b.cargo_cutoff_at)
      : +new Date(a.cargo_cutoff_at) - +new Date(b.cargo_cutoff_at),
  );
}

export interface Badges {
  soonestId: string | null;
  mostSpaceId: string | null;
}

export function badgesFor(rows: SailingRow[]): Badges {
  if (rows.length === 0) return { soonestId: null, mostSpaceId: null };
  const soonest = [...rows].sort(
    (a, b) => +new Date(a.cargo_cutoff_at) - +new Date(b.cargo_cutoff_at),
  )[0]!;
  const most = [...rows].sort((a, b) => freeCbm(b) - freeCbm(a))[0]!;
  return {
    soonestId: soonest.id,
    mostSpaceId: most.id === soonest.id ? null : most.id,
  };
}

/** Live availability: any booking change re-reads the board. */
export function useAvailabilityRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("public-availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        void qc.invalidateQueries({ queryKey: ["sailings"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
