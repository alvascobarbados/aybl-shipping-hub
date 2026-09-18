import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, Boxes, PackageCheck, ShieldCheck, Ship, Timer, Warehouse } from "lucide-react";

import { PublicLayout } from "@/components/public-layout";
import { PageHeader } from "@/components/page";
import { LiveValue } from "@/components/live-value";
import { transitDays, useSailings } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ABL Shipping — direct LCL from China to Bridgetown" },
      {
        name: "description",
        content:
          "Why we run a direct LCL service from Yantian and Shanghai to Bridgetown, how it works, who we are and what we promise on every booking.",
      },
      { property: "og:title", content: "About ABL Shipping" },
      { property: "og:description", content: "Why a direct sailing to Bridgetown beats transhipment through Panama or Miami." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: sailings = [] } = useSailings();
  const first = sailings[0];

  return (
    <PublicLayout>
      <div className="wrap max-w-3xl space-y-14 py-12">
        <PageHeader
          eyebrow="About"
          title="Why this exists"
          lead="Most cargo leaving China for Barbados is routed through a consolidation hub in Panama or Miami. It is unpacked, stored, repacked and reloaded, and every handling step adds weeks and risk. We run the leg directly instead."
        />

        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold">How the service works</h2>
          <p className="text-secondary-foreground">
            Your supplier delivers cartons to our origin warehouse in Yantian or Shanghai. We load and seal one
            container, it stays on one vessel, and it is opened in Bridgetown.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Warehouse className="size-5" />, k: "Origin CFS", v: "Yantian or Shanghai" },
              { icon: <Ship className="size-5" />, k: "One vessel", v: "No transhipment" },
              { icon: <Anchor className="size-5" />, k: "Bridgetown", v: "BBBGI" },
              { icon: <PackageCheck className="size-5" />, k: "Collect", v: "Or delivered" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">{s.icon}</div>
                <p className="mt-4 font-bold">{s.k}</p>
                <p className="text-sm text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
          {first ? (
            <p className="text-sm text-muted-foreground">
              Port-to-port transit on the current schedule:{" "}
              <LiveValue value={transitDays(first)} unit="days" className="text-sm" />
            </p>
          ) : null}
          <p className="text-sm">
            <Link to="/how-it-works" className="font-semibold text-primary">
              See how it works step by step →
            </Link>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-extrabold">Who we are</h2>
          <p className="text-secondary-foreground">
            A Barbados-based team with an origin team in China. One side books and releases cargo in Bridgetown, the
            other receives cartons and loads containers at the origin warehouse.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold">Who it's for</h2>
          <div className="space-y-3 text-secondary-foreground">
            <p>
              <b className="text-foreground">Shop owners in Bridgetown</b> — restock from Yiwu and Guangzhou without
              waiting to fill a 20ft.
            </p>
            <p>
              <b className="text-foreground">Contractors and trades</b> — tools, fittings and materials on a date you
              can plan around.
            </p>
            <p>
              <b className="text-foreground">Suppliers in Shenzhen</b> — deliver cartons to a warehouse you already
              know, with a clear label.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold">Our promise</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <Boxes className="size-5" />,
                title: "Buy space by the cubic metre",
                body: "Half a pallet or half the container — you pay for the volume you book.",
              },
              {
                icon: <Timer className="size-5" />,
                title: "Published cut-offs",
                body: "Every sailing has a cargo cut-off and a sail date. If your cartons arrive, they sail.",
              },
              {
                icon: <ShieldCheck className="size-5" />,
                title: "Price locked at booking",
                body: "Your line items are stored with the booking. A later tariff change never touches a confirmed price.",
              },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">{c.icon}</div>
                <h3 className="mt-4 font-bold">{c.title}</h3>
                <p className="mt-2 text-sm text-secondary-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="container">
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <p className="eyebrow">Coming soon</p>
            <p className="mt-2 font-semibold">Interactive container view</p>
            <p className="mt-1 text-sm text-muted-foreground">
              See exactly how much space your cargo takes inside the container.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
