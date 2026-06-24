import './ListRow.css';
import { cx } from '../../lib/cx';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react';

/** Brass chevron drawn inline so the row carries no icon dependency. */
function Chevron() {
  return (
    <svg
      className="bc-listrow__chevron"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export interface ListRowProps {
  /** Primary line — bone, .bc-body. */
  title: string;
  /** Secondary line — muted .bc-caption, truncated with ellipsis. */
  subtitle?: string;
  /** Leading slot — avatar, icon, thumbnail. */
  leading?: ReactNode;
  /** Trailing slot — overrides `value` when provided. */
  trailing?: ReactNode;
  /** Shortcut: rendered as trailing tabular-numeral text when `trailing` is absent. */
  value?: string;
  /** Force interactive affordances without supplying onClick/href (e.g. parent handles selection). */
  interactive?: boolean;
  onClick?: () => void;
  /** Renders the row as an anchor. */
  href?: string;
  /** Show the brass chevron. Defaults on for interactive rows, off otherwise. */
  showChevron?: boolean;
  /** 1px bottom hairline. */
  divider?: boolean;
  className?: string;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  value,
  interactive,
  onClick,
  href,
  showChevron,
  divider = true,
  className,
  ...rest
}: ListRowProps &
  Omit<
    HTMLAttributes<HTMLElement> & AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>,
    'title' | 'onClick' | 'href'
  >) {
  // A row is interactive if asked, or if any activation handler is supplied.
  const isInteractive = Boolean(interactive || onClick || href);
  // Chevron defaults to on for interactive rows, off for static ones.
  const chevron = showChevron ?? isInteractive;

  const rootClass = cx(
    'bc-listrow',
    isInteractive && 'bc-listrow--interactive',
    divider && 'bc-listrow--divider',
    className,
  );

  // The trailing column: explicit node wins; otherwise the `value` shortcut as tabular text.
  const trailingNode = trailing ?? (
    value != null ? (
      <span className="bc-listrow__value bc-body bc-tnum">{value}</span>
    ) : null
  );

  const inner = (
    <>
      {leading && (
        <span className="bc-listrow__leading" aria-hidden="true">
          {leading}
        </span>
      )}
      <span className="bc-listrow__body">
        <span className="bc-listrow__title bc-body">{title}</span>
        {subtitle && (
          <span className="bc-listrow__subtitle bc-caption">{subtitle}</span>
        )}
      </span>
      {trailingNode && <span className="bc-listrow__trailing">{trailingNode}</span>}
      {chevron && <Chevron />}
    </>
  );

  // NOTE: an href takes precedence over onClick — a real link is more semantic and
  // gets native keyboard/middle-click behaviour for free.
  if (href) {
    return (
      <a
        href={href}
        className={rootClass}
        onClick={onClick}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {inner}
      </a>
    );
  }

  if (isInteractive) {
    return (
      <button
        type="button"
        className={rootClass}
        onClick={onClick}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={rootClass} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {inner}
    </div>
  );
}
