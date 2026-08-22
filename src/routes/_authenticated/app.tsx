import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PortalShell, customerNav } from "@/components/portal-shell";

export const Route = createFileRoute("/_authenticated/app")({
  component: () => (
    <PortalShell kind="customer" nav={customerNav}>
      <Outlet />
    </PortalShell>
  ),
});
