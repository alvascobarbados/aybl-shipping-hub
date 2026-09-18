import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface SiteContact {
  id: string;
  side: string;
  label: string;
  audience_note: string | null;
  company_name: string | null;
  contact_name: string | null;
  address: string | null;
  address_zh: string | null;
  phone: string | null;
  whatsapp: string | null;
  wechat: string | null;
  email: string | null;
  hours: string | null;
  hours_zh: string | null;
  timezone: string | null;
}

export async function fetchSiteContacts(): Promise<SiteContact[]> {
  const { data, error } = await supabase.from("site_settings").select("*").order("side", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as SiteContact[];
}

export const useSiteContacts = () =>
  useQuery({ queryKey: ["site_settings"], queryFn: fetchSiteContacts, staleTime: 300_000 });

export const contactBySide = (rows: SiteContact[] | undefined, side: "barbados" | "china") =>
  (rows ?? []).find((r) => r.side === side);
