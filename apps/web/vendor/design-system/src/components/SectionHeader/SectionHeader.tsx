import './SectionHeader.css';
import { cx } from '../../lib/cx';
import type { HTMLAttributes, ReactNode } from 'react';

export type SectionHeaderLevel = 'h1' | 'h2' | 'h3' | 'h4';
export type SectionHeaderAlign = 'left' | 'center';

export interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  /** The section title — rendered as display serif (bone), scaled by `as`. */
  title: string;
  /** Small brass eyebrow label above the title, e.g. "The Cuts". */
  eyebrow?: string;
  /** Brass chapter number, e.g. "01" or 1 — shown before the eyebrow. */
  index?: string | number;
  /** Trailing element on the title row, e.g. a ghost Button or link. */
  action?: ReactNode;
  /** Heading level for the title element. Default `h2`. */
  as?: SectionHeaderLevel;
  /** `center` centres the eyebrow + title and drops the hairline dash. */
  align?: SectionHeaderAlign;
}

// Map each level to its matching display-type utility class.
const headingClass: Record<SectionHeaderLevel, string> = {
  h1: 'bc-h1',
  h2: 'bc-h2',
  h3: 'bc-h3',
  h4: 'bc-h4',
};

export function SectionHeader({
  title,
  eyebrow,
  index,
  action,
  as = 'h2',
  align = 'left',
  className,
  ...rest
}: SectionHeaderProps) {
  const Heading = as;
  const hasEyebrow = index != null || eyebrow != null;
  const isCenter = align === 'center';
  // NOTE: the hairline dash only reads as a "chapter rule" when both a number
  // and eyebrow text flank it, and only in left alignment. Centre alignment
  // drops it gracefully (number + eyebrow simply sit inline, centred).
  const showDash = !isCenter && index != null && eyebrow != null;

  return (
    <header
      className={cx(
        'bc-section-header',
        `bc-section-header--${align}`,
        className,
      )}
      {...rest}
    >
      {hasEyebrow && (
        <p className="bc-section-header__eyebrow">
          {index != null && (
            // Brass chapter numeral — display serif for an editorial wink.
            <span className="bc-section-header__index bc-tnum">{index}</span>
          )}
          {showDash && (
            <span className="bc-section-header__dash" aria-hidden="true" />
          )}
          {eyebrow != null && (
            <span className="bc-section-header__eyebrow-text bc-label">
              {eyebrow}
            </span>
          )}
        </p>
      )}

      <div className="bc-section-header__row">
        <Heading className={cx('bc-section-header__title', headingClass[as])}>
          {title}
        </Heading>
        {action != null && (
          <div className="bc-section-header__action">{action}</div>
        )}
      </div>
    </header>
  );
}
