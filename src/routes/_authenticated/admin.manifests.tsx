import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/page";

export const Route = createFileRoute("/_authenticated/admin/manifests")({
  component: AdminManifests,
});

function AdminManifests() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Back office" title="Manifests" lead="Per-sailing manifests and loading lists." />
      <EmptyState title="Nothing here yet" hint="This section is part of the AYBL shell and will fill up as sailings and bookings move through the service." />
    </div>
  );
}
