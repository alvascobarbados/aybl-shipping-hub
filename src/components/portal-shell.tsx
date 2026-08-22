import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, LogOut } from "lucide-react";

import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
}

export const customerNav: NavItem[] = [
  { to: "/app/sailings", label: "Sailings" },
  { to: "/app/bookings", label: "My bookings" },
  { to: "/app/documents", label: "Documents" },
  { to: "/app/company", label: "Company" },
  { to: "/app/team", label: "Team" },
  { to: "/app/billing", label: "Billing" },
  { to: "/app/settings", label: "Settings" },
];

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/sailings", label: "Sailings" },
  { to: "/admin/capacity", label: "Capacity console" },
  { to: "/admin/pricing", label: "Pricing rules" },
  { to: "/admin/bookings", label: "Bookings & holds" },
  { to: "/admin/receiving", label: "Origin receiving" },
  { to: "/admin/manifests", label: "Manifests" },
  { to: "/admin/destination", label: "Destination ops" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/users", label: "Users & roles" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/settings", label: "Settings" },
];

export function PortalShell({
  nav,
  children,
  kind,
}: {
  nav: NavItem[];
  children: ReactNode;
  kind: "customer" | "admin";
}) {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const items = (
    <>
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap",
            kind === "admin"
              ? "text-board-muted hover:bg-board-2 hover:text-board-foreground"
              : "text-board-muted hover:bg-board-2 hover:text-board-foreground",
          )}
          activeProps={{ className: "bg-board-2 text-board-foreground" }}
          activeOptions={{ exact: n.to === "/admin" }}
        >
          {n.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 bg-board text-board-foreground">
        <div className="wrap flex h-14 items-center gap-6">
          <Link to={kind === "admin" ? "/admin" : "/app/sailings"} className="shrink-0">
            <Wordmark mono className="text-xl" />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">{items}</nav>
          <div className="ml-auto flex items-center gap-3">
            {kind === "customer" && isStaff ? (
              <Link to="/admin" className="hidden text-xs font-medium text-board-muted hover:text-board-foreground sm:block">
                Admin
              </Link>
            ) : null}
            {kind === "admin" ? (
              <Link to="/app/sailings" className="hidden text-xs font-medium text-board-muted hover:text-board-foreground sm:block">
                Customer view
              </Link>
            ) : null}
            <span className="hidden max-w-40 truncate text-xs text-board-muted md:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="text-board-muted hover:bg-board-2 hover:text-board-foreground">
              <LogOut />
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu" className="text-board-foreground hover:bg-board-2 lg:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 border-board-2 bg-board text-board-foreground">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav className="mt-10 flex flex-col gap-1 px-3">{items}</nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="wrap py-8 pb-20">{children}</main>
    </div>
  );
}
