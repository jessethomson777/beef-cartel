import './Field.css';
import { cx } from '../../lib/cx';
import { cloneElement, useId } from 'react';
import type { ReactElement } from 'react';

/** The accessibility/state props Field injects onto its child control. */
interface InjectedControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  invalid?: boolean;
  required?: boolean;
}

export interface FieldProps {
  /** Visible label text — rendered as a <label> wired to the control. */
  label: string;
  /** Override the generated id. Wins over useId() and is wired to the child. */
  htmlFor?: string;
  /** Hint shown under the control. Hidden when an error is present. */
  helper?: string;
  /** Error message — replaces the helper and flips the control to invalid. */
  error?: string;
  /** Adds a brass asterisk and the native required hint to the control. */
  required?: boolean;
  /** Exactly one control element (e.g. <Input />). */
  children: ReactElement<InjectedControlProps>;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  helper,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  const generatedId = useId();
  // NOTE: prefer an explicit htmlFor; fall back to a stable generated id.
  const id = htmlFor ?? generatedId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);
  const describedById = hasError ? errorId : helper ? helperId : undefined;

  const control = cloneElement<InjectedControlProps>(children, {
    id,
    'aria-describedby': describedById,
    'aria-invalid': hasError || undefined,
    invalid: hasError || undefined,
    required: required || undefined,
  });

  return (
    <div className={cx('bc-field', hasError && 'is-invalid', className)}>
      <label className="bc-field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="bc-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {control}

      {hasError ? (
        <p className="bc-field__message bc-field__message--error bc-caption" id={errorId} role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className="bc-field__message bc-field__message--helper bc-caption" id={helperId}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
