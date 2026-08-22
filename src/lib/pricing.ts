/**
 * The one pure pricing function. Used by the public quote, the customer
 * booking page and the admin pricing preview. Mirrored in SQL (calc_quote)
 * so seeded and stored prices come from the same rules.
 */

export type Fare = "saver" | "flex";
export type OriginOption = "cfs" | "pickup_gz" | "pickup_yiwu";
export type DeliveryOption = "collect" | "deliver";

export interface PriceRules {
  version: string;
  effective_from: string;
  early_days: number;
  std_days: number;
  std_mult: number;
  late_mult: number;
  demand70_mult: number;
  demand85_mult: number;
  flex_mult: number;
  standing_discount: number;
  cfs_fee_per_cbm: number;
  terminal_fee_per_cbm: number;
  doc_fee: number;
  insurance_rate: number;
  insurance_min: number;
  photo_check_fee: number;
  pickup_fee_gz: number;
  pickup_fee_yiwu: number;
  delivery_fee_base: number;
  delivery_fee_per_cbm: number;
}

export interface QuoteInput {
  cbm: number;
  grossKg?: number;
  fare?: Fare;
  standing?: boolean;
  origin?: OriginOption;
  delivery?: DeliveryOption;
  insuranceValue?: number;
  photoCheck?: boolean;
  floorRateUsd: number;
  originPortName: string;
  daysToCutoff: number;
  committedCbm: number;
  capacityCbm: number;
  rules: PriceRules;
}

export interface QuoteLine {
  key: string;
  label: string;
  qty: number;
  unit: number;
  amount: number;
}

export interface Quote {
  chargeableCbm: number;
  ratePerCbm: number;
  lines: QuoteLine[];
  total: number;
  allInPerCbm: number;
  fill: number;
  tariffVersion: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
export const ceilHalf = (n: number) => Math.ceil(n * 2) / 2;

export function calcQuote(input: QuoteInput): Quote {
  const {
    cbm,
    grossKg = 0,
    fare = "saver",
    standing = false,
    origin = "cfs",
    delivery = "collect",
    insuranceValue = 0,
    photoCheck = false,
    floorRateUsd,
    originPortName,
    daysToCutoff,
    committedCbm,
    capacityCbm,
    rules: r,
  } = input;

  const chargeableCbm = ceilHalf(Math.max(cbm, grossKg / 1000));

  const leadMult =
    daysToCutoff >= r.early_days
      ? 1
      : daysToCutoff >= r.std_days
        ? r.std_mult
        : standing
          ? r.std_mult // standing bookings never pay the late step
          : r.late_mult;

  const fill = capacityCbm > 0 ? committedCbm / capacityCbm : 0;
  const demandMult = fill >= 0.85 ? r.demand85_mult : fill >= 0.7 ? r.demand70_mult : 1;

  let ratePerCbm = floorRateUsd * leadMult * demandMult * (fare === "flex" ? r.flex_mult : 1);
  if (standing) ratePerCbm = ratePerCbm * (1 - r.standing_discount);
  ratePerCbm = round2(ratePerCbm);

  const lines: QuoteLine[] = [];
  const push = (key: string, label: string, qty: number, unit: number) =>
    lines.push({ key, label, qty, unit, amount: round2(qty * unit) });

  push("freight", "Ocean freight", chargeableCbm, ratePerCbm);
  push("cfs", `${originPortName} CFS`, chargeableCbm, r.cfs_fee_per_cbm);
  push("terminal", "Bridgetown terminal", chargeableCbm, r.terminal_fee_per_cbm);
  push("docs", "Documentation", 1, r.doc_fee);

  if (origin === "pickup_gz") push("pickup", "Supplier pickup · Guangzhou", 1, r.pickup_fee_gz);
  if (origin === "pickup_yiwu") push("pickup", "Supplier pickup · Yiwu", 1, r.pickup_fee_yiwu);
  if (delivery === "deliver")
    push("delivery", "Delivery in Barbados", 1, round2(r.delivery_fee_base + r.delivery_fee_per_cbm * chargeableCbm));
  if (insuranceValue > 0)
    push("insurance", "Cargo insurance", 1, round2(Math.max(r.insurance_min, r.insurance_rate * insuranceValue)));
  if (photoCheck) push("photo", "Photo check at origin warehouse", 1, r.photo_check_fee);

  const total = round2(lines.reduce((s, l) => s + l.amount, 0));

  return {
    chargeableCbm,
    ratePerCbm,
    lines,
    total,
    allInPerCbm: round2(total / Math.max(chargeableCbm, 0.5)),
    fill,
    tariffVersion: r.version,
  };
}

/** Indicative cost of the same shipment through a Panama / Miami consolidator. */
export function legacyLclEstimate(chargeableCbm: number) {
  const perCbm = 395;
  const firstCbm = 700;
  return round2(firstCbm + perCbm * Math.max(chargeableCbm - 1, 0));
}
