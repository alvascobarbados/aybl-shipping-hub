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
  validateSearch: (s: Record<string, unknown>) => ({
    cbm: num(s["cbm"]),
    kg: num(s["kg"]),
  }),
  component: BookPage,
});

function BookPage() {
  const { sailingId } = Route.useParams();
  const { cbm, kg } = Route.useSearch();
  const { data: sailings = [], isLoading } = useSailings();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const sailing = sailings.find((s) => s.id === sailingId);

  async function hold(_quote: Quote, v: QuoteFormValues) {
    setBusy(true);
    const { data, error } = await supabase.rpc("hold_space", {
      _sailing_id: sailingId,
      _cbm: v.cbm,
      _gross_kg: v.grossKg,
      _cargo_type: v.cargoType,
      _fare: v.fare,
      _standing: v.standing,
      _origin: v.origin,
      _delivery: v.delivery,
      _insurance_value: v.insuranceValue,
      _photo_check: v.photoCheck,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as unknown as { ref?: string; waitlisted?: number } | null;
    if (result?.waitlisted) {
      toast.info(`${result.waitlisted} cbm waitlisted for the next sailing on this lane.`);
    }
    if (result?.ref) {
      navigate({ to: "/app/bookings/$ref", params: { ref: result.ref } });
    } else {
      toast.info("No space left on this sailing — you're on the waitlist for the next one.");
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
