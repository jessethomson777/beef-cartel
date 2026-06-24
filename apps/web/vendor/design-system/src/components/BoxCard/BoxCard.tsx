import './BoxCard.css';
import { cx } from '../../lib/cx';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { GradeBadge } from '../GradeBadge';
import { PriceBlock } from '../PriceBlock';
import { QuantityStepper } from '../QuantityStepper';

export interface BoxCardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Product name — rendered as the card's heading (.bc-h3, display serif). */
  name: string;
  /** Product photo. Omit for the matte "BEEF CARTEL" monogram fallback. */
  image?: string;
  /** Marble grade — passed straight to the overlaid GradeBadge. */
  grade: string | number;
  /** Estimated weight range, e.g. "1.2-1.5 kg". */
  weightRange: string;
  /** Optional subtitle, e.g. "Grain-fed · 200-day". */
  cut?: string;
  /** Deposit charged now (passed to PriceBlock). */
  deposit: number;
  /** Balance charged on dispatch (passed to PriceBlock). */
  balance: number;
  /** Current quantity in the order. */
  quantity: number;
  onQuantityChange: (n: number) => void;
  /** Dim the image, badge it, and lock the stepper at 0-buy. */
  soldOut?: boolean;
  /** Optional whole-card affordance (e.g. open detail). The stepper stops propagation. */
  onClick?: () => void;
}

export function BoxCard({
  name,
  image,
  grade,
  weightRange,
  cut,
  deposit,
  balance,
  quantity,
  onQuantityChange,
  soldOut = false,
  onClick,
  className,
  ...rest
}: BoxCardProps) {
  // NOTE: clickable cards still expose semantic controls inside; we keep the
  // article semantics and add role/tabIndex only when an onClick is supplied,
  // rather than nesting a <button> around interactive children (invalid).
  const interactive = Boolean(onClick) && !soldOut;

  return (
    <article
      className={cx(
        'bc-boxcard',
        interactive && 'bc-boxcard--interactive',
        soldOut && 'is-sold-out',
        className,
      )}
      aria-disabled={soldOut || undefined}
      {...(interactive
        ? {
            role: 'button',
            tabIndex: 0,
            onClick,
            onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            },
          }
        : null)}
      {...rest}
    >
      <div className="bc-boxcard__media">
        {image ? (
          <img className="bc-boxcard__image" src={image} alt="" loading="lazy" />
        ) : (
          // NOTE: brass monogram fallback — brass-on-dark only, never brass-on-bone.
          <div className="bc-boxcard__fallback" aria-hidden="true">
            <span className="bc-boxcard__monogram">BC</span>
            <span className="bc-label bc-boxcard__wordmark">Beef Cartel</span>
          </div>
        )}

        <div className="bc-boxcard__badge">
          <GradeBadge grade={grade} />
        </div>

        {soldOut && (
          <span className="bc-boxcard__soldout bc-label">Sold Out</span>
        )}
      </div>

      <div className="bc-boxcard__body">
        <header className="bc-boxcard__head">
          <h3 className="bc-h3 bc-boxcard__name">{name}</h3>
          {cut && <p className="bc-caption bc-muted bc-boxcard__cut">{cut}</p>}
        </header>

        <p className="bc-boxcard__weight">
          <span className="bc-label bc-accent-ink bc-boxcard__weight-label">Est. Weight</span>
          <span className="bc-boxcard__dot" aria-hidden="true" />
          <span className="bc-caption bc-muted bc-tnum">{weightRange}</span>
        </p>

        <PriceBlock deposit={deposit} balance={balance} />

        <footer className="bc-boxcard__footer">
          <span className="bc-label bc-muted bc-boxcard__qty-label" id={`qty-${slug(name)}`}>
            Qty
          </span>
          <QuantityStepper
            value={quantity}
            onChange={onQuantityChange}
            min={0}
            disabled={soldOut}
            aria-labelledby={`qty-${slug(name)}`}
          />
        </footer>
      </div>
    </article>
  );
}

// NOTE: tiny local helper for a stable label id — no token/util exists for this.
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
