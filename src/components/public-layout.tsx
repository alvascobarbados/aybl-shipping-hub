import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LiveBar, PublicNav } from "@/components/public-nav";
import { Wordmark } from "@/components/brand";

export function PublicLayout({ children, liveBar = true }: { children: ReactNode; liveBar?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      {liveBar ? <LiveBar /> : null}
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface py-12">
      <div className="wrap flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-xs">
          <Wordmark className="text-xl" />
          <p className="mt-3 text-sm text-muted-foreground">
            Direct LCL ocean freight, Yantian and Shanghai to Bridgetown. Book cubic metres, not containers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <FooterCol
            title="Service"
            items={[
              { to: "/sailings", label: "Sailings" },
              { to: "/rates", label: "Rates" },
              { to: "/how-it-works", label: "How it works" },
            ]}
          />
          <FooterCol
            title="Book"
            items={[
              { to: "/quote", label: "Get a quote" },
              { to: "/signup", label: "Create account" },
              { to: "/login", label: "Log in" },
            ]}
          />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: Array<{ to: string; label: string }> }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="text-secondary-foreground hover:text-foreground">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
