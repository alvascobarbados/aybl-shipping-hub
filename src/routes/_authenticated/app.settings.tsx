import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader } from "@/components/page";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: CustomerSettings,
});

function CustomerSettings() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Customer portal" title="Settings" lead="Notification and account preferences." />
      <EmptyState title="Nothing here yet" hint="This section is part of the AYBL shell and will fill up as sailings and bookings move through the service." />
    </div>
  );
}
