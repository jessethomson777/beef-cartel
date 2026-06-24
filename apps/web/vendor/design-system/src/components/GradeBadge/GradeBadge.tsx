import './GradeBadge.css';
import { cx } from '../../lib/cx';
import type { HTMLAttributes, ReactNode } from 'react';

export type GradeBadgeVariant = 'outline' | 'solid';
export type GradeBadgeSize = 'sm' | 'md';

export interface GradeBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Explicit content. Wins over `grade` when provided (e.g. '9+'). */
  children?: ReactNode;
  /** The MSA marbling grade, used when no children are given (e.g. 6 or '7'). */
  grade?: string | number;
  /** Optional label before the grade, e.g. 'MSA'. Default none. */
  prefix?: string;
  /** outline = brass-on-dark tag (default) · solid = filled brass for premium grades. */
  variant?: GradeBadgeVariant;
  /** sm = compact overlay tag (default) · md = slightly larger. */
  size?: GradeBadgeSize;
}

export function GradeBadge({
  children,
  grade,
  prefix,
  variant = 'outline',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  ...rest
}: GradeBadgeProps) {
  // children wins; otherwise fall back to the numeric/string grade raw.
  const value = children ?? grade;

  // Build a readable label only when we can describe a real grade and the
  // caller hasn't supplied one. Prefix (e.g. "MSA") reads naturally as
  // "MSA grade 6"; with no prefix we still say "grade 6".
  // NOTE: skip the auto-label for custom children (could be anything) to avoid
  // announcing something misleading — caller can pass aria-label explicitly.
  const autoLabel =
    grade != null && children == null
      ? `${prefix ? `${prefix} ` : ''}grade ${grade}`
      : undefined;

  return (
    <span
      className={cx(
        'bc-grade-badge',
        `bc-grade-badge--${variant}`,
        `bc-grade-badge--${size}`,
        'bc-label',
        className,
      )}
      aria-label={ariaLabel ?? autoLabel}
      {...rest}
    >
      {prefix && <span className="bc-grade-badge__prefix">{prefix}</span>}
      <span className="bc-grade-badge__value bc-tnum">{value}</span>
    </span>
  );
}
