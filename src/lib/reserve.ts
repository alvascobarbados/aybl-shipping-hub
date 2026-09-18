/** Helpers that keep a visitor's sailing + volume choice alive through sign-up. */

export interface ReserveChoice {
  sailingId: string;
  cbm: number;
  kg?: number | undefined;
}

export const bookPath = (sailingId: string) => `/app/book/${sailingId}`;

/** Pull the sailing id out of a `next=/app/book/<uuid>` value. */
export function parseBookNext(next: string | undefined): string | null {
  if (!next) return null;
  const m = /^\/app\/book\/([0-9a-fA-F-]{36})$/.exec(next);
  return m?.[1] ?? null;
}

export const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
