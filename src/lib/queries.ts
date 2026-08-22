import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { calcQuote, type PriceRules, type QuoteInput } from "@/lib/pricing";
import { daysUntil } from "@/lib/format";

export interface PortRow {
  id: string;
  code: string;
  name: string;
  country: string;
  cfs_address: string | null;
  cfs_address_zh: string | null;
  transit_days_to_bgi: number;
  floor_rate_usd: number;
}

export interface SailingRow {
  id: string;
  voyage_no: string;
  cargo_cutoff_at: string;
  etd: string;
  eta: string;
  capacity_cbm: number;
  capacity_kg: number;
  status: string;
  origin: PortRow;
  destination: PortRow;
  bookedCbm: number;
  heldCbm: number;
  backfillCbm: number;
  committedCbm: number;
  availableCbm: number;
  bookedKg: number;
  lastChangeAt: string;
}

export const laneLabel = (s: SailingRow) => `${s.origin.name} → ${s.destination.name}`;
export const laneCodes = (s: SailingRow) => `${s.origin.code} → ${s.destination.code}`;
export const transitDays = (s: SailingRow) =>
  Math.round((new Date(s.eta).getTime() - new Date(s.etd).getTime()) / 86_400_000);

export function boardStatus(s: SailingRow): "open" | "filling" | "waitlist" | "closed" {
  if (s.status !== "open" || new Date(s.cargo_cutoff_at) <= new Date()) return "closed";
  if (s.availableCbm <= 0) return "waitlist";
  if (s.availableCbm <= 10) return "filling";
  return "open";
}

export async function fetchSailings(): Promise<SailingRow[]> {
  const [{ data: sailings, error }, { data: availability }] = await Promise.all([
    supabase
      .from("sailings")
      .select(
        "id, voyage_no, cargo_cutoff_at, etd, eta, capacity_cbm, capacity_kg, status, origin:ports!sailings_origin_port_id_fkey(*), destination:ports!sailings_destination_port_id_fkey(*)",
      )
      .order("etd", { ascending: true }),
    supabase.from("sailing_availability").select("*"),
  ]);

  if (error) throw error;

  const byId = new Map((availability ?? []).map((a) => [a.sailing_id as string, a]));

  return ((sailings ?? []) as unknown as Array<Record<string, unknown>>).map((s) => {
    const a = (byId.get(s["id"] as string) ?? {}) as Record<string, number | string>;
    return {
      ...(s as unknown as Omit<
        SailingRow,
        | "bookedCbm"
        | "heldCbm"
        | "backfillCbm"
        | "committedCbm"
        | "availableCbm"
        | "bookedKg"
        | "lastChangeAt"
      >),
      bookedCbm: Number(a["booked_cbm"] ?? 0),
      heldCbm: Number(a["held_cbm"] ?? 0),
      backfillCbm: Number(a["backfill_cbm"] ?? 0),
      committedCbm: Number(a["committed_cbm"] ?? 0),
      availableCbm: Number(a["available_cbm"] ?? 0),
      bookedKg: Number(a["booked_kg"] ?? 0),
      lastChangeAt: String(a["last_change_at"] ?? new Date().toISOString()),
    } as SailingRow;
  });
}

export async function fetchPriceRules(): Promise<PriceRules> {
  const { data, error } = await supabase
    .from("price_rules")
    .select("*")
    .eq("is_active", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as PriceRules;
}

export const useSailings = () =>
  useQuery({ queryKey: ["sailings"], queryFn: fetchSailings, staleTime: 15_000 });

export const usePriceRules = () =>
  useQuery({ queryKey: ["price_rules"], queryFn: fetchPriceRules, staleTime: 300_000 });

/** Quote a sailing straight from live data — never from typed-in numbers. */
export function quoteFor(
  sailing: SailingRow,
  rules: PriceRules,
  opts: Partial<Omit<QuoteInput, "floorRateUsd" | "originPortName" | "daysToCutoff" | "committedCbm" | "capacityCbm" | "rules">> & {
    cbm: number;
  },
) {
  return calcQuote({
    ...opts,
    floorRateUsd: Number(sailing.origin.floor_rate_usd),
    originPortName: sailing.origin.name,
    daysToCutoff: daysUntil(sailing.cargo_cutoff_at),
    committedCbm: sailing.committedCbm,
    capacityCbm: Number(sailing.capacity_cbm),
    rules,
  });
}
