import './Wordmark.css';
import { cx } from '../../lib/cx';
import type { HTMLAttributes, ElementType } from 'react';

export type WordmarkSize = 'sm' | 'md' | 'lg';
export type WordmarkLayout = 'inline' | 'stacked';

export interface WordmarkProps extends HTMLAttributes<HTMLElement> {
  /** sm ≈ h4 · md ≈ h2 · lg ≈ display. Default `md`. */
  size?: WordmarkSize;
  /** `inline` = BEEF ◆ CARTEL · `stacked` = BEEF / hairline / CARTEL. Default `inline`. */
  layout?: WordmarkLayout;
  /** Shows the brand eyebrow above the mark (see TAGLINE). */
  showTagline?: boolean;
  /** Override the eyebrow text. Defaults to TAGLINE. */
  tagline?: string;
  /** Root element tag. Default `span` (inline-safe). */
  as?: ElementType;
}

// NOTE: brand copy lives here as a constant so the mark reads identically everywhere.
const TAGLINE = 'PRIVATE WAGYU · STRAIGHT FROM THE SOURCE';

export function Wordmark({
  size = 'md',
  layout = 'inline',
  showTagline = false,
  tagline = TAGLINE,
  as,
  className,
  ...rest
}: WordmarkProps) {
  const Root = (as ?? 'span') as ElementType;
  return (
    <Root
      className={cx(
        'bc-wordmark',
        `bc-wordmark--${size}`,
        `bc-wordmark--${layout}`,
        className,
      )}
      role="img"
      aria-label="Beef Cartel"
      {...rest}
    >
      {showTagline && (
        // aria-hidden: the accessible name already says "Beef Cartel"; the eyebrow is decorative.
        <span className="bc-wordmark__tagline" aria-hidden="true">
          {tagline}
        </span>
      )}
      <span className="bc-wordmark__lockup" aria-hidden="true">
        <span className="bc-wordmark__word">BEEF</span>
        {/* inline → brass diamond · stacked → CSS handles a hairline rule instead */}
        <span className="bc-wordmark__divider" aria-hidden="true" />
        <span className="bc-wordmark__word">CARTEL</span>
      </span>
    </Root>
  );
}
