import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired — the booking panel on the landing page is the quote. */
export const Route = createFileRoute("/quote")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "search", search: { reserve: undefined, cbm: undefined } });
  },
});
