import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { PublicNav } from "@/components/public-nav";
import { Wordmark } from "@/components/brand";
import { contactBySide, useSiteContacts } from "@/lib/site";

export function PublicLayout({ children }: { children: ReactNode; liveBar?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  const { data: contacts } = useSiteContacts();
  const bb = contactBySide(contacts, "barbados");
  const cn = contactBySide(contacts, "china");

  return (
    <footer className="mt-20 border-t border-border bg-surface py-12">
      <div className="wrap grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark className="text-xl" />
          <p className="mt-3 text-sm text-muted-foreground">Yantian → Bridgetown</p>
          <p className="text-sm text-muted-foreground">Shanghai → Bridgetown</p>
        </div>
        <FooterCol
          title="Site"
          items={[
            { to: "/sailings", label: "Sailings" },
            { to: "/rates", label: "Rates" },
            { to: "/how-it-works", label: "How it works" },
          ]}
        />
        <FooterCol
          title="More"
          items={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
            { to: "/login", label: "Log in" },
          ]}
        />
        <div className="text-sm">
          <p className="eyebrow">Contact</p>
          <p className="mt-3 text-secondary-foreground">
            {bb ? `${bb.label} · ${bb.phone ?? ""} · ${bb.email ?? ""}` : "—"}
          </p>
          <p className="mt-1 text-secondary-foreground">
            {cn ? `${cn.label} · ${cn.phone ?? ""} · ${cn.email ?? ""}` : "—"}
          </p>
        </div>
      </div>
      <div className="wrap mt-10 text-sm text-muted-foreground">© ABL Shipping</div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: Array<{ to: string; label: string }> }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
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
