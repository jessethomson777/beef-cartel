import './StickyOrderBar.css';
import { cx } from '../../lib/cx';
import { Button } from '../Button';
import type { HTMLAttributes } from 'react';

export interface StickyOrderBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of boxes in the cart. Drives pluralisation + the empty-state gate. */
  itemCount: number;
  /** Amount owed today, in major currency units (e.g. 149 → "$149"). */
  total: number;
  /** Fired when the checkout CTA is pressed. */
  onCheckout: () => void;
  /** Currency symbol prefix. */
  currency?: string;
  /** Eyebrow label above the amount. */
  totalLabel?: string;
  /** Text on the primary CTA. */
  ctaLabel?: string;
  /** When provided, shows a subtle "Clear" button in the summary. */
  onClear?: () => void;
  /** Label for the clear button (the consumer can swap it for a confirm prompt). */
  clearLabel?: string;
  /** When true and the cart is empty, render nothing. */
  hideWhenEmpty?: boolean;
}

// NOTE: Local money helper — matches PriceBlock's formatter so the running
// total reads the same as the cards: thousands separators, and drop a trailing
// `.00` on whole amounts for the uncluttered premium look.
function formatMoney(amount: number, currency: string): string {
  const isWhole = Number.isInteger(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency}${formatted}`;
}

export function StickyOrderBar({
  itemCount,
  total,
  onCheckout,
  currency = '$',
  totalLabel = 'Deposit today',
  ctaLabel = 'Checkout',
  onClear,
  clearLabel = 'Clear',
  hideWhenEmpty = true,
  className,
  ...rest
}: StickyOrderBarProps) {
  if (hideWhenEmpty && itemCount === 0) return null;

  const boxes = `${itemCount} ${itemCount === 1 ? 'box' : 'boxes'}`;

  return (
    <div
      role="region"
      aria-label="Order summary"
      className={cx('bc-sticky-order-bar', className)}
      {...rest}
    >
      <div className="bc-sticky-order-bar__inner">
        <div className="bc-sticky-order-bar__summary">
          <span className="bc-sticky-order-bar__meta bc-label">
            <span className="bc-tnum">{boxes}</span>
            <span className="bc-sticky-order-bar__dot" aria-hidden="true">
              &middot;
            </span>
            {totalLabel}
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="bc-sticky-order-bar__clear"
                aria-label="Clear cart"
              >
                {clearLabel}
              </button>
            )}
          </span>
          <span className="bc-sticky-order-bar__total bc-tnum">
            {formatMoney(total, currency)}
          </span>
        </div>
        <Button
          variant="primary"
          size="large"
          onClick={onCheckout}
          className="bc-sticky-order-bar__cta"
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
