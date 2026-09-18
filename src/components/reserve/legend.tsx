/** Reads the container bar: taken · pending · yours · free. */
export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
      <Key className="bg-foreground" label="Taken" />
      <Key className="bar-pending" label="Pending" />
      <Key className="bg-primary" label="Yours" />
      <Key className="border border-border-strong bg-surface" label="Free" />
      <span>Dates estimated</span>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={`block h-[10px] w-[14px] rounded-[3px] ${className}`} aria-hidden />
      {label}
    </span>
  );
}
