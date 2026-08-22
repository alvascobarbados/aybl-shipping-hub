export const TZ = "America/Barbados";

export const usd = (n: number, opts: { cents?: boolean } = {}) =>
  "$" +
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });

export const shortDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ });

export const longDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

export const weekdayDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });

export const astTime = (d: string | Date = new Date(), withSeconds = false) =>
  new Date(d).toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" as const } : {}),
  });

export const daysUntil = (d: string | Date) => (new Date(d).getTime() - Date.now()) / 86_400_000;

export function countdown(to: string | Date) {
  const ms = new Date(to).getTime() - Date.now();
  if (ms <= 0) return "closed";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}
