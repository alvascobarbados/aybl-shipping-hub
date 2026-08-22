import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/page";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: AdminBookingsholds,
});

function AdminBookingsholds() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Back office" title="Bookings & holds" lead="Every booking and live hold across all sailings." />
      <EmptyState title="Nothing here yet" hint="This section is part of the AYBL shell and will fill up as sailings and bookings move through the service." />
    </div>
  );
}
