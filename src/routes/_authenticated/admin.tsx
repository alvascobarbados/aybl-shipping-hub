import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PortalShell, adminNav } from "@/components/portal-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <PortalShell kind="admin" nav={adminNav}>
      <Outlet />
    </PortalShell>
  ),
});
