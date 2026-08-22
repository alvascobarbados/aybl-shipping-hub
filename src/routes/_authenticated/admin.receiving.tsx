import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/page";

export const Route = createFileRoute("/_authenticated/admin/receiving")({
  component: AdminOriginwarehousereceiving,
});

function AdminOriginwarehousereceiving() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Back office" title="Origin warehouse receiving" lead="Check cartons in at the origin CFS and photograph them." />
      <EmptyState title="Nothing here yet" hint="This section is part of the AYBL shell and will fill up as sailings and bookings move through the service." />
    </div>
  );
}
