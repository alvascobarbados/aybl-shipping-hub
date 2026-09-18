import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CbmStepper } from "@/components/reserve/cbm-stepper";
import { ContainerBar } from "@/components/reserve/container-bar";
import { DeadlineChip } from "@/components/reserve/deadline-chip";
import { JourneyLine } from "@/components/reserve/journey-line";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { weekdayDate } from "@/lib/format";
import type { SailingRow } from "@/lib/queries";
import { freeCbm, originCity, portLabel } from "@/lib/sailing-search";
import { cn } from "@/lib/utils";

interface Held {
  held: number;
  waitlisted: number;
  ref: string | null;
}

interface Props {
  sailing: SailingRow | null;
  cbm: number;
  onCbm: (n: number) => void;
  onClose: () => void;
}

function useMyCompanyName(enabled: boolean) {
  return useQuery({
    queryKey: ["my-company-name"],
    enabled,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("company:companies(name)").maybeSingle();
      const company = (data as { company?: { name?: string } | null } | null)?.company;
      return company?.name ?? null;
    },
  });
}

export function ReserveDrawer({ sailing, cbm, onCbm, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: companyName } = useMyCompanyName(Boolean(user && sailing));
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState<Held | null>(null);

  // The panel stays mounted so it can slide in and out. `open` drives the transform;
  // `shown` keeps the last sailing's content on screen while the panel slides away.
  const open = sailing !== null;
  const [shown, setShown] = useState<SailingRow | null>(sailing);
  useEffect(() => {
    if (sailing) setShown(sailing);
  }, [sailing]);
  const s = sailing ?? shown;

  useEffect(() => {
    setHeld(null);
  }, [sailing?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const free = s ? freeCbm(s) : 0;

  async function hold() {
    if (!sailing) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("hold_space", { _sailing_id: sailing.id, _cbm: cbm });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const r = data as unknown as { held: number; waitlisted: number; ref?: string };
    void qc.invalidateQueries({ queryKey: ["sailings"] });
    setHeld({ held: Number(r.held), waitlisted: Number(r.waitlisted), ref: r.ref ?? null });
  }

  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")} aria-hidden={!open} inert={!open}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={cn(
          "absolute inset-0 bg-[rgba(15,31,51,0.38)] transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col rounded-t-[18px] bg-card shadow-board",
          "sm:inset-y-0 sm:right-auto sm:left-0 sm:max-h-none sm:w-[440px] sm:rounded-none",
          "will-change-transform transition-transform duration-[380ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
          open ? "translate-y-0 sm:translate-x-0" : "translate-y-[106%] sm:translate-y-0 sm:-translate-x-[104%]",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-base font-bold">Your reservation</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {s === null ? null : held ? (
          <>
            <div className="flex flex-1 flex-col gap-[22px] overflow-auto px-4 py-7">
              <div className="flex flex-col items-start gap-2">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                </span>
                <span className="text-[22px] font-extrabold tracking-[-0.02em]">
                  {held.held > 0 ? "Space held" : "Added to the waitlist"}
                </span>
                {held.held > 0 ? (
                  <span className="text-sm text-secondary-foreground">
                    <b className="font-mono font-semibold">{held.held.toFixed(1)} cbm</b> on{" "}
                    <b className="font-mono font-semibold">{s.shipment_no}</b>
                    {held.ref ? <> · <span className="font-mono">{held.ref}</span></> : null}
                    {held.waitlisted > 0 ? (
                      <>
                        {" "}· <span className="font-mono">{held.waitlisted.toFixed(1)} cbm</span> waitlisted for the next
                        sailing
                      </>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-sm text-secondary-foreground">
                    <b className="font-mono font-semibold">{held.waitlisted.toFixed(1)} cbm</b> waitlisted for the next
                    sailing on this lane.
                  </span>
                )}
              </div>

              {held.held > 0 ? (
                <div className="flex flex-col gap-2.5 border-t border-border pt-[18px] text-sm text-secondary-foreground">
                  <Step n={1}>Add shipment details</Step>
                  <Step n={2}>Pay to confirm</Step>
                  <Step n={3}>
                    Goods in {originCity(s.origin)} by
                    <b className="ml-1 font-mono font-semibold">{weekdayDate(s.cargo_cutoff_at)}</b>
                  </Step>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 border-t border-border px-4 pt-3 pb-5">
              <Button
                className="h-[52px] rounded-[10px] text-[15px] font-bold"
                onClick={() => {
                  if (held.ref) navigate({ to: "/app/bookings/$ref", params: { ref: held.ref } });
                  else navigate({ to: "/app/bookings" });
                }}
              >
                Add shipment details
              </Button>
              <Button variant="outline" className="h-11 rounded-[10px] text-[13px]" onClick={onClose}>
                Later
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-4 py-[18px]">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[15px] font-semibold tabular-nums">{s.shipment_no}</span>
                  <span className="text-xs text-muted-foreground">{portLabel(s.origin)}</span>
                </div>
                <div className="flex">
                  <DeadlineChip cutoff={s.cargo_cutoff_at} />
                </div>
              </div>

              <JourneyLine sailing={s} size="sm" />

              <div className="flex flex-col gap-2.5">
                <ContainerBar sailing={s} yours={cbm} />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold">Your space</span>
                  <CbmStepper value={cbm} max={Math.max(0.5, free)} onChange={onCbm} size="md" />
                </div>
              </div>

              {user ? (
                companyName ? (
                  <span className="text-xs text-muted-foreground">
                    For <b className="font-semibold text-foreground">{companyName}</b>
                  </span>
                ) : null
              ) : (
                <div className="rounded-[10px] border border-border bg-surface p-3">
                  <p className="text-[13px] font-semibold">Log in to hold this space</p>
                  <div className="mt-2.5 flex gap-2">
                    <Button asChild size="sm" className="rounded-lg">
                      <Link to="/login" search={{ next: undefined, cbm, kg: undefined, reserve: s.id }}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link to="/signup" search={{ next: undefined, cbm, kg: undefined, reserve: s.id }}>
                        Create account
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border px-4 pt-3 pb-5">
              <Button
                className="h-[52px] rounded-[10px] text-[15px] font-bold"
                disabled={!user || busy}
                onClick={hold}
              >
                {busy ? "Holding…" : `Hold ${cbm.toFixed(1)} cbm`}
              </Button>
              <span className="text-center text-[11px] text-muted-foreground">No payment now · held 48 hours</span>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
        {n}
      </span>
      {children}
    </div>
  );
}
