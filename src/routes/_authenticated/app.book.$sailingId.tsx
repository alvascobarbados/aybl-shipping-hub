import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page";
import { QuoteForm, type QuoteFormValues } from "@/components/quote-form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSailings, laneLabel } from "@/lib/queries";
import type { Quote } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/app/book/$sailingId")({
  component: BookPage,
});

function BookPage() {
  const { sailingId } = Route.useParams();
  const { data: sailings = [], isLoading } = useSailings();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const sailing = sailings.find((s) => s.id === sailingId);

  async function hold(quote: Quote, v: QuoteFormValues) {
    setBusy(true);
    const { data, error } = await supabase.rpc("hold_space", {
      p_sailing_id: sailingId,
      p_cbm: v.cbm,
      p_gross_kg: v.grossKg,
      p_cargo_type: v.cargoType,
      p_fare: v.fare,
      p_standing: v.standing,
      p_origin_option: v.origin,
      p_delivery_option: v.delivery,
      p_insurance_declared_value: v.insuranceValue,
      p_photo_check: v.photoCheck,
      p_price_breakdown: quote as unknown as Record<string, unknown>,
      p_total_usd: quote.total,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as unknown as { ref?: string; waitlisted_cbm?: number } | null;
    if (result?.waitlisted_cbm) {
      toast.info(`${result.waitlisted_cbm} cbm waitlisted for the next sailing on this lane.`);
    }
    if (result?.ref) {
      navigate({ to: "/app/bookings/$ref", params: { ref: result.ref } });
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Loading sailing…</p>;
  if (!sailing) return <p className="text-muted-foreground">That sailing is no longer available.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${sailing.voyage_no} · ${laneLabel(sailing)}`}
        title="Quote & book"
        lead="Hold space for 48 hours while you confirm with your supplier. The price you see is stored with the booking."
      />
      <QuoteForm
        sailing={sailing}
        cta={(quote, v) => (
          <Button className="w-full" size="lg" disabled={busy} onClick={() => hold(quote, v)}>
            {busy ? "Holding space…" : "Hold space & continue"}
          </Button>
        )}
      />
    </div>
  );
}
