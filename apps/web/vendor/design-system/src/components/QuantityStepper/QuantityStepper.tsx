import './QuantityStepper.css';
import { cx } from '../../lib/cx';
import type { HTMLAttributes } from 'react';

export type QuantityStepperSize = 'default' | 'compact';

export interface QuantityStepperProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current quantity. CONTROLLED — render what you store. */
  value: number;
  /** Called with the clamped next value when minus/plus is pressed. */
  onChange: (next: number) => void;
  /** Floor (inclusive). minus disables at value <= min. */
  min?: number;
  /** Ceiling (inclusive). plus disables at value >= max. Omit for no ceiling. */
  max?: number;
  /** `compact` shrinks the control for dense rows (cart lines). */
  size?: QuantityStepperSize;
  /** Disables the whole control. */
  disabled?: boolean;
  /** Names the group for assistive tech, e.g. "Ribeye quantity". */
  'aria-label'?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  size = 'default',
  disabled = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: QuantityStepperProps) {
  const hasMax = max != null;
  const atMin = value <= min;
  const atMax = hasMax && value >= max;

  // Clamp in the handlers so a held key / double-tap can never overshoot.
  const decrease = () => {
    if (disabled) return;
    const next = Math.max(min, value - 1);
    if (next !== value) onChange(next);
  };
  const increase = () => {
    if (disabled) return;
    const ceil = hasMax ? max : Infinity;
    const next = Math.min(ceil, value + 1);
    if (next !== value) onChange(next);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx(
        'bc-stepper',
        size === 'compact' && 'bc-stepper--compact',
        disabled && 'is-disabled',
        className,
      )}
      {...rest}
    >
      <button
        type="button"
        className="bc-stepper__btn bc-stepper__btn--minus"
        aria-label="Decrease quantity"
        onClick={decrease}
        disabled={disabled || atMin}
      >
        {/* U+2212 MINUS SIGN — true minus, not a hyphen. */}
        <span className="bc-stepper__glyph" aria-hidden="true">
          &#x2212;
        </span>
      </button>

      <span className="bc-stepper__value bc-tnum" aria-live="polite">
        {value}
      </span>

      <button
        type="button"
        className="bc-stepper__btn bc-stepper__btn--plus"
        aria-label="Increase quantity"
        onClick={increase}
        disabled={disabled || atMax}
      >
        {/* U+002B PLUS SIGN. */}
        <span className="bc-stepper__glyph" aria-hidden="true">
          &#x2B;
        </span>
      </button>
    </div>
  );
}
