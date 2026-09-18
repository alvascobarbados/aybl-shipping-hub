import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { bookPath } from "@/lib/reserve";
import { boardStatus, type SailingRow } from "@/lib/queries";

/** Enters the reserve flow, carrying the choice through sign-up if needed. */
export function ReserveButton({ sailing, cbm = 1 }: { sailing: SailingRow; cbm?: number }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const waitlist = boardStatus(sailing) === "waitlist";

  function go() {
    if (user) {
      navigate({ to: "/app/book/$sailingId", params: { sailingId: sailing.id }, search: { cbm } });
      return;
    }
    navigate({ to: "/signup", search: { next: bookPath(sailing.id), cbm } });
  }

  return (
    <Button onClick={go} variant={waitlist ? "outline" : "default"}>
      {waitlist ? "Join waitlist" : "Reserve space"}
    </Button>
  );
}
