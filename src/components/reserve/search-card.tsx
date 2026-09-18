import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useOriginPorts } from "@/lib/queries";
import { portLabel, type SearchCriteria } from "@/lib/sailing-search";

interface Props {
  value: SearchCriteria;
  onSearch: (c: SearchCriteria) => void;
}

/** From · To · Goods ready by. The one control on the landing page. */
export function SearchCard({ value, onSearch }: Props) {
  const { data: ports = [] } = useOriginPorts();
  const [draft, setDraft] = useState<SearchCriteria>(value);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(draft);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[14px] border border-border bg-card p-4 shadow-card sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Field label="From" htmlFor="from">
          <select
            id="from"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-primary"
          >
            <option value="all">China (All)</option>
            {ports.map((p) => (
              <option key={p.code} value={p.code}>
                {portLabel(p)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="To" htmlFor="to">
          <select
            id="to"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-primary"
          >
            <option value="BBBGI">Bridgetown, Barbados</option>
          </select>
        </Field>

        <Field label="Goods ready by" htmlFor="ready">
          <input
            id="ready"
            type="date"
            value={draft.readyBy}
            onChange={(e) => setDraft({ ...draft, readyBy: e.target.value })}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3 font-mono text-sm outline-none focus:border-primary"
          />
        </Field>

        <Button type="submit" className="h-11 rounded-[10px] px-6 text-sm font-bold">
          <span className="sm:hidden">Search sailings</span>
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-[11px] font-semibold text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
