/**
 * Money helpers. App stores AUD dollars; Stripe wants integer cents.
 * Keep the cents conversion at the Stripe boundary only.
 */

/** Dollars → integer cents for Stripe (AUD has 2 decimal places). */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Integer cents → dollars. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Format AUD for display/email: thousands separators, drop a trailing `.00`
 * on whole amounts. Mirrors the design system's PriceBlock formatter so the
 * web app and emails read identically.
 */
export function formatAUD(dollars: number): string {
  const isWhole = Number.isInteger(dollars);
  const formatted = new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
  return `$${formatted}`;
}

/** Estimated balance for a product (what's billed later, on real weight). */
export function estBalance(p: { depositAmount: number; estTotalAmount: number }): number {
  return Math.max(0, p.estTotalAmount - p.depositAmount);
}

/** Midpoint estimated weight for a box (used for the supplier PO total). */
export function estWeightKg(p: { weightMinKg: number; weightMaxKg: number }): number {
  return (p.weightMinKg + p.weightMaxKg) / 2;
}

/** Human weight range, e.g. "1.2–1.5 kg". */
export function weightRange(p: { weightMinKg: number; weightMaxKg: number }): string {
  return `${p.weightMinKg}–${p.weightMaxKg} kg`;
}

/* ---- $/kg pricing model -------------------------------------------------- */
/**
 * Pricing is driven by PRICE PER KG. `pricePerKg` is the single editable lever
 * (per cut, per grade); the estimated box price and the deposit are DERIVED from
 * it × the box's weight range. The final charge at dispatch is the box's ACTUAL
 * weight × pricePerKg, minus the deposit already paid.
 */

/** Deposit fraction of the estimated box price (rest billed on actual weight). */
export const DEPOSIT_PCT = 0.3;

/** Round to the nearest $5 — keeps deposits tidy. */
export const round5 = (n: number) => Math.round(n / 5) * 5;

/** Estimated box price (AUD) = $/kg × midpoint weight, to whole dollars. */
export function estTotalFromPerKg(pricePerKg: number, weightMinKg: number, weightMaxKg: number): number {
  return Math.round(pricePerKg * ((weightMinKg + weightMaxKg) / 2));
}

/** Deposit (AUD) = DEPOSIT_PCT of the estimated box price, to the nearest $5. */
export function depositFromEstTotal(estTotal: number): number {
  return round5(estTotal * DEPOSIT_PCT);
}

/** Format a $/kg rate, e.g. "$120/kg". */
export function formatPerKg(pricePerKg: number): string {
  return `${formatAUD(pricePerKg)}/kg`;
}

/**
 * Ensure a product carries derived pricing. `pricePerKg` is authoritative;
 * `estTotalAmount` and `depositAmount` are always recomputed from it × weights,
 * so editing $/kg in Firestore is the only lever you need. Back-compat: a doc
 * with no `pricePerKg` (pre-$/kg seed) infers a rate from its old est total so
 * the catalogue still renders until it's re-synced with real rates.
 */
export function withDerivedPricing<
  T extends {
    pricePerKg?: number;
    weightMinKg: number;
    weightMaxKg: number;
    estTotalAmount?: number;
  },
>(raw: T): T & { pricePerKg: number; estTotalAmount: number; depositAmount: number } {
  const mid = (raw.weightMinKg + raw.weightMaxKg) / 2;
  let pricePerKg = raw.pricePerKg ?? 0;
  if (pricePerKg <= 0) {
    pricePerKg = raw.estTotalAmount && mid > 0 ? Math.round(raw.estTotalAmount / mid) : 0;
  }
  const estTotalAmount = Math.round(pricePerKg * mid);
  const depositAmount = round5(estTotalAmount * DEPOSIT_PCT);
  return { ...raw, pricePerKg, estTotalAmount, depositAmount };
}
