import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/public-layout";
import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveValue } from "@/components/live-value";
import { supabase } from "@/integrations/supabase/client";
import { contactBySide, useSiteContacts, type SiteContact } from "@/lib/site";
import { boardStatus, laneLabel, useSailings } from "@/lib/queries";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ABL Shipping — Barbados and China desks" },
      {
        name: "description",
        content:
          "Reach the Barbados desk for quotes, bookings and collection, or the China desk for delivering cargo to our origin warehouse and reserving space for a customer.",
      },
      { property: "og:title", content: "Contact ABL Shipping" },
      { property: "og:description", content: "Barbados desk for customers, China desk for suppliers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const roles = [
  { value: "customer", label: "A customer in the Caribbean" },
  { value: "supplier_delivering", label: "A supplier delivering cargo" },
  { value: "supplier_reserving", label: "A supplier reserving space for a customer" },
  { value: "other", label: "Something else" },
] as const;

function ContactPage() {
  const { data: contacts } = useSiteContacts();
  const { data: sailings = [] } = useSailings();
  const open = sailings.filter((s) => boardStatus(s) !== "closed");
  const bb = contactBySide(contacts, "barbados");
  const cn = contactBySide(contacts, "china");

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    role: "customer",
    message: "",
    customer_name: "",
    customer_email: "",
    cbm: "",
    sailing_id: "",
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const onBehalf = form.role === "supplier_reserving";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_requests").insert({
      name: form.name,
      company: form.company || null,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      message: form.message || null,
      side: form.role === "customer" ? "barbados" : "china",
      ...(onBehalf
        ? {
            customer_name: form.customer_name || null,
            customer_email: form.customer_email || null,
            cbm: form.cbm ? Number(form.cbm) : null,
            sailing_id: form.sailing_id || null,
          }
        : {}),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Thanks — we'll come back to you.");
  }

  return (
    <PublicLayout>
      <div className="wrap max-w-4xl space-y-10 py-12">
        <PageHeader eyebrow="Contact" title="Talk to the right desk" lead="Barbados handles customers. China handles suppliers and cargo arriving at our origin warehouse." />

        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <p className="eyebrow">{bb?.label ?? "Barbados"}</p>
            <p className="mt-2 font-bold">{bb?.audience_note ?? "For customers: quotes, bookings, collection."}</p>
            <Details c={bb} />
          </Panel>
          <Panel>
            <p className="eyebrow">{cn?.label ?? "China"} · 中国</p>
            <p className="mt-2 font-bold">
              {cn?.audience_note ?? "For suppliers and factories."}
            </p>
            <p className="mt-1 text-sm text-secondary-foreground">
              供应商与工厂：送货至我司仓库，或代客户预订舱位。
            </p>
            <Details c={cn} />
            <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              <p className="eyebrow">Origin warehouse · 起运地仓库</p>
              {Array.from(new Map(sailings.map((s) => [s.origin.code, s.origin])).values()).map((p) => (
                <div key={p.code}>
                  <p className="font-semibold">
                    {p.name} <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                  </p>
                  <p className="text-secondary-foreground">{p.cfs_address ?? "—"}</p>
                  <p className="text-secondary-foreground">{p.cfs_address_zh ?? "—"}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel>
          <h2 className="text-xl font-extrabold">Send us a message</h2>
          {sent ? (
            <p className="mt-3 text-sm text-secondary-foreground">
              Message received. The right desk will reply to {form.email}.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Your name">
                <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Company">
                <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Phone / WhatsApp / WeChat">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="I am…">
                <Select value={form.role} onValueChange={(v) => set("role", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {onBehalf ? (
                <>
                  <Field label="Customer's name">
                    <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
                  </Field>
                  <Field label="Customer's email">
                    <Input type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} />
                  </Field>
                  <Field label="Volume (cbm)">
                    <Input inputMode="decimal" className="font-mono" value={form.cbm} onChange={(e) => set("cbm", e.target.value)} />
                  </Field>
                  <Field label="Preferred sailing">
                    <Select value={form.sailing_id} onValueChange={(v) => set("sailing_id", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a sailing" />
                      </SelectTrigger>
                      <SelectContent>
                        {open.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.voyage_no} · {laneLabel(s)} · {shortDate(s.etd)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              ) : null}

              <div className="sm:col-span-2">
                <Label className="text-sm font-semibold">Message</Label>
                <Textarea className="mt-2" rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" disabled={busy}>
                  {busy ? "Sending…" : "Send message"}
                </Button>
              </div>
            </form>
          )}
        </Panel>
      </div>
    </PublicLayout>
  );
}

function Details({ c }: { c: SiteContact | undefined }) {
  if (!c) return <p className="mt-4 text-sm text-muted-foreground">—</p>;
  return (
    <dl className="mt-4 space-y-1.5 text-sm text-secondary-foreground">
      {c.company_name ? <p className="font-semibold text-foreground">{c.company_name}</p> : null}
      {c.contact_name ? <p>{c.contact_name}</p> : null}
      {c.address ? <p>{c.address}</p> : null}
      {c.address_zh ? <p>{c.address_zh}</p> : null}
      {c.phone ? <p>Phone {c.phone}</p> : null}
      {c.whatsapp ? <p>WhatsApp {c.whatsapp}</p> : null}
      {c.wechat ? <p>WeChat {c.wechat}</p> : null}
      {c.email ? <p>{c.email}</p> : null}
      {c.hours ? (
        <p>
          {c.hours} <LiveValue value={c.timezone ?? "—"} className="text-xs" />
        </p>
      ) : null}
      {c.hours_zh ? <p>{c.hours_zh}</p> : null}
    </dl>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
