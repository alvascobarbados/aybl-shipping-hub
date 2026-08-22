import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/page";

export const Route = createFileRoute("/_authenticated/app/documents")({
  component: CustomerDocuments,
});

function CustomerDocuments() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Customer portal" title="Documents" lead="Every confirmation, label, house B/L and invoice for your shipments." />
      <EmptyState title="Nothing here yet" hint="This section is part of the AYBL shell and will fill up as sailings and bookings move through the service." />
    </div>
  );
}
