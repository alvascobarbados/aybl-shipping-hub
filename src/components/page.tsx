import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {lead ? <div className="mt-3 max-w-2xl text-secondary-foreground">{lead}</div> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
      {icon ? <div className="mx-auto mb-4 grid size-11 place-items-center rounded-lg bg-accent text-primary">{icon}</div> : null}
      <p className="font-semibold">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card p-6 shadow-card", className)}>{children}</div>;
}
