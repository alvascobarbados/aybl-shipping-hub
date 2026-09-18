import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContacts, type SiteContact } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

const fields: Array<[keyof SiteContact, string]> = [
  ["company_name", "Company name"],
  ["contact_name", "Contact name"],
  ["address", "Address"],
  ["address_zh", "Address (Chinese)"],
  ["phone", "Phone"],
  ["whatsapp", "WhatsApp"],
  ["wechat", "WeChat"],
  ["email", "Email"],
  ["hours", "Hours"],
  ["hours_zh", "Hours (Chinese)"],
  ["timezone", "Timezone"],
  ["audience_note", "Who this desk is for"],
];

function AdminSettings() {
  const { data: contacts = [] } = useSiteContacts();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Back office"
        title="Settings"
        lead="Contact details shown on the public site. These are data, not copy — the Contact page and the footer render from here."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {contacts.map((c) => (
          <ContactEditor key={c.id} contact={c} />
        ))}
      </div>
    </div>
  );
}

function ContactEditor({ contact }: { contact: SiteContact }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(contact);
  const [busy, setBusy] = useState(false);

  useEffect(() => setDraft(contact), [contact]);

  async function save() {
    setBusy(true);
    const patch = Object.fromEntries(fields.map(([k]) => [k, draft[k] ?? null]));
    const { error } = await supabase.from("site_settings").update(patch).eq("id", contact.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["site_settings"] });
    toast.success(`${contact.label} contact details saved`);
  }

  return (
    <Panel>
      <h2 className="font-bold">{contact.label}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map(([k, label]) => (
          <div key={String(k)}>
            <Label className="text-xs font-semibold">{label}</Label>
            <Input
              className="mt-1.5"
              value={(draft[k] as string | null) ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, [k]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <Button className="mt-5" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </Button>
    </Panel>
  );
}
