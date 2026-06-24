import './Button.css';
import { cx } from '../../lib/cx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'default' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = oxblood fill · secondary = brass outline · ghost = bare ink */
  variant?: ButtonVariant;
  /** `large` is the sticky checkout CTA height (54px). */
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction while keeping width stable. */
  loading?: boolean;
  /** Stretch to fill the container (sticky bars, forms). */
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      // Default to type="button" so a Button inside a form never submits by surprise.
      type={type ?? 'button'}
      className={cx(
        'bc-button',
        `bc-button--${variant}`,
        size === 'large' && 'bc-button--large',
        fullWidth && 'bc-button--block',
        loading && 'is-loading',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="bc-button__spinner" aria-hidden="true" />}
      <span className="bc-button__content">
        {leadingIcon && (
          <span className="bc-button__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        {children}
        {trailingIcon && (
          <span className="bc-button__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </span>
    </button>
  );
}
