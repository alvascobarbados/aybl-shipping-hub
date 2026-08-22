import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { astTime } from "@/lib/format";

interface LiveValueProps {
  /** The rendered value. Always comes from data — never typed into copy. */
  value: string | number;
  /** Small muted suffix, e.g. "cbm", "/ cbm", "days". */
  unit?: string;
  /** Optional "updated hh:mm AST" stamp. */
  stamp?: string | Date | null;
  className?: string;
  tone?: "default" | "primary" | "board" | "amber" | "green" | "muted";
}

const toneClass = {
  default: "text-foreground",
  primary: "text-primary",
  board: "text-board-foreground",
  amber: "text-board-amber",
  green: "text-board-green",
  muted: "text-muted-foreground",
} as const;

/**
 * Every price, date, space figure or rate in the product renders through this.
 * Mono font, tabular numerals, muted unit suffix, and a brief flash whenever
 * the underlying value changes.
 */
export function LiveValue({ value, unit, stamp, className, tone = "default" }: LiveValueProps) {
  const [flash, setFlash] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current !== value) {
      previous.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [value]);

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-sm font-mono font-semibold whitespace-nowrap tabular-nums",
        toneClass[tone],
        flash && "lv-flash",
        className,
      )}
    >
      {value}
      {unit ? <small className="font-sans text-[0.72em] font-medium text-muted-foreground">{unit}</small> : null}
      {stamp ? (
        <small className="font-sans text-[0.68em] font-medium text-muted-foreground">
          updated {astTime(stamp)} AST
        </small>
      ) : null}
    </span>
  );
}

export function LiveStamp({ at, label = "last change" }: { at?: string | Date | null; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide text-muted-foreground">
      <i className="size-[7px] rounded-full bg-success" aria-hidden />
      {label} {at ? `${astTime(at)} AST` : "—"}
    </span>
  );
}
