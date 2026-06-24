import './PriceBlock.css';
import { cx } from '../../lib/cx';
import type { HTMLAttributes } from 'react';

export type PriceBlockSize = 'default' | 'compact';

export interface PriceBlockProps extends HTMLAttributes<HTMLDivElement> {
  /** The deposit charged now — the actionable, prominent figure. */
  deposit: number;
  /** Estimated balance due on dispatch (variable-weight, so an estimate). */
  balance: number;
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
  currency = '$',
  depositLabel = 'Deposit today',
  balanceLabel = 'Est. balance on dispatch',
  caveat = 'Final price billed by the actual weight of your box at dispatch.',
  size = 'default',
  className,
  ...rest
}: PriceBlockProps) {
  return (
    <div
      className={cx(
        'bc-priceblock',
        size === 'compact' && 'bc-priceblock--compact',
        className,
      )}
      {...rest}
    >
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

      {caveat && (
        <p className="bc-priceblock__caveat bc-caption">
          {/* NOTE: brass marker is decorative; aria-hidden so SR reads clean prose. */}
          <span className="bc-priceblock__marker" aria-hidden="true">
            *
          </span>
          {caveat}
        </p>
      )}
    </div>
  );
}
