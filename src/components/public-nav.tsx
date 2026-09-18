import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { LiveValue } from "@/components/live-value";
import { astTime, shortDate } from "@/lib/format";
import { laneLabel, useSailings, type SailingRow } from "@/lib/queries";
import { usd } from "@/lib/format";

const links = [
  { to: "/sailings", label: "Sailings" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicNav() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-30 h-16 border-b border-border bg-background">
      <div className="wrap flex h-full items-center gap-8">
        <Link to="/" search={{ reserve: undefined, cbm: undefined }} className="shrink-0">
          <Wordmark />
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-secondary-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link to="/app/sailings">My account</Link>
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                search={{ next: undefined, cbm: undefined, kg: undefined }}
                className="hidden px-2 text-sm font-medium text-secondary-foreground hover:text-foreground sm:block"
              >
                Log in
              </Link>
              <Button asChild size="sm">
                <Link to="/" hash="search" search={{ reserve: undefined, cbm: undefined }}>
                  Reserve space
                </Link>
              </Button>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-72 flex-col">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-10 flex flex-col gap-1 px-4">
                {links.map((l) => (
                  <Link key={l.to} to={l.to} className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-surface">
                    {l.label}
                  </Link>
                ))}
                <Link
                  to="/login"
                  search={{ next: undefined, cbm: undefined, kg: undefined }}
                  className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-surface"
                >
                  Log in
                </Link>
              </div>
              <div className="mt-auto p-4">
                <Button asChild size="lg" className="w-full">
                  <Link to="/" hash="search" search={{ reserve: undefined, cbm: undefined }}>
                    Reserve space
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

/** Sticky dark bar under the nav that cycles one live sailing at a time. */
export function LiveBar() {
  const { data: sailings } = useSailings();
  const open = (sailings ?? []).filter((s) => s.status === "open");
  const [i, setI] = useState(0);
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    setClock(astTime(new Date(), true));
    const t = setInterval(() => setClock(astTime(new Date(), true)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (open.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % open.length), 3500);
    return () => clearInterval(t);
  }, [open.length]);

  const s: SailingRow | undefined = open[i % Math.max(open.length, 1)];

  return (
    <div className="sticky top-16 z-29 border-b border-board-2 bg-board text-board-foreground">
      <div className="wrap flex h-11 items-center">
        <div className="mr-4 flex h-full shrink-0 items-center gap-2 border-r border-board-2 pr-4 font-mono text-[11px] tracking-[0.12em]">
          <i className="size-[7px] rounded-full bg-board-green" aria-hidden />
          LIVE
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          {s ? (
            <div key={s.id} className="grid animate-in fade-in slide-in-from-bottom-2 grid-cols-2 gap-4 font-mono text-[13px] duration-500 sm:grid-cols-3 lg:grid-cols-6">
              <Cell k="Lane">
                {laneLabel(s)} · {s.voyage_no}
              </Cell>
              <Cell k="Cut-off">
                <LiveValue value={shortDate(s.cargo_cutoff_at)} tone="board" />
              </Cell>
              <Cell k="Sails" className="hidden sm:block">
                <LiveValue value={shortDate(s.etd)} tone="board" />
              </Cell>
              <Cell k="ETA BGI" className="hidden lg:block">
                <LiveValue value={shortDate(s.eta)} tone="board" />
              </Cell>
              <Cell k="Space" className="hidden lg:block">
                <LiveValue value={s.availableCbm} unit="cbm" tone={s.availableCbm <= 10 ? "amber" : "green"} />
              </Cell>
              <Cell k="Rate" className="hidden lg:block">
                <LiveValue value={usd(Number(s.origin.floor_rate_usd))} unit="/cbm" tone="board" />
              </Cell>
            </div>
          ) : null}
        </div>
        <div className="ml-4 hidden h-full shrink-0 items-center gap-2 border-l border-board-2 pl-4 font-mono text-xs text-board-muted sm:flex">
          Bridgetown <b className="font-semibold text-board-foreground">{clock ?? "--:--:--"}</b>
        </div>
      </div>
    </div>
  );
}

function Cell({ k, children, className }: { k: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="block text-[10px] leading-none tracking-[0.1em] text-board-muted uppercase">{k}</span>
      <span className="mt-[3px] block truncate leading-tight font-semibold">{children}</span>
    </div>
  );
}
