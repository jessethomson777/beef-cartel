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
