import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { QuoteLine } from "@/lib/pricing";

export interface BookingRow {
  id: string;
  ref: string;
  cbm: number;
  gross_kg: number;
  chargeable_cbm: number;
  cargo_type: string;
  fare: string;
  standing: boolean;
  origin_option: string;
  delivery_option: string;
  insurance_declared_value: number;
  photo_check: boolean;
  price_breakdown: { lines: QuoteLine[]; ratePerCbm?: number; allInPerCbm?: number } | null;
  total_usd: number;
  status: string;
  hold_expires_at: string | null;
  seal_no: string | null;
  paid_at?: string | null;
  created_at: string;
  sailing: {
    id: string;
    voyage_no: string;
    etd: string;
    eta: string;
    cargo_cutoff_at: string;
    origin: { code: string; name: string; cfs_address: string | null; cfs_address_zh: string | null };
    destination: { code: string; name: string };
  };
}

const SELECT =
  "*, sailing:sailings(id, voyage_no, etd, eta, cargo_cutoff_at, origin:ports!sailings_origin_port_id_fkey(code,name,cfs_address,cfs_address_zh), destination:ports!sailings_destination_port_id_fkey(code,name))";

export async function fetchBookings(): Promise<BookingRow[]> {
  const { data, error } = await supabase.from("bookings").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BookingRow[];
}

export async function fetchBooking(ref: string): Promise<BookingRow | null> {
  const { data, error } = await supabase.from("bookings").select(SELECT).eq("ref", ref).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as BookingRow | null;
}

export interface BookingEvent {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export async function fetchBookingEvents(bookingId: string): Promise<BookingEvent[]> {
  const { data, error } = await supabase
    .from("booking_events")
    .select("id, status, note, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as BookingEvent[];
}

export const useBookings = () => useQuery({ queryKey: ["bookings"], queryFn: fetchBookings });
export const useBooking = (ref: string) =>
  useQuery({ queryKey: ["booking", ref], queryFn: () => fetchBooking(ref) });
export const useBookingEvents = (bookingId?: string) =>
  useQuery({
    queryKey: ["booking_events", bookingId],
    queryFn: () => fetchBookingEvents(bookingId as string),
    enabled: Boolean(bookingId),
  });

export const MILESTONES = [
  { key: "held", label: "Booked" },
  { key: "confirmed", label: "Paid" },
  { key: "received", label: "Received at origin warehouse" },
  { key: "loaded", label: "Loaded & sealed" },
  { key: "sailed", label: "Sailed" },
  { key: "arrived", label: "Arrived Bridgetown" },
  { key: "released", label: "Ready to collect" },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  held: "Held",
  confirmed: "Confirmed",
  received: "Received",
  loaded: "Loaded",
  sailed: "On the water",
  arrived: "Arrived",
  released: "Ready to collect",
  cancelled: "Cancelled",
  expired: "Expired",
};
