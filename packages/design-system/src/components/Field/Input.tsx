import './Input.css';
import { cx } from '../../lib/cx';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visual + aria error state. Wire from a <Field error> or set directly. */
  invalid?: boolean;
  /** Trailing adornment baked into the well — e.g. a unit like 'kg' or '$'. */
  affix?: ReactNode;
  /** Leading adornment inside the well — typically an icon. */
  leadingIcon?: ReactNode;
}

export function Input({
  invalid = false,
  affix,
  leadingIcon,
  disabled,
  className,
  ...rest
}: InputProps) {
  // NOTE: the well wrapper carries the border/background/focus chrome so the
  // leading icon + trailing affix sit *inside* the recessed field. :focus-within
  // mirrors the input's focus so the whole well lights up as one control.
  return (
    <div
      className={cx(
        'bc-input',
        invalid && 'is-invalid',
        disabled && 'is-disabled',
        className,
      )}
    >
      {leadingIcon && (
        <span className="bc-input__icon bc-input__icon--leading" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        className="bc-input__control"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {affix && <span className="bc-input__affix">{affix}</span>}
    </div>
  );
}
