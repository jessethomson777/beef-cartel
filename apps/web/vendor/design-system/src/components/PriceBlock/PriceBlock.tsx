import './PriceBlock.css';
import { cx } from '../../lib/cx';
import type { HTMLAttributes } from 'react';

export type PriceBlockSize = 'default' | 'compact';

export interface PriceBlockProps extends HTMLAttributes<HTMLDivElement> {
  /** The deposit charged now — the actionable figure. */
  deposit: number;
  /** Estimated balance due on dispatch (variable-weight, so an estimate). */
  balance: number;
  /**
   * Price per kg. When provided, the block leads with the $/kg rate (the new
   * pricing model) and shows the est. box price + deposit beneath it. Omit for
   * the legacy deposit-led layout.
   */
  pricePerKg?: number;
  /** Estimated box price (shown in the $/kg layout). */
  estTotal?: number;
  /** Currency symbol prefix. Defaults to '$'. */
  currency?: string;
  /** Eyebrow above the deposit amount. */
  depositLabel?: string;
  /** Label preceding the estimated balance figure. */
  balanceLabel?: string;
  /** Fine-print caveat explaining variable-weight billing. */
  caveat?: string;
  /** `compact` tightens the type + spacing for dense lists. */
  size?: PriceBlockSize;
}

/**
 * Format money cleanly: thousands separators, and drop a trailing `.00` when
 * the amount is whole. Keeps two decimals only when there's a real fraction.
 * NOTE: deliberately tiny + dependency-free — Intl handles grouping, then we
 * strip the redundant decimals for whole numbers (premium, uncluttered look).
 */
function formatMoney(value: number, currency: string): string {
  const isWhole = Number.isInteger(value);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${currency}${formatted}`;
}

export function PriceBlock({
  deposit,
  balance,
  pricePerKg,
  estTotal,
  currency = '$',
  depositLabel = 'Deposit today',
  balanceLabel = 'Est. balance on dispatch',
  caveat,
  size = 'default',
  className,
  ...rest
}: PriceBlockProps) {
  const classes = cx('bc-priceblock', size === 'compact' && 'bc-priceblock--compact', className);

  // $/kg layout — leads with the rate, then est. box price + deposit.
  if (pricePerKg != null) {
    const perKgCaveat =
      caveat ??
      `Final price = your box's actual weight × ${formatMoney(pricePerKg, currency)}/kg. Pay the deposit now, balance on pickup.`;
    return (
      <div className={classes} {...rest}>
        <span className="bc-priceblock__eyebrow bc-label">Price</span>

        <span className="bc-priceblock__deposit bc-tnum">
          {formatMoney(pricePerKg, currency)}
          <span className="bc-priceblock__perkg">/kg</span>
        </span>

        {estTotal != null && (
          <p className="bc-priceblock__balance">
            <span className="bc-priceblock__balance-label">Est. per box</span>{' '}
            <span className="bc-priceblock__balance-amount bc-tnum">{formatMoney(estTotal, currency)}</span>
          </p>
        )}

        <p className="bc-priceblock__balance">
          <span className="bc-priceblock__balance-label">{depositLabel}</span>{' '}
          <span className="bc-priceblock__balance-amount bc-priceblock__deposit-now bc-tnum">
            {formatMoney(deposit, currency)}
          </span>
        </p>

        <p className="bc-priceblock__caveat bc-caption">
          <span className="bc-priceblock__marker" aria-hidden="true">
            *
          </span>
          {perKgCaveat}
        </p>
      </div>
    );
  }

  // Legacy deposit-led layout.
  return (
    <div className={classes} {...rest}>
      <span className="bc-priceblock__eyebrow bc-label">{depositLabel}</span>

      <span className="bc-priceblock__deposit bc-tnum">
        {formatMoney(deposit, currency)}
      </span>

      <p className="bc-priceblock__balance">
        <span className="bc-priceblock__balance-label">{balanceLabel}</span>{' '}
        <span className="bc-priceblock__balance-amount bc-tnum">
          {formatMoney(balance, currency)}
        </span>
      </p>

      {(caveat ?? 'Final price billed by the actual weight of your box at dispatch.') && (
        <p className="bc-priceblock__caveat bc-caption">
          {/* NOTE: brass marker is decorative; aria-hidden so SR reads clean prose. */}
          <span className="bc-priceblock__marker" aria-hidden="true">
            *
          </span>
          {caveat ?? 'Final price billed by the actual weight of your box at dispatch.'}
        </p>
      )}
    </div>
  );
}
