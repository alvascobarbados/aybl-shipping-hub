import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "@/components/public-layout";
import { ReservePanel } from "@/components/reserve-panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ABL Shipping - Direct LCL ocean freight, China to Bridgetown" },
      {
        name: "description",
        content:
          "Book cubic metres of space on scheduled Yantian → Bridgetown and Shanghai → Bridgetown sailings. All-in pricing, fixed cut-offs, no transhipment through Panama.",
      },
      { property: "og:title", content: "ABL Shipping - Direct LCL ocean freight, China to Bridgetown" },
      {
        property: "og:description",
        content: "Reserve space by the cubic metre on scheduled direct sailings to Bridgetown. One all-in price.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <PublicLayout>
      <section className="wrap max-w-3xl py-12 sm:py-16">
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-5xl">
          Reserve space on the next sailing to Bridgetown.
        </h1>
        <p className="mt-4 text-lg text-secondary-foreground">
          Direct from Yantian or Shanghai. Book by the cubic metre. One all-in price.
        </p>

        <div className="mt-10">
          <ReservePanel />
          <p className="mt-3 text-right text-sm">
            <Link to="/sailings" className="font-semibold text-primary">
              All sailings →
            </Link>
          </p>
        </div>
      </section>

      <section className="wrap max-w-3xl pb-16 text-secondary-foreground">
        <ul className="space-y-2">
          <li>Direct sailing, no transhipment.</li>
          <li>Price locked when you book.</li>
          <li>Cut-off dates published in advance.</li>
        </ul>
        <p className="mt-6 text-sm">
          Your supplier in China can deliver to our warehouse or reserve on your behalf —{" "}
          <Link to="/contact" className="font-semibold text-primary">
            see Contact
          </Link>
          . New to this?{" "}
          <Link to="/how-it-works" className="font-semibold text-primary">
            See how it works
          </Link>
          .
        </p>
      </section>
      <div className="h-16 sm:hidden" />
    </PublicLayout>
  );
}
