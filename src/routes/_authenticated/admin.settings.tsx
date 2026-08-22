import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/page";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Back office" title="Settings" lead="Service configuration and back-office preferences." />
      <EmptyState title="Nothing here yet" hint="This section is part of the AYBL shell and will fill up as sailings and bookings move through the service." />
    </div>
  );
}
